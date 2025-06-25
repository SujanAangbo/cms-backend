const UserService = require('../services/user.service');

class UserController {
  static async register(req, res) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await UserService.authenticateUser(email, password);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await UserService.getUserById(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const user = await UserService.updateUser(req.user.userId, req.body);
      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async deleteProfile(req, res) {
    try {
      await UserService.deleteUser(req.user.userId);
      res.status(200).json({
        status: 'success',
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Admin controllers
  static async getAllUsers(req, res) {
    try {
      const { role } = req.query;
      const users = await UserService.getAllUsers(role);
      res.status(200).json({
        status: 'success',
        data: { users }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      await UserService.deleteUser(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = UserController;