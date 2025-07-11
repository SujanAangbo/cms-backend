const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
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

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Invalid role'),

  // Student-specific validations
  body('department')
    .if(body('role').equals('student'))
    .trim()
    .notEmpty()
    .withMessage('Department is required for students'),

  body('semester')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Semester is required for students')
    .isInt({ min: 1 })
    .withMessage('Semester must be a positive number'),

  body('year')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Year is required for students')
    .isInt({ min: 1 })
    .withMessage('Year must be a positive number'),

  body('rollNumber')
    .if(body('role').equals('student'))
    .trim()
    .notEmpty()
    .withMessage('Roll number is required for students'),

  body('dateOfBirth')
    .if(body('role').equals('student'))
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for date of birth'),

  body('address')
    .if(body('role').equals('student'))
    .optional()
    .trim(),

  body('parentContact')
    .if(body('role').equals('student'))
    .optional()
    .trim(),

  // Teacher-specific validations
  body('teacherId')
    .if(body('role').equals('teacher'))
    .notEmpty()
    .withMessage('Teacher ID is required for teachers')
    .trim(),

  body('subjects')
    .if(body('role').equals('teacher'))
    .isArray()
    .withMessage('Subjects must be an array')
    .notEmpty()
    .withMessage('At least one subject is required for teachers'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),

  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateUpdate
};