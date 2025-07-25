const { Plan } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new plan
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create(req.body);
    return successResponse(res, 201, 'Plan created successfully', plan);
  } catch (error) {
    next(error);
  }
};

// Retrieve all plans with pagination
exports.getPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Plan.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Plans retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single plan by ID
exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return errorResponse(res, 404, 'Plan not found');
    }
    return successResponse(res, 200, 'Plan retrieved successfully', plan);
  } catch (error) {
    next(error);
  }
};

// Update a plan by ID
exports.updatePlan = async (req, res, next) => {
  try {
    const [updated] = await Plan.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Plan not found');
    }
    const updatedPlan = await Plan.findByPk(req.params.id);
    return successResponse(res, 200, 'Plan updated successfully', updatedPlan);
  } catch (error) {
    next(error);
  }
};

// Delete a plan by ID
exports.deletePlan = async (req, res, next) => {
  try {
    const deleted = await Plan.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Plan not found');
    }
    return successResponse(res, 200, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
}; 