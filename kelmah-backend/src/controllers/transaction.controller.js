const { Transaction } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new transaction
exports.createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create(req.body);
    return successResponse(res, 201, 'Transaction created successfully', transaction);
  } catch (error) {
    next(error);
  }
};

// Retrieve all transactions with pagination
exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Transaction.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Transactions retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single transaction by ID
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }
    return successResponse(res, 200, 'Transaction retrieved successfully', transaction);
  } catch (error) {
    next(error);
  }
};

// Update a transaction by ID
exports.updateTransaction = async (req, res, next) => {
  try {
    const [updated] = await Transaction.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Transaction not found');
    }
    const updatedTransaction = await Transaction.findByPk(req.params.id);
    return successResponse(res, 200, 'Transaction updated successfully', updatedTransaction);
  } catch (error) {
    next(error);
  }
};

// Delete a transaction by ID
exports.deleteTransaction = async (req, res, next) => {
  try {
    const deleted = await Transaction.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Transaction not found');
    }
    return successResponse(res, 200, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
}; 