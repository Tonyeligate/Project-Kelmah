const { Wallet } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new wallet record
exports.createWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.create(req.body);
    return successResponse(res, 201, 'Wallet created successfully', wallet);
  } catch (error) {
    next(error);
  }
};

// Retrieve all wallets with pagination
exports.getWallets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Wallet.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Wallets retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single wallet by ID
exports.getWalletById = async (req, res, next) => {
  try {
    const wallet = await Wallet.findByPk(req.params.id);
    if (!wallet) {
      return errorResponse(res, 404, 'Wallet not found');
    }
    return successResponse(res, 200, 'Wallet retrieved successfully', wallet);
  } catch (error) {
    next(error);
  }
};

// Update a wallet by ID
exports.updateWallet = async (req, res, next) => {
  try {
    const [updated] = await Wallet.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Wallet not found');
    }
    const updatedWallet = await Wallet.findByPk(req.params.id);
    return successResponse(res, 200, 'Wallet updated successfully', updatedWallet);
  } catch (error) {
    next(error);
  }
};

// Delete a wallet by ID
exports.deleteWallet = async (req, res, next) => {
  try {
    const deleted = await Wallet.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Wallet not found');
    }
    return successResponse(res, 200, 'Wallet deleted successfully');
  } catch (error) {
    next(error);
  }
}; 