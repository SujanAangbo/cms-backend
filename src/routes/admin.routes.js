const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { auth, checkRole, checkPermissions } = require('../middlewares/auth.middleware');
const { validateRequest, validateDateRange, validateObjectId, validatePagination } = require('../middlewares/validate.middleware');

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
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('studentId').trim().notEmpty().withMessage('Student ID is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('semester')
      .isInt({ min: 1, max: 8 })
      .withMessage('Semester must be between 1 and 8'),
    body('year')
      .isInt({ min: 1, max: 4 })
      .withMessage('Year must be between 1 and 4'),
    body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('address').optional().trim(),
    body('parentContact')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('admissionDate').optional().isISO8601().toDate()
  ],
  validateRequest,
  adminController.createStudent
);

router.put(
  '/students/:id',
  [
    validateObjectId,
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('department').optional().trim().notEmpty(),
    body('semester').optional().isInt({ min: 1, max: 8 }),
    body('year').optional().isInt({ min: 1, max: 4 }),
    body('rollNumber').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('address').optional().trim(),
    body('parentContact')
      .optional()
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
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('teacherId').trim().notEmpty().withMessage('Teacher ID is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    body('qualification').trim().notEmpty().withMessage('Qualification is required'),
    body('experience')
      .isInt({ min: 0 })
      .withMessage('Experience must be a positive number'),
    body('joiningDate').isISO8601().toDate().withMessage('Invalid joining date')
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
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
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
  [
    validateObjectId,
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('targetAudience')
      .optional()
      .isIn(['ALL', 'STUDENTS', 'TEACHERS', 'DEPARTMENT']),
    body('department').optional(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('isActive').optional().isBoolean(),
    body('expiryDate').optional().isISO8601().toDate()
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