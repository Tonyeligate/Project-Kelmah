const { Escrow } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new escrow record
exports.createEscrow = async (req, res, next) => {
  try {
    const escrow = await Escrow.create(req.body);
    return successResponse(res, 201, 'Escrow created successfully', escrow);
  } catch (error) {
    next(error);
  }
};

// Retrieve all escrows with pagination
exports.getEscrows = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Escrow.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Escrows retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single escrow by ID
exports.getEscrowById = async (req, res, next) => {
  try {
    const escrow = await Escrow.findByPk(req.params.id);
    if (!escrow) {
      return errorResponse(res, 404, 'Escrow not found');
    }
    return successResponse(res, 200, 'Escrow retrieved successfully', escrow);
  } catch (error) {
    next(error);
  }
};

// Update an escrow by ID
exports.updateEscrow = async (req, res, next) => {
  try {
    const [updated] = await Escrow.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Escrow not found');
    }
    const updatedEscrow = await Escrow.findByPk(req.params.id);
    return successResponse(res, 200, 'Escrow updated successfully', updatedEscrow);
  } catch (error) {
    next(error);
  }
};

// Delete an escrow by ID
exports.deleteEscrow = async (req, res, next) => {
  try {
    const deleted = await Escrow.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Escrow not found');
    }
    return successResponse(res, 200, 'Escrow deleted successfully');
  } catch (error) {
    next(error);
  }
}; 