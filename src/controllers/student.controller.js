const { asyncHandler, successResponse, APIError, getPagination } = require('../utils/response.util');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const Attendance = require('../models/attendance.model');
const Notice = require('../models/notice.model');

/**
 * @desc    Get student profile
 * @route   GET /api/student/profile
 * @access  Private (Student)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', '-password')
    .lean();

  if (!student) {
    throw new APIError('Student profile not found', 404);
  }

  successResponse(res, 200, 'Student profile retrieved successfully', student);
});

/**
 * @desc    Update student profile
 * @route   PUT /api/student/profile
 * @access  Private (Student)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['address', 'parentContact'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (Object.keys(updates).length === 0) {
    throw new APIError('No valid update fields provided', 400);
  }

  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('user', '-password');

  if (!student) {
    throw new APIError('Student profile not found', 404);
  }

  successResponse(res, 200, 'Profile updated successfully', student);
});

/**
 * @desc    Get student notices
 * @route   GET /api/student/notices
 * @access  Private (Student)
 */
exports.getNotices = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    throw new APIError('Student profile not found', 404);
  }
  
  const query = {
    isActive: true,
    expiryDate: { $gt: new Date() },
    $or: [
      { targetAudience: 'ALL' },
      { targetAudience: 'STUDENTS' },
      {
        targetAudience: 'DEPARTMENT',
        department: student.department
      }
    ]
  };

  const notices = await Notice.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('createdBy', 'firstName lastName');

  successResponse(res, 200, 'Notices retrieved successfully', notices);
});

/**
 * @desc    Get student attendance
 * @route   GET /api/student/attendance
 * @access  Private (Student)
 */
exports.getAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    throw new APIError('Student profile not found', 404);
  }

  const { startDate, endDate } = req.dateRange;
  const { subjectId } = req.query;

  const query = {
    student: student._id,
    date: { $gte: startDate, $lte: endDate }
  };

  if (subjectId) {
    query.subject = subjectId;
  }

  const attendance = await Attendance.find(query)
    .populate('subject', 'name code')
    .populate('teacher', 'firstName lastName')
    .sort({ date: -1 });

  successResponse(res, 200, 'Attendance records retrieved successfully', attendance);
});

/**
 * @desc    Get student attendance summary
 * @route   GET /api/student/attendance/summary
 * @access  Private (Student)
 */
exports.getAttendanceSummary = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    throw new APIError('Student profile not found', 404);
  }

  const { subjectId } = req.query;
  const query = { student: student._id };

  if (subjectId) {
    query.subject = subjectId;
  }

  const attendanceStats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$subject',
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
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject'
      }
    },
    { $unwind: '$subject' },
    {
      $project: {
        subject: { name: '$subject.name', code: '$subject.code' },
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

  successResponse(res, 200, 'Attendance summary retrieved successfully', attendanceStats);
});