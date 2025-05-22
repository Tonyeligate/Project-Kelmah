/**
 * Invoice Controller
 * Handles invoice-related operations for the Kelmah platform
 */

const { Invoice, Payment, Escrow, User, Transaction } = require('../models');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a new invoice for a payment
 */
exports.generateInvoice = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { customItems, notes } = req.body;
    
    // Fetch the payment
    const payment = await Payment.findByPk(paymentId, {
      include: ['payer', 'recipient', 'escrow', 'job', 'contract']
    });
    
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    
    if (payment.status !== 'completed') {
      return next(new AppError('Cannot generate invoice for non-completed payment', 400));
    }
    
    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({
      where: { paymentId }
    });
    
    if (existingInvoice) {
      return next(new AppError('Invoice already exists for this payment', 400));
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create base invoice items based on payment type
    let items = [];
    let description = '';
    
    if (payment.type === 'escrow_funding') {
      description = `Escrow funding for ${payment.escrow ? payment.escrow.escrowNumber : 'an escrow'}`;
      items.push({
        description: 'Escrow Deposit',
        amount: payment.amount,
        quantity: 1,
        total: payment.amount
      });
    } else if (payment.type === 'escrow_release') {
      description = `Payment for ${payment.job ? payment.job.title : 'services rendered'}`;
      items.push({
        description: payment.job ? `Services: ${payment.job.title}` : 'Services rendered',
        amount: payment.amount,
        quantity: 1,
        total: payment.amount
      });
    } else {
      description = payment.description || 'Payment transaction';
      items.push({
        description: 'Payment',
        amount: payment.amount,
        quantity: 1,
        total: payment.amount
      });
    }
    
    // Add any custom items from the request
    if (customItems && Array.isArray(customItems)) {
      items = [...items, ...customItems];
    }
    
    // Calculate subtotal, taxes, fees, and total
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const platformFee = payment.platformFee || 0;
    const tax = payment.tax || 0;
    const total = subtotal - platformFee - tax;
    
    // Create the invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      paymentId: payment.id,
      payerId: payment.payerId,
      recipientId: payment.recipientId,
      jobId: payment.jobId,
      contractId: payment.contractId,
      escrowId: payment.escrowId,
      description,
      items,
      subtotal,
      platformFee,
      tax,
      total,
      currency: payment.currency,
      notes: notes || '',
      status: 'issued',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    logger.invoiceAction('generated', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentId: payment.id,
      amount: invoice.total
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error generating invoice:', error);
    return next(new AppError('Failed to generate invoice', 500));
  }
};

/**
 * Create a new invoice (manually, not tied to a payment)
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      payerId,
      recipientId,
      jobId,
      contractId,
      description,
      items,
      subtotal,
      platformFee = 0,
      tax = 0,
      total,
      currency = 'GHS',
      notes = '',
      dueDate
    } = req.body;
    
    // Validate required fields
    if (!payerId) {
      return next(new AppError('Payer ID is required', 400));
    }
    
    if (!recipientId) {
      return next(new AppError('Recipient ID is required', 400));
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('At least one invoice item is required', 400));
    }
    
    if (!total || total <= 0) {
      return next(new AppError('Total amount must be greater than 0', 400));
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      payerId,
      recipientId,
      jobId,
      contractId,
      description: description || 'Custom invoice',
      items,
      subtotal: subtotal || total,
      platformFee,
      tax,
      total,
      currency,
      notes,
      status: 'issued',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    logger.invoiceAction('created', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    return next(new AppError('Failed to create invoice', 500));
  }
};

/**
 * Get invoice by ID
 */
exports.getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findByPk(id, {
      include: ['payer', 'recipient', 'payment', 'job', 'contract']
    });
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    return next(new AppError('Failed to fetch invoice', 500));
  }
};

/**
 * Get invoice by invoice number
 */
exports.getInvoiceByNumber = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    
    const invoice = await Invoice.findOne({
      where: { invoiceNumber },
      include: ['payer', 'recipient', 'payment', 'job', 'contract']
    });
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error fetching invoice by number:', error);
    return next(new AppError('Failed to fetch invoice', 500));
  }
};

/**
 * Generate PDF for an invoice
 */
