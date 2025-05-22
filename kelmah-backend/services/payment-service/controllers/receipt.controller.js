/**
 * Receipt Controller
 * Handles receipt-related operations for the Kelmah platform
 */

const { Receipt, Payment, Transaction, User } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a new receipt for a payment
 */
exports.generateReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { customData, notes } = req.body;
    
    // Fetch the payment
    const payment = await Payment.findByPk(paymentId, {
      include: ['payer', 'recipient', 'escrow', 'job', 'contract', 'transaction']
    });
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'completed') {
      return next(new AppError('Cannot generate receipt for non-completed payment', 400));
    }
    
    // Check if receipt already exists
    const existingReceipt = await Receipt.findOne({
      where: { paymentId }
    });
    
    if (existingReceipt) {
      return next(new AppError('Receipt already exists for this payment', 400));
    }
    
    // Generate receipt number
    const receiptNumber = `RCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the receipt
    const receipt = await Receipt.create({
      receiptNumber,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      payerId: payment.payerId,
      recipientId: payment.recipientId,
      jobId: payment.jobId,
      contractId: payment.contractId,
      escrowId: payment.escrowId,
      amount: payment.amount,
      platformFee: payment.platformFee || 0,
      tax: payment.tax || 0,
      totalAmount: payment.amount - (payment.platformFee || 0) - (payment.tax || 0),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentType: payment.type,
      description: payment.description,
      customData: customData || {},
      notes: notes || '',
      status: 'issued',
      paymentDate: payment.completedAt || payment.createdAt
    });
    
    logger.receiptAction('generated', {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      paymentId: payment.id,
      amount: receipt.amount
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    logger.error('Error generating receipt:', error);
    return next(new AppError('Failed to generate receipt', 500));
  }
};

/**
 * Get receipt by ID
 */
exports.getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const receipt = await Receipt.findByPk(id, {
      include: ['payer', 'recipient', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    if (!receipt) {
      return next(new AppError('Receipt not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    logger.error('Error fetching receipt:', error);
    return next(new AppError('Failed to fetch receipt', 500));
  }
};

/**
 * Get receipt by receipt number
 */
exports.getReceiptByNumber = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;
    
    const receipt = await Receipt.findOne({
      where: { receiptNumber },
      include: ['payer', 'recipient', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    if (!receipt) {
      return next(new AppError('Receipt not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        receipt
      }
    });
  } catch (error) {
    logger.error('Error fetching receipt by number:', error);
    return next(new AppError('Failed to fetch receipt', 500));
  }
};

/**
 * Generate PDF for a receipt
 */
exports.generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const receipt = await Receipt.findByPk(id, {
      include: ['payer', 'recipient', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    if (!receipt) {
      return next(new AppError('Receipt not found', 404));
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set the filename
    const filename = `receipt-${receipt.receiptNumber}.pdf`;
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add the header
    doc
      .fontSize(20)
      .text('KELMAH PLATFORM', { align: 'center' })
      .fontSize(15)
      .text('PAYMENT RECEIPT', { align: 'center' })
      .moveDown();
    
    // Add receipt information
    doc
      .fontSize(12)
      .text(`Receipt Number: ${receipt.receiptNumber}`)
      .text(`Date: ${new Date(receipt.paymentDate).toLocaleDateString()}`)
      .text(`Payment Reference: ${receipt.payment?.paymentNumber || 'N/A'}`)
      .text(`Transaction Reference: ${receipt.transaction?.transactionId || 'N/A'}`)
      .moveDown();
    
    // Add payer and recipient information
    doc
      .text('From:')
      .text(receipt.payer?.fullName || 'Client')
      .text(receipt.payer?.email || '')
      .moveDown()
      .text('To:')
      .text(receipt.recipient?.fullName || 'Service Provider')
      .text(receipt.recipient?.email || '')
      .moveDown();
    
    // Add payment details
    doc
      .fontSize(12)
      .text('Payment Details:', { underline: true })
      .moveDown()
      .fontSize(10)
      .text(`Payment Type: ${receipt.paymentType.replace('_', ' ').toUpperCase()}`)
      .text(`Payment Method: ${receipt.paymentMethod || 'N/A'}`)
      .text(`Description: ${receipt.description || 'Payment transaction'}`)
      .moveDown();
    
    // Add amount information
    doc
      .fontSize(12)
      .text('Amount Information:', { underline: true })
      .moveDown();
    
    let y = doc.y;
    
    // Amount details
    doc
      .fontSize(10)
      .text('Amount:', 350, y)
      .text(`${receipt.currency} ${receipt.amount.toFixed(2)}`, 450, y);
    
    y += 20;
    
    if (receipt.platformFee > 0) {
      doc
        .text('Platform Fee:', 350, y)
        .text(`${receipt.currency} ${receipt.platformFee.toFixed(2)}`, 450, y);
      
      y += 20;
    }
    
    if (receipt.tax > 0) {
      doc
        .text('Tax:', 350, y)
        .text(`${receipt.currency} ${receipt.tax.toFixed(2)}`, 450, y);
      
      y += 20;
    }
    
    // Draw line before total
    doc
      .moveTo(350, y)
      .lineTo(550, y)
      .stroke();
    
    y += 20;
    
    // Add total
    doc
      .fontSize(12)
      .text('Total Paid:', 350, y, { bold: true })
      .text(`${receipt.currency} ${receipt.totalAmount.toFixed(2)}`, 450, y, { bold: true });
    
    y += 40;
    
    // Add related information
    if (receipt.job) {
      doc
        .fontSize(10)
        .text(`Related Job: ${receipt.job.title || receipt.jobId}`);
    }
    
    if (receipt.contract) {
      doc
        .fontSize(10)
        .text(`Related Contract: ${receipt.contract.title || receipt.contractId}`);
    }
    
    if (receipt.escrow) {
      doc
        .fontSize(10)
        .text(`Related Escrow: ${receipt.escrow.escrowNumber || receipt.escrowId}`);
    }
    
    // Add notes
    if (receipt.notes) {
      doc
        .moveDown()
        .fontSize(10)
        .text('Notes:')
        .text(receipt.notes);
    }
    
    // Add footer
    doc
      .moveDown()
      .fontSize(10)
      .text('This is an official receipt for the payment made on the Kelmah Platform', { align: 'center' })
      .text('For any questions, please contact support@kelmah.com', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    // Log the action
    logger.receiptAction('pdf_generated', {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber
    });
    
  } catch (error) {
    logger.error('Error generating PDF for receipt:', error);
    return next(new AppError('Failed to generate PDF for receipt', 500));
  }
};

/**
 * Send receipt by email
 */
exports.sendReceiptByEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;
    
    const receipt = await Receipt.findByPk(id, {
      include: ['payer', 'recipient']
    });
    
    if (!receipt) {
      return next(new AppError('Receipt not found', 404));
    }
    
    // In a real implementation, generate PDF and send via email service
    // For this demo, just mark as sent
    
    receipt.sentAt = new Date();
    receipt.sentMethod = 'email';
    receipt.sentDetails = `Sent to: ${email || receipt.payer?.email || 'client'}`;
    
    await receipt.save();
    
    logger.receiptAction('email_sent', {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      email: email || receipt.payer?.email
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Receipt sent by email',
      data: {
        receipt
      }
    });
  } catch (error) {
    logger.error('Error sending receipt by email:', error);
    return next(new AppError('Failed to send receipt by email', 500));
  }
};

/**
 * Get receipts for a user (as payer)
 */
exports.getPayerReceipts = async (req, res, next) => {
  try {
    const { payerId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const receipts = await Receipt.findAll({
      where: { payerId },
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['recipient', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    // Get total count for pagination
    const totalCount = await Receipt.count({
      where: { payerId }
    });
    
    return res.status(200).json({
      status: 'success',
      results: receipts.length,
      totalCount,
      data: {
        receipts
      }
    });
  } catch (error) {
    logger.error('Error fetching payer receipts:', error);
    return next(new AppError('Failed to fetch payer receipts', 500));
  }
};

/**
 * Get receipts for a user (as recipient)
 */
exports.getRecipientReceipts = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const receipts = await Receipt.findAll({
      where: { recipientId },
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['payer', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    // Get total count for pagination
    const totalCount = await Receipt.count({
      where: { recipientId }
    });
    
    return res.status(200).json({
      status: 'success',
      results: receipts.length,
      totalCount,
      data: {
        receipts
      }
    });
  } catch (error) {
    logger.error('Error fetching recipient receipts:', error);
    return next(new AppError('Failed to fetch recipient receipts', 500));
  }
};

/**
 * Get all receipts (admin only)
 */
exports.getAllReceipts = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const receipts = await Receipt.findAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['payer', 'recipient', 'payment', 'transaction', 'job', 'contract', 'escrow']
    });
    
    // Get total count for pagination
    const totalCount = await Receipt.count();
    
    return res.status(200).json({
      status: 'success',
      results: receipts.length,
      totalCount,
      data: {
        receipts
      }
    });
  } catch (error) {
    logger.error('Error fetching all receipts:', error);
    return next(new AppError('Failed to fetch all receipts', 500));
  }
}; 