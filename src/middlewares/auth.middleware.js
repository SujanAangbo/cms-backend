const jwt = require('jsonwebtoken');
const { APIError } = require('../utils/response.util');
const User = require('../models/user.model');

/**
 * Verify JWT token and attach user to request
 */
exports.auth = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in cookies first (for browser clients)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    // Fallback to Authorization header (for API clients)
    else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new APIError('No token provided', 401);
      }
      token = authHeader.split(' ')[1];
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new APIError('User not found', 401);
    }

    if (!user.isActive) {
      throw new APIError('User account is deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new APIError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role
 */
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new APIError('Unauthorized access', 403);
    }
    next();
  };
};

/**
 * Check if user is an admin
 */
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      throw new APIError('Admin access required', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the resource or is an admin
 */
exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      if (!resource) {
        throw new APIError('Resource not found', 404);
      }

      if (
        req.user.role !== 'ADMIN' &&
        resource.user.toString() !== req.user._id.toString()
      ) {
        throw new APIError('Unauthorized access', 403);
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Refresh token middleware
 */
exports.refreshToken = async (req, res, next) => {
  try {
    let refreshToken;
    
    // Check for refresh token in cookies first (for browser clients)
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } 
    // Fallback to request body (for API clients)
    else {
      refreshToken = req.body.refreshToken;
    }
    
    if (!refreshToken) {
      throw new APIError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      throw new APIError('Invalid refresh token', 401);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Set the new access token as a cookie for browser clients
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({
      status: 'success',
      data: { accessToken } // Still include token in response for non-browser clients
    });
  } catch (error) {
    next(error);
  }
};