exports.generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invoice = await Invoice.findByPk(id, {
      include: ['payer', 'recipient', 'payment', 'job', 'contract']
    });
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set the filename
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    
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
      .text('INVOICE', { align: 'center' })
      .moveDown();
    
    // Add invoice information
    doc
      .fontSize(12)
      .text(`Invoice Number: ${invoice.invoiceNumber}`)
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`)
      .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`)
      .text(`Status: ${invoice.status.toUpperCase()}`)
      .moveDown();
    
    // Add payer and recipient information
    doc
      .text('From:')
      .text(invoice.recipient?.fullName || 'Service Provider')
      .text(invoice.recipient?.email || '')
      .moveDown()
      .text('To:')
      .text(invoice.payer?.fullName || 'Client')
      .text(invoice.payer?.email || '')
      .moveDown();
    
    // Add description
    if (invoice.description) {
      doc
        .text('Description:')
        .text(invoice.description)
        .moveDown();
    }
    
    // Add items table
    doc
      .fontSize(12)
      .text('Items:', { underline: true })
      .moveDown();
    
    let y = doc.y;
    
    // Draw table header
    doc
      .fontSize(10)
      .text('Description', 50, y)
      .text('Quantity', 300, y)
      .text('Amount', 370, y)
      .text('Total', 450, y)
      .moveDown();
    
    y = doc.y;
    
    // Draw lines for header
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
    
    y += 10;
    
    // Add items
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach(item => {
        doc
          .fontSize(10)
          .text(item.description || '', 50, y)
          .text(item.quantity?.toString() || '1', 300, y)
          .text(`${invoice.currency} ${(item.amount || 0).toFixed(2)}`, 370, y)
          .text(`${invoice.currency} ${(item.total || 0).toFixed(2)}`, 450, y);
        
        y += 20;
      });
    }
    
    // Draw line after items
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
    
    y += 20;
    
    // Add totals
    doc
      .fontSize(10)
      .text('Subtotal:', 350, y)
      .text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 450, y);
    
    y += 20;
    
    if (invoice.platformFee > 0) {
      doc
        .text('Platform Fee:', 350, y)
        .text(`${invoice.currency} ${invoice.platformFee.toFixed(2)}`, 450, y);
      
      y += 20;
    }
    
    if (invoice.tax > 0) {
      doc
        .text('Tax:', 350, y)
        .text(`${invoice.currency} ${invoice.tax.toFixed(2)}`, 450, y);
      
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
      .text('Total:', 350, y, { bold: true })
      .text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 450, y, { bold: true });
    
    y += 40;
    
    // Add notes
    if (invoice.notes) {
      doc
        .fontSize(10)
        .text('Notes:')
        .text(invoice.notes);
    }
    
    // Add footer
    doc
      .fontSize(10)
      .text('Thank you for using Kelmah Platform', { align: 'center' })
      .text('For any questions, please contact support@kelmah.com', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    // Log the action
    logger.invoiceAction('pdf_generated', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber
    });
    
  } catch (error) {
    logger.error('Error generating PDF for invoice:', error);
    return next(new AppError('Failed to generate PDF for invoice', 500));
  }
};

/**
 * Update invoice status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const invoice = await Invoice.findByPk(id);
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    // Validate status
    const validStatuses = ['issued', 'sent', 'paid', 'cancelled', 'overdue'];
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }
    
    // Update invoice status
    invoice.status = status;
    
    // If marking as paid, record the payment date
    if (status === 'paid' && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }
    
    await invoice.save();
    
    logger.invoiceAction('status_updated', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error updating invoice status:', error);
    return next(new AppError('Failed to update invoice status', 500));
  }
};

/**
 * Mark invoice as sent
 */
exports.markAsSent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sentMethod, sentDetails } = req.body;
    
    const invoice = await Invoice.findByPk(id);
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    if (invoice.status !== 'issued') {
      return next(new AppError('Only issued invoices can be marked as sent', 400));
    }
    
    // Update invoice
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    invoice.sentMethod = sentMethod || 'email';
    invoice.sentDetails = sentDetails || '';
    
    await invoice.save();
    
    logger.invoiceAction('marked_as_sent', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sentMethod: invoice.sentMethod
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error marking invoice as sent:', error);
    return next(new AppError('Failed to mark invoice as sent', 500));
  }
};

