const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

class UserService {
  static async createUser(userData) {
    try {
      // Validate role-specific fields
      if (userData.role === 'student' && (!userData.studentId || !userData.grade)) {
        throw new Error('Student ID and grade are required for student registration');
      }
      if (userData.role === 'teacher' && (!userData.teacherId || !userData.subjects)) {
        throw new Error('Teacher ID and subjects are required for teacher registration');
      }

      const user = await User.create(userData);
      return this.sanitizeUser(user);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async authenticateUser(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  static async updateUser(userId, updateData) {
    try {
      // Prevent role changes through update
      delete updateData.role;
      
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!user) {
        throw new Error('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async getAllUsers(role = null) {
    try {
      const query = role ? { role } : {};
      const users = await User.find(query).select('-password');
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }
}

module.exports = UserService;