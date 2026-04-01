const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const { processVideo } = require('../services/videoProcessor');

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * POST /api/videos/upload
 * Multer middleware runs first (see route). This handler persists
 * the record then kicks off async processing.
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const { title, description, tags } = req.body;

    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      owner: req.user._id,
      organisation: req.user.organisation,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      processingStatus: 'pending',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    // Respond immediately — processing happens in the background
    res.status(201).json({ success: true, video });

    // Fire-and-forget async processing (won't block the response)
    processVideo(video._id.toString(), req.user._id.toString()).catch((err) =>
      console.error('Background processing error:', err)
    );
  } catch (error) {
    next(error);
  }
};

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/videos
 * Supports query params:
 *   status         (pending|processing|completed|failed)
 *   sensitivity    (safe|flagged|unanalysed)
 *   page           (default 1)
 *   limit          (default 20, max 100)
 *   search         (title substring)
 */
const listVideos = async (req, res, next) => {
  try {
    const {
      status,
      sensitivity,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isDeleted: false };

    // Admins see all org videos; editors/viewers see only their own
    if (req.user.role === 'admin') {
      filter.organisation = req.user.organisation;
    } else {
      filter.owner = req.user._id;
    }

    if (status) filter.processingStatus = status;
    if (sensitivity) filter.sensitivityStatus = sensitivity;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page, 10) - 1) * Math.min(parseInt(limit, 10), 100);
    const take = Math.min(parseInt(limit, 10), 100);

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate('owner', 'name email'),
      Video.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take),
      videos,
    });
  } catch (error) {
    next(error);
  }
};

// ── Single video ──────────────────────────────────────────────────────────────

/**
 * GET /api/videos/:id
 */
const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('owner', 'name email');

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Access control: viewers/editors only see own videos; admins see all in org
    if (
      req.user.role !== 'admin' &&
      video.owner._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ── Streaming ─────────────────────────────────────────────────────────────────

/**
 * GET /api/videos/:id/stream
 * Supports HTTP Range requests for seekable playback.
 */
const streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Only stream completed videos
    if (video.processingStatus !== 'completed') {
      return res.status(409).json({
        success: false,
        message: `Video is not ready for streaming (status: ${video.processingStatus})`,
      });
    }

    // Access control
    if (
      req.user.role !== 'admin' &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = video.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Video file not found on disk' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      // ── Partial content (seekable) ────────────────────────────
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return res
          .status(416)
          .set('Content-Range', `bytes */${fileSize}`)
          .end();
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
      });

      fileStream.pipe(res);
    } else {
      // ── Full file ─────────────────────────────────────────────
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

// ── Thumbnail ─────────────────────────────────────────────────────────────────

/**
 * GET /api/videos/:id/thumbnail
 */
const getThumbnail = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video || video.isDeleted) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (
      req.user.role !== 'admin' &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!video.thumbnailPath || !fs.existsSync(video.thumbnailPath)) {
      return res.status(404).json({ success: false, message: 'Thumbnail not available' });
    }

    res.sendFile(path.resolve(video.thumbnailPath));
  } catch (error) {
    next(error);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/videos/:id
 * Editors/admins can update title, description, tags.
 */
const updateVideo = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    const video = await Video.findOne({ _id: req.params.id, isDeleted: false });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (
      req.user.role !== 'admin' &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (tags !== undefined) {
      video.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await video.save();
    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/videos/:id
 * Soft-deletes the record; editors delete own, admins delete any in org.
 */
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, isDeleted: false });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (
      req.user.role !== 'admin' &&
      video.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    video.isDeleted = true;
    await video.save();

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ── Stats (admin) ─────────────────────────────────────────────────────────────

/**
 * GET /api/videos/stats
 */
const getStats = async (req, res, next) => {
  try {
    const orgFilter = { isDeleted: false, organisation: req.user.organisation };

    const [statusCounts, sensitivityCounts, totalSize] = await Promise.all([
      Video.aggregate([
        { $match: orgFilter },
        { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
      ]),
      Video.aggregate([
        { $match: { ...orgFilter, processingStatus: 'completed' } },
        { $group: { _id: '$sensitivityStatus', count: { $sum: 1 } } },
      ]),
      Video.aggregate([
        { $match: orgFilter },
        { $group: { _id: null, total: { $sum: '$fileSize' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        bySensitivity: sensitivityCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        totalStorageBytes: totalSize[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  listVideos,
  getVideo,
  streamVideo,
  getThumbnail,
  updateVideo,
  deleteVideo,
  getStats,
};
