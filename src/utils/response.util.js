/**
 * Standard response format for success
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
exports.successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    status: 'success',
    message
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard response format for errors
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Detailed errors
 */
exports.errorResponse = (res, statusCode = 500, message = 'Error', errors = null) => {
  const response = {
    status: 'error',
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Async handler to wrap async route handlers
 * @param {Function} fn - Async route handler
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

exports.APIError = APIError;

/**
 * No pagination helper - returns all data
 * This is a simplified version that doesn't use pagination
 */
exports.getPagination = () => {
  return {
    startIndex: 0,
    pagination: null
  };
};

/**
 * Filter helper for mongoose queries
 * @param {Object} queryString - Query parameters
 * @param {Array} allowedFields - Allowed filter fields
 */
exports.getFilterQuery = (queryString, allowedFields) => {
  const queryObj = { ...queryString };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);

  // Filter out non-allowed fields
  Object.keys(queryObj).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete queryObj[key];
    }
  });

  return queryObj;
};

/**
 * Sort helper for mongoose queries
 * @param {string} sortString - Sort string (e.g., 'field,-otherField')
 */
exports.getSortQuery = (sortString) => {
  if (!sortString) return { createdAt: -1 };
  
  const sortObj = {};
  const fields = sortString.split(',');
  
  fields.forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  return sortObj;
};