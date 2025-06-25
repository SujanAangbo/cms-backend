const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');

const router = express.Router();

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .not()
    .equals(body('currentPassword'))
    .withMessage('New password must be different from current password')
];

// Reset password validation rules
const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Public routes
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/forgot-password', 
  body('email').isEmail().withMessage('Please enter a valid email address'),
  validateRequest,
  authController.forgotPassword
);
router.post('/reset-password/:token', 
  resetPasswordValidation,
  validateRequest,
  authController.resetPassword
);

// Protected routes
router.use(auth);
router.post('/logout', authController.logout);
router.post('/change-password', 
  changePasswordValidation,
  validateRequest,
  authController.changePassword
);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authController.getCurrentUser);

module.exports = router;