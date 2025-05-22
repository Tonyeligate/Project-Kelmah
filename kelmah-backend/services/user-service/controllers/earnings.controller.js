const { Worker, Transaction, Payment } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const earningsController = {
    // Get worker's earnings summary
    getEarningsSummary: async (req, res) => {
        try {
            const workerId = req.user.id;

            // Get all completed payments for the worker
            const payments = await Payment.findAll({
                where: {
                    workerId,
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                raw: true
            });

            // Get pending payments
            const pendingPayments = await Payment.findAll({
                where: {
                    workerId,
                    status: 'pending'
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                raw: true
            });

            // Get withdrawn amount
            const withdrawals = await Transaction.findAll({
                where: {
                    workerId,
                    type: 'withdrawal',
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                raw: true
            });

            const earnings = {
                total: parseFloat(payments[0]?.total || 0),
                available: parseFloat(payments[0]?.total || 0) - parseFloat(withdrawals[0]?.total || 0),
                pending: parseFloat(pendingPayments[0]?.total || 0),
                withdrawn: parseFloat(withdrawals[0]?.total || 0)
            };

            res.json({
                success: true,
                data: earnings
            });
        } catch (error) {
            console.error('Error fetching earnings summary:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch earnings summary'
            });
        }
    },

    // Get worker's transaction history
    getTransactionHistory: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const transactions = await Transaction.findAndCountAll({
                where: { workerId },
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Payment,
                        attributes: ['jobId', 'description']
                    }
                ]
            });

            res.json({
                success: true,
                data: transactions.rows,
                pagination: {
                    total: transactions.count,
                    page: parseInt(page),
                    pages: Math.ceil(transactions.count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch transaction history'
            });
        }
    },

    // Request withdrawal
    requestWithdrawal: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { amount, method, accountDetails } = req.body;

            // Validate amount
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid withdrawal amount'
                });
            }

            // Get available balance
            const payments = await Payment.findAll({
                where: {
                    workerId,
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                raw: true
            });

            const withdrawals = await Transaction.findAll({
                where: {
                    workerId,
                    type: 'withdrawal',
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ],
                raw: true
            });

            const availableBalance = parseFloat(payments[0]?.total || 0) - parseFloat(withdrawals[0]?.total || 0);

            if (amount > availableBalance) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient balance'
                });
            }

            // Create withdrawal transaction
            const transaction = await Transaction.create({
                workerId,
                type: 'withdrawal',
                amount,
                status: 'pending',
                method,
                accountDetails,
                metadata: {
                    requestedAt: new Date(),
                    processedBy: 'system'
                }
            });

            // TODO: Integrate with payment provider (MTN Mobile Money, Bank Transfer, etc.)
            // For now, we'll simulate the withdrawal process
            setTimeout(async () => {
                await transaction.update({ status: 'completed' });
            }, 5000); // Simulate 5-second processing time

            res.json({
                success: true,
                data: transaction,
                message: 'Withdrawal request submitted successfully'
            });
        } catch (error) {
            console.error('Error processing withdrawal request:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process withdrawal request'
            });
        }
    },

    // Get withdrawal history
    getWithdrawalHistory: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const withdrawals = await Transaction.findAndCountAll({
                where: {
                    workerId,
                    type: 'withdrawal'
                },
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: (page - 1) * limit
            });

            res.json({
                success: true,
                data: withdrawals.rows,
                pagination: {
                    total: withdrawals.count,
                    page: parseInt(page),
                    pages: Math.ceil(withdrawals.count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching withdrawal history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch withdrawal history'
            });
        }
    }
};

module.exports = earningsController;