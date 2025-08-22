const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/student.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { validateRequest, validateDateRange, validateObjectId, validatePagination } = require('../middlewares/validate.middleware');

const router = express.Router();

// Protect all routes
router.use(auth);
router.use(checkRole('STUDENT'));

// Profile routes
router.get('/profile', studentController.getProfile);

router.put(
  '/profile',
  [
    body('address')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Address cannot be empty'),
    body('parentContact')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  validateRequest,
  studentController.updateProfile
);

// Notice routes
router.get(
  '/notices',
  studentController.getNotices
);

// Attendance routes
router.get(
  '/attendance',
  [
    validateDateRange('startDate', 'endDate'),
    body('subjectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid subject ID')
  ],
  validateRequest,
  studentController.getAttendance
);

router.get(
  '/attendance/summary',
  [
    body('subjectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid subject ID')
  ],
  validateRequest,
  studentController.getAttendanceSummary
);

module.exports = router;