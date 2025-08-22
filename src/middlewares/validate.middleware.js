const { validationResult } = require('express-validator');
const { APIError } = require('../utils/response.util');

/**
 * Middleware to validate request using express-validator
 * Throws APIError if validation fails
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path] = error.msg;
    });
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (req, res, next) => {
  const id = req.params.id;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new APIError('Invalid ID format', 400);
  }
  next();
};


/**
 * Validate date range parameters
 */
exports.validateDateRange = (startField = 'startDate', endField = 'endDate') => {
  return (req, res, next) => {
    const startDate = new Date(req.query[startField]);
    const endDate = new Date(req.query[endField]);

    if (isNaN(startDate.getTime())) {
      throw new APIError(`Invalid ${startField}`, 400);
    }

    if (isNaN(endDate.getTime())) {
      throw new APIError(`Invalid ${endField}`, 400);
    }

    if (startDate > endDate) {
      throw new APIError(`${startField} cannot be greater than ${endField}`, 400);
    }

    req.dateRange = { startDate, endDate };
    next();
  };
};

/**
 * Validate file upload
 */
exports.validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      throw new APIError('No file uploaded', 400);
    }

    const fileType = req.file.mimetype;
    if (!allowedTypes.includes(fileType)) {
      throw new APIError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        400
      );
    }

    if (req.file.size > maxSize) {
      throw new APIError(
        `File size too large. Maximum size allowed: ${maxSize / (1024 * 1024)}MB`,
        400
      );
    }

    next();
  };
};