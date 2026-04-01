const express = require('express');
const router = express.Router();

const {
  uploadVideo,
  listVideos,
  getVideo,
  streamVideo,
  getThumbnail,
  updateVideo,
  deleteVideo,
  getStats,
} = require('../controllers/videoController');

const { authenticate, authorise } = require('../middleware/auth');
const upload = require('../config/multer');

router.use(authenticate);

router.get('/stats', authorise('admin'), getStats);

router.post(
  '/upload',
  authorise('editor', 'admin'),
  (req, res, next) => {
    upload.single('video')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  uploadVideo
);

// List videos
router.get('/', listVideos);

// Single video
router.get('/:id', getVideo);

// Stream (range-request capable)
router.get('/:id/stream', streamVideo);

// Thumbnail
router.get('/:id/thumbnail', getThumbnail);

router.patch('/:id', authorise('editor', 'admin'), updateVideo);

router.delete('/:id', authorise('editor', 'admin'), deleteVideo);

module.exports = router;
