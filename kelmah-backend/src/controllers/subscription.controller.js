const { Subscription } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new subscription
exports.createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create(req.body);
    return successResponse(res, 201, 'Subscription created successfully', subscription);
  } catch (error) {
    next(error);
  }
};

// Retrieve all subscriptions with pagination
exports.getSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Subscription.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Subscriptions retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single subscription by ID
exports.getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }
    return successResponse(res, 200, 'Subscription retrieved successfully', subscription);
  } catch (error) {
    next(error);
  }
};

// Update a subscription by ID
exports.updateSubscription = async (req, res, next) => {
  try {
    const [updated] = await Subscription.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Subscription not found');
    }
    const updatedSubscription = await Subscription.findByPk(req.params.id);
    return successResponse(res, 200, 'Subscription updated successfully', updatedSubscription);
  } catch (error) {
    next(error);
  }
};

// Delete a subscription by ID
exports.deleteSubscription = async (req, res, next) => {
  try {
    const deleted = await Subscription.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Subscription not found');
    }
    return successResponse(res, 200, 'Subscription deleted successfully');
  } catch (error) {
    next(error);
  }
}; 