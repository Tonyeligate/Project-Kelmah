const { Dispute } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new dispute
exports.createDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.create(req.body);
    return successResponse(res, 201, 'Dispute created successfully', dispute);
  } catch (error) {
    next(error);
  }
};

// Retrieve all disputes with pagination
exports.getDisputes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Dispute.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Disputes retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single dispute by ID
exports.getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findByPk(req.params.id);
    if (!dispute) {
      return errorResponse(res, 404, 'Dispute not found');
    }
    return successResponse(res, 200, 'Dispute retrieved successfully', dispute);
  } catch (error) {
    next(error);
  }
};

// Update a dispute by ID
exports.updateDispute = async (req, res, next) => {
  try {
    const [updated] = await Dispute.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Dispute not found');
    }
    const updatedDispute = await Dispute.findByPk(req.params.id);
    return successResponse(res, 200, 'Dispute updated successfully', updatedDispute);
  } catch (error) {
    next(error);
  }
};

// Delete a dispute by ID
exports.deleteDispute = async (req, res, next) => {
  try {
    const deleted = await Dispute.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Dispute not found');
    }
    return successResponse(res, 200, 'Dispute deleted successfully');
  } catch (error) {
    next(error);
  }
}; 