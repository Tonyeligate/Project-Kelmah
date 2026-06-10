const buildServiceErrorResponse = (err, nodeEnv = process.env.NODE_ENV) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const shouldExposeMessage = statusCode < 500 || err.expose === true || err.exposeMessage === true;

  return {
    statusCode,
    body: {
      success: false,
      status,
      message: shouldExposeMessage ? err.message : 'An internal error occurred',
      code: err.code || null,
      errors: err.errors || null,
      stack: nodeEnv === 'development' ? err.stack : undefined,
    },
  };
};

module.exports = {
  buildServiceErrorResponse,
};