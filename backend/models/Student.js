const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  entryTime: {
    type: Date,
    default: Date.now,
  },
  exitTime: {
    type: Date,
  },
  exitRequested: {
    type: Boolean,
    default: false,
  },
  exitApproved: {
    type: Boolean,
    default: false,
  },
  hasExited: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model("Student", studentSchema);
