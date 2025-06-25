const { asyncHandler, successResponse, APIError, getPagination } = require('../utils/response.util');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Subject = require('../models/subject.model');
const Attendance = require('../models/attendance.model');
const Notice = require('../models/notice.model');

/**
 * @desc    Get teacher profile
 * @route   GET /api/teacher/profile
 * @access  Private (Teacher)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id })
    .populate('user', '-password')
    .populate('subjects', 'name code')
    .lean();

  if (!teacher) {
    throw new APIError('Teacher profile not found', 404);
  }

  successResponse(res, 200, 'Teacher profile retrieved successfully', teacher);
});

/**
 * @desc    Update teacher profile
 * @route   PUT /api/teacher/profile
 * @access  Private (Teacher)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['qualification', 'experience'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (Object.keys(updates).length === 0) {
    throw new APIError('No valid update fields provided', 400);
  }

  const teacher = await Teacher.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  )
    .populate('user', '-password')
    .populate('subjects', 'name code');

  if (!teacher) {
    throw new APIError('Teacher profile not found', 404);
  }

  successResponse(res, 200, 'Profile updated successfully', teacher);
});

/**
 * @desc    Get teacher notices
 * @route   GET /api/teacher/notices
 * @access  Private (Teacher)
 */
exports.getNotices = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  if (!teacher) {
    throw new APIError('Teacher profile not found', 404);
  }

  const query = {
    isActive: true,
    expiryDate: { $gt: new Date() },
    $or: [
      { targetAudience: 'ALL' },
      { targetAudience: 'TEACHERS' },
      {
        targetAudience: 'DEPARTMENT',
        department: teacher.department
      }
    ]
  };

  const notices = await Notice.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('createdBy', 'firstName lastName');

  successResponse(res, 200, 'Notices retrieved successfully', notices);
});

/**
 * @desc    Get students by subject
 * @route   GET /api/teacher/students
 * @access  Private (Teacher)
 */
exports.getStudents = asyncHandler(async (req, res) => {
  const { subjectId } = req.query;
  if (!subjectId) {
    throw new APIError('Subject ID is required', 400);
  }

  const subject = await Subject.findOne({
    _id: subjectId,
    teacher: req.user._id
  });

  if (!subject) {
    throw new APIError('Subject not found or unauthorized', 404);
  }

  const students = await Student.find({
    _id: { $in: subject.enrolledStudents }
  })
    .populate('user', 'firstName lastName email')
    .select('studentId rollNumber');

  successResponse(res, 200, 'Students retrieved successfully', students);
});

/**
 * @desc    Mark attendance
 * @route   POST /api/teacher/attendance
 * @access  Private (Teacher)
 */
exports.markAttendance = asyncHandler(async (req, res) => {
  const { subjectId, date, attendanceData } = req.body;

  const subject = await Subject.findOne({
    _id: subjectId,
    teacher: req.user._id
  });

  if (!subject) {
    throw new APIError('Subject not found or unauthorized', 404);
  }

  // Validate attendance data
  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    throw new APIError('Invalid attendance data', 400);
  }

  // Create attendance records
  const attendanceRecords = attendanceData.map(record => ({
    student: record.studentId,
    subject: subjectId,
    teacher: req.user._id,
    date,
    status: record.status,
    remarks: record.remarks
  }));

  await Attendance.insertMany(attendanceRecords);

  successResponse(res, 201, 'Attendance marked successfully');
});

/**
 * @desc    Update attendance
 * @route   PUT /api/teacher/attendance/:id
 * @access  Private (Teacher)
 */
exports.updateAttendance = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const attendance = await Attendance.findOne({
    _id: req.params.id,
    teacher: req.user._id
  });

  if (!attendance) {
    throw new APIError('Attendance record not found or unauthorized', 404);
  }

  attendance.status = status;
  attendance.remarks = remarks;
  await attendance.save();

  successResponse(res, 200, 'Attendance updated successfully', attendance);
});

/**
 * @desc    Get class attendance
 * @route   GET /api/teacher/attendance/class/:subjectId
 * @access  Private (Teacher)
 */
exports.getClassAttendance = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { startDate, endDate } = req.dateRange;

  const subject = await Subject.findOne({
    _id: subjectId,
    teacher: req.user._id
  });

  if (!subject) {
    throw new APIError('Subject not found or unauthorized', 404);
  }

  const attendance = await Attendance.find({
    subject: subjectId,
    date: { $gte: startDate, $lte: endDate }
  })
    .populate('student', 'studentId rollNumber')
    .populate('student.user', 'firstName lastName')
    .sort({ date: -1 });

  const attendanceSummary = await Attendance.aggregate([
    {
      $match: {
        subject: subject._id,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] }
        },
        late: {
          $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'users',
        localField: 'student.user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        student: {
          id: '$student._id',
          studentId: '$student.studentId',
          rollNumber: '$student.rollNumber',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }
        },
        total: 1,
        present: 1,
        absent: 1,
        late: 1,
        attendancePercentage: {
          $multiply: [
            { $divide: ['$present', '$total'] },
            100
          ]
        }
      }
    }
  ]);

  successResponse(res, 200, 'Class attendance retrieved successfully', {
    attendance,
    summary: attendanceSummary
  });
});