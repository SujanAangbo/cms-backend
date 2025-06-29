const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  teacherId: {
    type: String,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  subjects: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Pre-save middleware to generate teacherId
teacherSchema.pre('save', async function(next) {
  if (!this.teacherId) {
    // Find the highest existing teacherId
    const highestTeacher = await this.constructor.findOne({}, { teacherId: 1 })
      .sort({ teacherId: -1 })
      .lean();

    let nextNumber = 1;
    if (highestTeacher && highestTeacher.teacherId) {
      // Extract the number from existing highest teacherId (e.g., "TCH001" -> 1)
      const currentNumber = parseInt(highestTeacher.teacherId.replace('TCH', ''));
      nextNumber = currentNumber + 1;
    }

    // Generate the new teacherId with padding (e.g., 1 -> "TCH001")
    this.teacherId = `TCH${nextNumber.toString().padStart(3, '0')}`;
  }
  next();
});

// Index for faster queries
teacherSchema.index({ department: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;