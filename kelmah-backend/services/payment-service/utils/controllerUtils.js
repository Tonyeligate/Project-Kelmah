const handleError = (res, error) => {
  const message = error?.message || 'Internal Server Error';
  const status = error?.statusCode || error?.status || 500;

  return res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? message : undefined,
  });
};

module.exports = {
  handleError,
};
