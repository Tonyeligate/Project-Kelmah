function successResponse(res, statusCode, message, data) {
  return res.status(statusCode).json({ success: true, message, data });
}

function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

function paginatedResponse(
  res,
  statusCode,
  message,
  items,
  page,
  limit,
  total,
) {
  return res
    .status(statusCode)
    .json({ success: true, message, items, page, limit, total });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
