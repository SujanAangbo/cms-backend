const { asyncHandler, successResponse, APIError, getPagination } = require('../utils/response.util');
const Admin = require('../models/admin.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const Notice = require('../models/notice.model');
const Attendance = require('../models/attendance.model');

/**
 * @desc    Get admin profile
 * @route   GET /api/admin/profile
 * @access  Private (Admin)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ user: req.user._id })
    .populate('user', '-password')
    .lean();

  if (!admin) {
    throw new APIError('Admin profile not found', 404);
  }

  successResponse(res, 200, 'Admin profile retrieved successfully', admin);
});

/**
 * @desc    Update admin profile
 * @route   PUT /api/admin/profile
 * @access  Private (Admin)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['designation'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (Object.keys(updates).length === 0) {
    throw new APIError('No valid update fields provided', 400);
  }

  const admin = await Admin.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('user', '-password');

  if (!admin) {
    throw new APIError('Admin profile not found', 404);
  }

  successResponse(res, 200, 'Profile updated successfully', admin);
});

/**
 * Student Management
 */

exports.getStudents = asyncHandler(async (req, res) => {
  const { department, semester, year } = req.query;

  const query = {};
  if (department) query.department = department;
  if (semester) query.semester = semester;
  if (year) query.year = year;

  const students = await Student.find(query)
    .populate('user', '-password')
    .sort({ studentId: 1 });

  successResponse(res, 200, 'Students retrieved successfully', students);
});

exports.createStudent = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, ...studentData } = req.body;

  // Create user account
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: 'STUDENT'
  });

  // Create student profile
  const student = await Student.create({
    user: user._id,
    ...studentData
  });

  successResponse(res, 201, 'Student created successfully', {
    student: await student.populate('user', '-password')
  });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const { firstName, lastName, ...studentData } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new APIError('Student not found', 404);
  }

  // Update user data if provided
  if (firstName || lastName) {
    await User.findByIdAndUpdate(student.user, { firstName, lastName });
  }

  // Update student data
  Object.assign(student, studentData);
  await student.save();

  successResponse(res, 200, 'Student updated successfully', {
    student: await student.populate('user', '-password')
  });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    throw new APIError('Student not found', 404);
  }

  // Delete user account and student profile
  await Promise.all([
    User.findByIdAndDelete(student.user),
    student.delete()
  ]);

  successResponse(res, 200, 'Student deleted successfully');
});

/**
 * Teacher Management
 */

exports.getTeachers = asyncHandler(async (req, res) => {
  const { department } = req.query;

  const query = {};
  if (department) query.department = department;

  const teachers = await Teacher.find(query)
    .populate('user', '-password')
    .populate('subjects', 'name code')
    .sort({ teacherId: 1 });

  successResponse(res, 200, 'Teachers retrieved successfully', teachers);
});

exports.createTeacher = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, ...teacherData } = req.body;

  // Create user account
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: 'TEACHER'
  });

  // Create teacher profile
  const teacher = await Teacher.create({
    user: user._id,
    ...teacherData
  });

  successResponse(res, 201, 'Teacher created successfully', {
    teacher: await teacher.populate('user', '-password')
  });
});

exports.updateTeacher = asyncHandler(async (req, res) => {
  const { firstName, lastName, ...teacherData } = req.body;

  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    throw new APIError('Teacher not found', 404);
  }

  // Update user data if provided
  if (firstName || lastName) {
    await User.findByIdAndUpdate(teacher.user, { firstName, lastName });
  }

  // Update teacher data
  Object.assign(teacher, teacherData);
  await teacher.save();

  successResponse(res, 200, 'Teacher updated successfully', {
    teacher: await teacher.populate('user', '-password')
  });
});

exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    throw new APIError('Teacher not found', 404);
  }

  // Delete user account and teacher profile
  await Promise.all([
    User.findByIdAndDelete(teacher.user),
    teacher.delete()
  ]);

  successResponse(res, 200, 'Teacher deleted successfully');
});

/**
 * Notice Management
 */

exports.getNotices = asyncHandler(async (req, res) => {
  const { targetAudience, department, isActive } = req.query;

  const query = {};
  if (targetAudience) query.targetAudience = targetAudience;
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive;

  const notices = await Notice.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ priority: -1, createdAt: -1 });

  successResponse(res, 200, 'Notices retrieved successfully', notices);
});

exports.createNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.create({
    ...req.body,
    createdBy: req.user._id
  });

  successResponse(res, 201, 'Notice created successfully', {
    notice: await notice.populate('createdBy', 'firstName lastName')
  });
});

exports.updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName');

  if (!notice) {
    throw new APIError('Notice not found', 404);
  }

  successResponse(res, 200, 'Notice updated successfully', notice);
});

exports.deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) {
    throw new APIError('Notice not found', 404);
  }

  successResponse(res, 200, 'Notice deleted successfully');
});

/**
 * Analytics
 */

exports.getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [students, teachers, notices, departments] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Notice.countDocuments({ isActive: true }),
    Student.distinct('department')
  ]);

  const departmentStats = await Student.aggregate([
    {
      $group: {
        _id: '$department',
        studentCount: { $sum: 1 },
        departments: { $addToSet: '$department' }
      }
    }
  ]);

  successResponse(res, 200, 'Dashboard analytics retrieved successfully', {
    totalStudents: students,
    totalTeachers: teachers,
    activeNotices: notices,
    totalDepartments: departments.length,
    departmentStats
  });
});

exports.getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { department, startDate, endDate } = req.query;

  const query = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (department) {
    const studentIds = await Student.find({ department }).distinct('_id');
    query.student = { $in: studentIds };
  }

  const attendanceStats = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const dailyAttendance = await Attendance.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  successResponse(res, 200, 'Attendance analytics retrieved successfully', {
    overall: attendanceStats,
    daily: dailyAttendance
  });
});