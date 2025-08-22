const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['ALL', 'STUDENTS', 'TEACHERS', 'DEPARTMENT'],
    default: 'ALL'
  },
  attachments: {
    type: String,
  },
}, {
  timestamps: true,

});

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;