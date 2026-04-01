const mongoose = require('mongoose');

const PROCESSING_STATUS = ['pending', 'processing', 'completed', 'failed'];
const SENSITIVITY_STATUS = ['unanalysed', 'safe', 'flagged'];

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    // Owner of the video
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Multi-tenant isolation
    organisation: {
      type: String,
      required: true,
      index: true,
    },
    // File metadata
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true, // bytes
    },
    // Video metadata (populated after FFmpeg probe)
    duration: Number,   // seconds
    width: Number,
    height: Number,
    bitrate: Number,
    codec: String,
    fps: Number,
    thumbnailPath: String,

    // Processing pipeline
    processingStatus: {
      type: String,
      enum: PROCESSING_STATUS,
      default: 'pending',
      index: true,
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    processingStage: {
      type: String,
      default: 'Queued',
    },
    processingError: String,
    processedAt: Date,

    // Sensitivity analysis
    sensitivityStatus: {
      type: String,
      enum: SENSITIVITY_STATUS,
      default: 'unanalysed',
      index: true,
    },
    sensitivityScore: {
      type: Number,  // 0–1 confidence that content is flagged
      min: 0,
      max: 1,
    },
    sensitivityReason: String,

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // User-defined tags
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual: human-readable file size
videoSchema.virtual('fileSizeMB').get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Compound index for fast user-scoped queries
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ organisation: 1, sensitivityStatus: 1 });

videoSchema.statics.PROCESSING_STATUS = PROCESSING_STATUS;
videoSchema.statics.SENSITIVITY_STATUS = SENSITIVITY_STATUS;

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;
