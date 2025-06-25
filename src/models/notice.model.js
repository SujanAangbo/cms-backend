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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['ALL', 'STUDENTS', 'TEACHERS', 'DEPARTMENT'],
    default: 'ALL'
  },
  department: {
    type: String,
    required: function() {
      return this.targetAudience === 'DEPARTMENT';
    }
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
noticeSchema.index({ targetAudience: 1, department: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ isActive: 1 });

// Virtual for viewCount
noticeSchema.virtual('viewCount').get(function() {
  return this.viewedBy.length;
});

// Method to check if a notice is expired
noticeSchema.methods.isExpired = function() {
  return this.expiryDate && this.expiryDate < new Date();
};

// Method to mark notice as viewed by a user
noticeSchema.methods.markAsViewed = async function(userId) {
  if (!this.viewedBy.some(view => view.user.equals(userId))) {
    this.viewedBy.push({ user: userId });
    await this.save();
  }
};

// Static method to get active notices for a specific audience and department
noticeSchema.statics.getActiveNotices = function(audience, department = null) {
  const query = {
    isActive: true,
    $or: [
      { targetAudience: 'ALL' },
      { targetAudience: audience }
    ]
  };

  if (department) {
    query.$or.push({
      targetAudience: 'DEPARTMENT',
      department: department
    });
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('createdBy', 'firstName lastName');
};

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;