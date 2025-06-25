const express = require('express');
const { body } = require('express-validator');
const teacherController = require('../controllers/teacher.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { validateRequest, validateDateRange, validateObjectId, validatePagination } = require('../middlewares/validate.middleware');

const router = express.Router();

// Protect all routes
router.use(auth);
router.use(checkRole('TEACHER'));

// Profile routes
router.get('/profile', teacherController.getProfile);

router.put(
  '/profile',
  [
    body('qualification')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Qualification cannot be empty'),
    body('experience')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience must be a positive number')
  ],
  validateRequest,
  teacherController.updateProfile
);

// Notice routes
router.get(
  '/notices',
  validatePagination,
  teacherController.getNotices
);

// Student routes
router.get(
  '/students',
  [
    body('subjectId')
      .isMongoId()
      .withMessage('Invalid subject ID')
  ],
  validateRequest,
  teacherController.getStudents
);

// Attendance routes
router.post(
  '/attendance',
  [
    body('subjectId')
      .isMongoId()
      .withMessage('Invalid subject ID'),
    body('date')
      .isISO8601()
      .toDate()
      .withMessage('Invalid date format'),
    body('attendanceData')
      .isArray()
      .withMessage('Attendance data must be an array'),
    body('attendanceData.*.studentId')
      .isMongoId()
      .withMessage('Invalid student ID'),
    body('attendanceData.*.status')
      .isIn(['PRESENT', 'ABSENT', 'LATE'])
      .withMessage('Invalid attendance status'),
    body('attendanceData.*.remarks')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Remarks cannot exceed 200 characters')
  ],
  validateRequest,
  teacherController.markAttendance
);

router.put(
  '/attendance/:id',
  [
    validateObjectId,
    body('status')
      .isIn(['PRESENT', 'ABSENT', 'LATE'])
      .withMessage('Invalid attendance status'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Remarks cannot exceed 200 characters')
  ],
  validateRequest,
  teacherController.updateAttendance
);

router.get(
  '/attendance/class/:subjectId',
  [
    validateObjectId,
    validateDateRange('startDate', 'endDate')
  ],
  validateRequest,
  teacherController.getClassAttendance
);

module.exports = router;