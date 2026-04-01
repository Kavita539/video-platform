const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs');

const Video = require('../models/Video');
const { emitProgress } = require('../config/socket');

// Point fluent-ffmpeg at the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const probeVideo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata);
    });
  });
};

const generateThumbnail = (filePath, outputDir, filename, timestamp = '00:00:01') => {
  return new Promise((resolve, reject) => {
    const thumbName = `thumb_${filename}.jpg`;
    const thumbPath = path.join(outputDir, thumbName);

    ffmpeg(filePath)
      .screenshots({
        timestamps: [timestamp],
        filename: thumbName,
        folder: outputDir,
        size: '320x?',
      })
      .on('end', () => resolve(thumbPath))
      .on('error', (err) => {
        // Non-fatal — some videos may not support thumbnailing
        console.warn('Thumbnail generation failed:', err.message);
        resolve(null);
      });
  });
};

const analyseSensitivity = async (videoId, metadata) => {
  // Simulate async ML processing (1–3 seconds)
  await sleep(1000 + Math.random() * 2000);

  const isFlagged = Math.random() < 0.15; // ~15% flagged rate for demo
  const score = isFlagged
    ? 0.65 + Math.random() * 0.35   // 0.65–1.0
    : Math.random() * 0.25;          // 0.0–0.25

  return {
    sensitivityStatus: isFlagged ? 'flagged' : 'safe',
    sensitivityScore: parseFloat(score.toFixed(3)),
    sensitivityReason: isFlagged
      ? 'Potentially sensitive content detected by automated screening'
      : null,
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const processVideo = async (videoId, userId) => {
  let video;

  const updateProgress = async (stage, progress, status = 'processing') => {
    await Video.findByIdAndUpdate(videoId, {
      processingStage: stage,
      processingProgress: progress,
      processingStatus: status,
    });
    emitProgress(userId, videoId, { stage, progress, status });
  };

  try {
    video = await Video.findById(videoId);
    if (!video) throw new Error('Video record not found');

    await updateProgress('Probing video metadata', 10);

    // ── Stage 1: Probe ────────────────────────────────────────────
    let metadata;
    try {
      metadata = await probeVideo(video.filePath);
    } catch (probeErr) {
      throw new Error(`FFprobe failed: ${probeErr.message}`);
    }

    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
    const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

    const probeData = {
      duration: metadata.format.duration
        ? parseFloat(metadata.format.duration)
        : null,
      width: videoStream?.width,
      height: videoStream?.height,
      bitrate: metadata.format.bit_rate
        ? parseInt(metadata.format.bit_rate, 10)
        : null,
      codec: videoStream?.codec_name,
      fps: videoStream?.r_frame_rate
        ? eval(videoStream.r_frame_rate) // "30/1" → 30
        : null,
    };

    await Video.findByIdAndUpdate(videoId, probeData);
    await updateProgress('Generating thumbnail', 30);

    const outputDir = path.dirname(video.filePath);
    const thumbPath = await generateThumbnail(
      video.filePath,
      outputDir,
      video.filename
    );

    if (thumbPath) {
      await Video.findByIdAndUpdate(videoId, { thumbnailPath: thumbPath });
    }

    await updateProgress('Analysing content sensitivity', 60);

    // ── Stage 3: Sensitivity analysis ────────────────────────────
    const sensitivityResult = await analyseSensitivity(videoId, metadata);

    await Video.findByIdAndUpdate(videoId, {
      ...sensitivityResult,
      processingStatus: 'completed',
      processingProgress: 100,
      processingStage: 'Complete',
      processedAt: new Date(),
    });

    emitProgress(userId, videoId, {
      stage: 'Complete',
      progress: 100,
      status: 'completed',
      sensitivityStatus: sensitivityResult.sensitivityStatus,
    });

    console.log(`Video processed: ${videoId} — ${sensitivityResult.sensitivityStatus}`);

  } catch (error) {
    console.error(`Processing failed for video ${videoId}:`, error.message);

    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'failed',
      processingStage: 'Failed',
      processingProgress: 0,
      processingError: error.message,
    });

    emitProgress(userId, videoId, {
      stage: 'Failed',
      progress: 0,
      status: 'failed',
      message: error.message,
    });
  }
};

module.exports = { processVideo, probeVideo, generateThumbnail };
