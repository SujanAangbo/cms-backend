const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LATE'],
    required: true
  },
  remarks: {
    type: String
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique attendance records
attendanceSchema.index(
  { student: 1, subject: 1, date: 1 },
  { unique: true }
);

// Index for faster queries
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ subject: 1, date: 1 });

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = function(studentId, startDate, endDate) {
  return this.find({
    student: studentId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('subject', 'name code');
};

// Static method to get attendance summary
attendanceSchema.statics.getAttendanceSummary = async function(studentId, subjectId) {
  const summary = await this.aggregate([
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        subject: mongoose.Types.ObjectId(subjectId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = summary.reduce((acc, curr) => acc + curr.count, 0);
  const present = summary.find(s => s._id === 'PRESENT')?.count || 0;
  const late = summary.find(s => s._id === 'LATE')?.count || 0;

  return {
    total,
    present,
    late,
    absent: total - present - late,
    attendancePercentage: total ? ((present + late) / total) * 100 : 0
  };
};

// Static method to mark bulk attendance
attendanceSchema.statics.markBulkAttendance = async function(attendanceRecords) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const operations = attendanceRecords.map(record => ({
      updateOne: {
        filter: {
          student: record.student,
          subject: record.subject,
          date: record.date
        },
        update: {
          $set: {
            status: record.status,
            remarks: record.remarks,
            teacher: record.teacher,
            lastModifiedBy: record.lastModifiedBy
          }
        },
        upsert: true
      }
    }));

    await this.bulkWrite(operations, { session });
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;