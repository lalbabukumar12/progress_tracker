const mongoose = require('mongoose');

const statsSnapshotSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID reference is required'],
    },
    platform: {
      type: String,
      enum: {
        values: ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'],
        message: '{VALUE} is not a supported platform',
      },
      required: [true, 'Platform is required'],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Snapshot data is required'],
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StatsSnapshot', statsSnapshotSchema);
