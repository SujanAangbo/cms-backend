const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1
  },
  year: {
    type: Number,
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String
  },
  parentContact: {
    type: String
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Pre-save middleware to generate studentId
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    // Find the highest existing studentId
    const highestStudent = await this.constructor.findOne({}, { studentId: 1 })
      .sort({ studentId: -1 })
      .lean();

    let nextNumber = 1;
    if (highestStudent && highestStudent.studentId) {
      // Extract the number from existing highest studentId (e.g., "STU001" -> 1)
      const currentNumber = parseInt(highestStudent.studentId.replace('STU', ''));
      nextNumber = currentNumber + 1;
    }

    // Generate the new studentId with padding (e.g., 1 -> "STU001")
    this.studentId = `STU${nextNumber.toString().padStart(3, '0')}`;
  }
  next();
});

// Index for faster queries
studentSchema.index({ department: 1, semester: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;