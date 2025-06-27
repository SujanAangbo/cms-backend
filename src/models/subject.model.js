const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  credits: {
    type: Number,
    default: 3,
    min: 1
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  description: {
    type: String
  },
  syllabus: {
    type: String
  },
  prerequisites: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    }
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, {
  timestamps: true
});

// Index for faster queries
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ teacher: 1 });

// Virtual for student count
subjectSchema.virtual('studentCount').get(function() {
  return this.enrolledStudents.length;
});

// Method to check if a student is enrolled
subjectSchema.methods.isStudentEnrolled = function(studentId) {
  return this.enrolledStudents.includes(studentId);
};

// Method to enroll a student
subjectSchema.methods.enrollStudent = async function(studentId) {
  if (!this.isStudentEnrolled(studentId)) {
    this.enrolledStudents.push(studentId);
    await this.save();
    return true;
  }
  return false;
};

// Method to remove a student
subjectSchema.methods.removeStudent = async function(studentId) {
  if (this.isStudentEnrolled(studentId)) {
    this.enrolledStudents = this.enrolledStudents.filter(
      id => !id.equals(studentId)
    );
    await this.save();
    return true;
  }
  return false;
};

// Static method to get subjects by department and semester
subjectSchema.statics.getSubjectsByDepartmentAndSemester = function(department, semester) {
  return this.find({
    department,
    semester,
    isActive: true
  }).populate('teacher', 'firstName lastName');
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;