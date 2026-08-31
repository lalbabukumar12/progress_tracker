const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: false,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value instanceof Date && !isNaN(value.getTime()) && value < new Date();
        },
        message: 'Date of birth must be a valid past date',
      },
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    leetcodeUsername: {
      type: String,
      trim: true,
      default: '',
    },
    codeforcesUsername: {
      type: String,
      trim: true,
      default: '',
    },
    githubUsername: {
      type: String,
      trim: true,
      default: '',
    },
    gfgUsername: {
      type: String,
      trim: true,
      default: '',
    },
    codechefUsername: {
      type: String,
      trim: true,
      default: '',
    },
    problemsSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to return public JSON representation (excludes dob)
studentSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.dob;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);
