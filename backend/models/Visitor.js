const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VisitorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date
  },
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

module.exports = mongoose.model('Visitor', VisitorSchema);

