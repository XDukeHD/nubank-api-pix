const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    error: message,
    statusCode
  };
};


const successResponse = (data, statusCode = 200) => {
  return {
    success: true,
    data,
    statusCode
  };
};

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorResponse,
  successResponse,
  asyncHandler
};
