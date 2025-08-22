const { asyncHandler, successResponse, APIError } = require('../utils/response.util');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const Notice = require('../models/notice.model');
const Attendance = require('../models/attendance.model');
const mongoose = require('mongoose');
const { deleteFile } = require('../utils/upload.util');

/**
 * @desc    Get admin profile
 * @route   GET /api/admin/profile
 * @access  Private (Admin)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id).select('-password');

  if (!admin || admin.role !== 'ADMIN') {
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
  const allowedUpdates = ['firstName', 'lastName', 'image'];
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (Object.keys(updates).length === 0) {
    throw new APIError('No valid update fields provided', 400);
  }

  const admin = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

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
  const { email, password, firstName, lastName, rollNumber, ...studentData } = req.body;

  // First check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // If user exists, check if they already have a student profile
    const existingStudent = await Student.findOne({ user: existingUser._id });
    if (existingStudent) {
      // Delete uploaded file if exists
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new APIError('Email already registered as a student', 400);
    }
    // If no student profile, we'll update the user later
  }

  // Check if roll number exists
  const existingRollNumber = await Student.findOne({ rollNumber });
  if (existingRollNumber) {
    // Delete uploaded file if exists
    if (req.file) {
      deleteFile(req.file.path);
    }
    throw new APIError('Roll number already exists', 400);
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let user;
    if (existingUser) {
      // Update existing user
      user = await User.findByIdAndUpdate(
        existingUser._id,
        {
          firstName,
          lastName,
          password, // Note: password will be hashed by the User model pre-save middleware
          role: 'STUDENT',
          image: req.file ? req.file.path.replace('public/', '') : existingUser.image
        },
        { new: true, session }
      );
    } else {
      // Create new user
      user = await User.create([{
        email,
        password,
        firstName,
        lastName,
        role: 'STUDENT',
        image: req.file ? req.file.path.replace('public/', '') : null
      }], { session });
      user = user[0]; // Create returns an array when used with session
    }

    // Create student profile
    const student = await Student.create([{
      user: user._id,
      rollNumber,
      ...studentData
    }], { session });

    // Commit the transaction
    await session.commitTransaction();

    // Get the complete student data with populated user
    const populatedStudent = await Student.findById(student[0]._id)
      .populate('user', '-password');

    successResponse(res, 201, 'Student created successfully', { student: populatedStudent });
  } catch (error) {
    // If anything fails, abort the transaction and delete uploaded file
    await session.abortTransaction();
    if (req.file) {
      deleteFile(req.file.path);
    }
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
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
  const { email, password, firstName, lastName, teacherId, ...teacherData } = req.body;

  // First check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // If user exists, check if they already have a teacher profile
    const existingTeacher = await Teacher.findOne({ user: existingUser._id });
    if (existingTeacher) {
      // Delete uploaded file if exists
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new APIError('Email already registered as a teacher', 400);
    }
    // If no teacher profile, we'll update the user later
  }

  // Check if teacherId exists if provided
  if (teacherId) {
    const existingTeacherId = await Teacher.findOne({ teacherId });
    if (existingTeacherId) {
      // Delete uploaded file if exists
      if (req.file) {
        deleteFile(req.file.path);
      }
      throw new APIError('Teacher ID already exists', 400);
    }
  }

  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let user;
    if (existingUser) {
      // Update existing user
      user = await User.findByIdAndUpdate(
        existingUser._id,
        {
          firstName,
          lastName,
          password, // Note: password will be hashed by the User model pre-save middleware
          role: 'TEACHER',
          image: req.file ? req.file.path.replace('public/', '') : existingUser.image
        },
        { new: true, session }
      );
    } else {
      // Create new user
      user = await User.create([{
        email,
        password,
        firstName,
        lastName,
        role: 'TEACHER',
        image: req.file ? req.file.path.replace('public/', '') : null
      }], { session });
      user = user[0]; // Create returns an array when used with session
    }

    // Create teacher profile
    const teacher = await Teacher.create([{
      user: user._id,
      teacherId,
      ...teacherData
    }], { session });

    // Commit the transaction
    await session.commitTransaction();

    // Get the complete teacher data with populated user
    const populatedTeacher = await Teacher.findById(teacher[0]._id)
      .populate('user', '-password');

    successResponse(res, 201, 'Teacher created successfully', { teacher: populatedTeacher });
  } catch (error) {
    // If anything fails, abort the transaction and delete uploaded file
    await session.abortTransaction();
    if (req.file) {
      deleteFile(req.file.path);
    }
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
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

  console.log("here inside ");

  const { targetAudience} = req.query;

  console.log("targetAudience" + targetAudience);

  const query = {};
  if (targetAudience) query.targetAudience = [targetAudience, "ALL"];

  const notices = await Notice.find(query)
    .sort({createdAt: -1 });

  successResponse(res, 200, 'Notices retrieved successfully', notices);
});

exports.createNotice = asyncHandler(async (req, res) => {  

  const notice = await Notice.create({
    ...req.body,
    'attachments': req.file ? req.file.path.replace('public/', '') : null,
  });

  successResponse(res, 201, 'Notice created successfully', {notice},);
});

exports.updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    // Delete uploaded files if notice not found
    if (req.files) {
      req.files.forEach(file => deleteFile(file.path));
    }
    throw new APIError('Notice not found', 404);
  }

  // Process new attachments if any
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      path: file.path.replace('public/', ''),
      mimetype: file.mimetype
    }));

    // If removeAttachments is true, remove old attachments
    if (req.body.removeAttachments === 'true') {
      // Delete old attachment files
      notice.attachments.forEach(attachment => {
        deleteFile('public/' + attachment.path);
      });
      notice.attachments = newAttachments;
    } else {
      // Append new attachments to existing ones
      notice.attachments.push(...newAttachments);
    }
  }

  // Update other fields
  Object.assign(notice, req.body);
  await notice.save();

  successResponse(res, 200, 'Notice updated successfully', {
  });
});

exports.deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    throw new APIError('Notice not found', 404);
  }

  // Delete all attachment files
  notice.attachments.forEach(attachment => {
    deleteFile('public/' + attachment.path);
  });

  await notice.delete();
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