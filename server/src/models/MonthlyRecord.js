const mongoose = require('mongoose');

const monthlyRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    month: {
      type: String,
      required: [true, 'Month in YYYY-MM format is required'],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
    },
    compositeScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scoreDelta: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one record per student per month
monthlyRecordSchema.index({ studentId: 1, month: 1 }, { unique: true });
monthlyRecordSchema.index({ month: 1, compositeScore: -1 });
monthlyRecordSchema.index({ month: 1, scoreDelta: -1 });

module.exports = mongoose.model('MonthlyRecord', monthlyRecordSchema);
