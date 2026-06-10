// Helper: get user ID from gateway-authenticated request
const getUserId = (req) => req.user?.id || req.user?._id;

const handleError = (res, error) => {
  const message = error?.message || 'Internal Server Error';
  const status = error?.statusCode || error?.status || 500;

  return res.status(status).json({
    success: false,
    error: {
      message,
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    },
  });
};

module.exports = {
  getUserId,
  handleError,
};
