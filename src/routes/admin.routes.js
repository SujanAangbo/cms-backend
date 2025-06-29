const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { auth, checkRole, checkPermissions } = require('../middlewares/auth.middleware');
const { validateRequest, validateDateRange, validateObjectId, validatePagination } = require('../middlewares/validate.middleware');
const Student = require('../models/student.model');
const { upload } = require('../utils/upload.util');

const router = express.Router();

// Protect all routes
router.use(auth);
router.use(checkRole('ADMIN'));

// Profile routes
router.get('/profile', adminController.getProfile);

router.put(
  '/profile',
  [
    body('designation')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Designation cannot be empty')
  ],
  validateRequest,
  adminController.updateProfile
);

// Student management routes
router.get(
  '/students',
  validatePagination,
  adminController.getStudents
);

router.post(
  '/students',
  upload.single('image'),
  [
    // User account fields
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
    
    // Student profile fields
    body('department')
      .trim()
      .notEmpty()
      .withMessage('Department is required'),
    body('semester')
      .notEmpty()
      .withMessage('Semester is required')
      .isInt({ min: 1 })
      .withMessage('Semester must be a positive number'),
    body('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt()
      .withMessage('Year must be a number'),
    body('rollNumber')
      .trim()
      .notEmpty()
      .withMessage('Roll number is required')
      .custom(async (value) => {
        const exists = await Student.findOne({ rollNumber: value });
        if (exists) {
          throw new Error('Roll number already exists');
        }
        return true;
      }),
    
    // Optional fields
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid date format'),
    body('address')
      .optional()
      .trim(),
    body('parentContact')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  validateRequest,
  adminController.createStudent
);

router.put(
  '/students/:id',
  upload.single('image'),
  [
    validateObjectId,
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    body('semester').optional().isInt({ min: 1 }),
    body('year').optional().isInt(),
    body('rollNumber').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('address').optional().trim(),
    body('parentContact')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  validateRequest,
  adminController.updateStudent
);

router.delete(
  '/students/:id',
  validateObjectId,
  adminController.deleteStudent
);

// Teacher management routes
router.get(
  '/teachers',
  validatePagination,
  adminController.getTeachers
);

router.post(
  '/teachers',
  upload.single('image'),
  [
    // User account fields
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
    
    // Teacher profile fields
    body('department')
      .trim()
      .notEmpty()
      .withMessage('Department is required'),
    body('designation')
      .trim()
      .notEmpty()
      .withMessage('Designation is required'),
    body('qualification')
      .trim()
      .notEmpty()
      .withMessage('Qualification is required'),
    body('experience')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience must be a non-negative number'),
    body('subjects')
      .optional()
      .isArray()
      .withMessage('Subjects must be an array'),
    body('subjects.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Subject names cannot be empty'),
    body('contactNumber')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  validateRequest,
  adminController.createTeacher
);

router.put(
  '/teachers/:id',
  [
    validateObjectId,
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    body('designation').optional().trim().notEmpty(),
    body('qualification').optional().trim().notEmpty(),
    body('experience').optional().isInt({ min: 0 })
  ],
  validateRequest,
  adminController.updateTeacher
);

router.delete(
  '/teachers/:id',
  validateObjectId,
  adminController.deleteTeacher
);

// Notice management routes
router.get(
  '/notices',
  validatePagination,
  adminController.getNotices
);

router.post(
  '/notices',
  upload.array('attachments', 5), // Allow up to 5 attachments
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required'),
    body('targetAudience')
      .isIn(['ALL', 'STUDENTS', 'TEACHERS', 'DEPARTMENT'])
      .withMessage('Invalid target audience'),
    body('department')
      .optional()
      .custom((value, { req }) => {
        if (req.body.targetAudience === 'DEPARTMENT' && !value) {
          throw new Error('Department is required for department-specific notices');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Invalid priority level'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid expiry date')
  ],
  validateRequest,
  adminController.createNotice
);

router.put(
  '/notices/:id',
  upload.array('attachments', 5), // Allow up to 5 attachments
  [
    validateObjectId,
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('targetAudience')
      .optional()
      .isIn(['ALL', 'STUDENTS', 'TEACHERS', 'DEPARTMENT']),
    body('department')
      .optional()
      .custom((value, { req }) => {
        if (req.body.targetAudience === 'DEPARTMENT' && !value) {
          throw new Error('Department is required for department-specific notices');
        }
        return true;
      }),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('expiryDate')
      .optional()
      .isISO8601()
      .toDate(),
    body('isActive')
      .optional()
      .isBoolean()
  ],
  validateRequest,
  adminController.updateNotice
);

router.delete(
  '/notices/:id',
  validateObjectId,
  adminController.deleteNotice
);

// Analytics routes
router.get(
  '/analytics/dashboard',
  adminController.getDashboardAnalytics
);

router.get(
  '/analytics/attendance',
  [
    validateDateRange('startDate', 'endDate'),
    body('department').optional().trim()
  ],
  validateRequest,
  adminController.getAttendanceAnalytics
);

module.exports = router;