/**
 * Mark invoice as paid
 */
exports.markAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentReference, paymentMethod, paymentDate } = req.body;
    
    const invoice = await Invoice.findByPk(id);
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    if (invoice.status === 'paid') {
      return next(new AppError('Invoice is already marked as paid', 400));
    }
    
    if (invoice.status === 'cancelled') {
      return next(new AppError('Cannot mark a cancelled invoice as paid', 400));
    }
    
    // Update invoice
    invoice.status = 'paid';
    invoice.paidAt = paymentDate ? new Date(paymentDate) : new Date();
    invoice.paymentReference = paymentReference || '';
    invoice.paymentMethod = paymentMethod || '';
    
    await invoice.save();
    
    logger.invoiceAction('marked_as_paid', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentReference: invoice.paymentReference
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error marking invoice as paid:', error);
    return next(new AppError('Failed to mark invoice as paid', 500));
  }
};

/**
 * Cancel an invoice
 */
exports.cancelInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const invoice = await Invoice.findByPk(id);
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    if (invoice.status === 'paid') {
      return next(new AppError('Cannot cancel a paid invoice', 400));
    }
    
    if (invoice.status === 'cancelled') {
      return next(new AppError('Invoice is already cancelled', 400));
    }
    
    // Update invoice
    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    invoice.cancellationReason = reason || '';
    
    await invoice.save();
    
    logger.invoiceAction('cancelled', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reason: invoice.cancellationReason
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error cancelling invoice:', error);
    return next(new AppError('Failed to cancel invoice', 500));
  }
};

/**
 * Get invoices for a user (as payer)
 */
exports.getPayerInvoices = async (req, res, next) => {
  try {
    const { payerId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const conditions = { payerId };
    if (status) {
      conditions.status = status;
    }
    
    const invoices = await Invoice.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['recipient', 'payment', 'job', 'contract']
    });
    
    // Get total count for pagination
    const totalCount = await Invoice.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: invoices.length,
      totalCount,
      data: {
        invoices
      }
    });
  } catch (error) {
    logger.error('Error fetching payer invoices:', error);
    return next(new AppError('Failed to fetch payer invoices', 500));
  }
};

/**
 * Get invoices for a user (as recipient)
 */
exports.getRecipientInvoices = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const conditions = { recipientId };
    if (status) {
      conditions.status = status;
    }
    
    const invoices = await Invoice.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['payer', 'payment', 'job', 'contract']
    });
    
    // Get total count for pagination
    const totalCount = await Invoice.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: invoices.length,
      totalCount,
      data: {
        invoices
      }
    });
  } catch (error) {
    logger.error('Error fetching recipient invoices:', error);
    return next(new AppError('Failed to fetch recipient invoices', 500));
  }
};

/**
 * Send invoice by email
 */
exports.sendInvoiceByEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;
    
    const invoice = await Invoice.findByPk(id, {
      include: ['payer', 'recipient']
    });
    
    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }
    
    // Generate PDF buffer (simplified for demo)
    // In production, use a real email service and attach PDF
    
    // For this demo, just mark as sent
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    invoice.sentMethod = 'email';
    invoice.sentDetails = `Sent to: ${email || invoice.payer?.email || 'client'}`;
    
    await invoice.save();
    
    logger.invoiceAction('email_sent', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      email: email || invoice.payer?.email
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Invoice sent by email',
      data: {
        invoice
      }
    });
  } catch (error) {
    logger.error('Error sending invoice by email:', error);
    return next(new AppError('Failed to send invoice by email', 500));
  }
};

/**
 * Get all invoices (admin only)
 */
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const conditions = {};
    if (status) {
      conditions.status = status;
    }
    
    const invoices = await Invoice.findAll({
      where: conditions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: ['payer', 'recipient', 'payment', 'job', 'contract']
    });
    
    // Get total count for pagination
    const totalCount = await Invoice.count({
      where: conditions
    });
    
    return res.status(200).json({
      status: 'success',
      results: invoices.length,
      totalCount,
      data: {
        invoices
      }
    });
  } catch (error) {
    logger.error('Error fetching all invoices:', error);
    return next(new AppError('Failed to fetch all invoices', 500));
  }
}; 