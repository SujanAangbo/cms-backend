const express = require('express');
const UserController = require('../controllers/user.controller');
const { auth, isAdmin } = require('../middlewares/auth.middleware');
const {
  validateRegistration,
  validateLogin,
  validateUpdate
} = require('../validators/user.validator');

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, UserController.register);
router.post('/login', validateLogin, UserController.login);

// Protected routes for all users
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, validateUpdate, UserController.updateProfile);
router.delete('/profile', auth, UserController.deleteProfile);

// Admin routes
router.get('/', auth, isAdmin, UserController.getAllUsers);
router.get('/:id', auth, isAdmin, UserController.getUserById);
router.put('/:id', auth, isAdmin, validateUpdate, UserController.updateUser);
router.delete('/:id', auth, isAdmin, UserController.deleteUser);

// Role-specific routes
router.get('/students', auth, isAdmin, async (req, res) => {
  req.query.role = 'student';
  await UserController.getAllUsers(req, res);
});

router.get('/teachers', auth, isAdmin, async (req, res) => {
  req.query.role = 'teacher';
  await UserController.getAllUsers(req, res);
});

module.exports = router;