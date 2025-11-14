const buildMeta = (res, meta = {}) => {
  const requestId = res?.locals?.requestId || res?.req?.id;
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId || undefined,
    ...meta,
  };
};

function successResponse(res, statusCode, message, data = null, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
    meta: buildMeta(res, meta),
  });
}

function errorResponse(res, statusCode, message, code = 'ERROR', details = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      message,
      code,
      details,
    },
    meta: buildMeta(res),
  });
}

function paginatedResponse(
  res,
  statusCode,
  message,
  items,
  page,
  limit,
  total,
  meta = {},
) {
  const safeLimit = Number(limit) || 10;
  const pagination = {
    page: Number(page) || 1,
    limit: safeLimit,
    total,
    totalPages: safeLimit > 0 ? Math.max(1, Math.ceil(total / safeLimit)) : 1,
  };

  return successResponse(res, statusCode, message, { items, pagination }, {
    ...meta,
    pagination,
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
