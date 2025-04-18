const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: String,
  phone: String,
  purpose: String,
  entryTime: { type: Date, default: Date.now },
  exitTime: Date,
  exitRequested: {
    type: Boolean,
    default: false
  },
  exitApproved: {
    type: Boolean,
    default: false
  },
  hasExited: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Visitor", visitorSchema);
