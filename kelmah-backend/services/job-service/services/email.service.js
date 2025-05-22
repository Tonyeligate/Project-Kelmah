/**
 * Email Service
 * Handles sending email notifications for various contract-related events
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../../../utils/logger');
const config = require('../config/config');

// Load email templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  try {
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    logger.error(`Error loading email template: ${templateName}`, error);
    return null;
  }
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
};

// Compile template with data
const compileTemplate = (templateContent, data) => {
  try {
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    logger.error('Error compiling email template', error);
    return null;
  }
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${config.email.senderName}" <${config.email.sender}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || []
    });
    
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email', error);
    throw error;
  }
};

/**
 * Send contract signature request notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.jobTitle - Job title
 * @param {string} data.role - Recipient role (hirer or worker)
 */
exports.sendContractSignatureRequest = async (data) => {
  try {
    const templateContent = loadTemplate('contract-signature-request') || defaultTemplates.contractSignatureRequest;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      jobTitle: data.jobTitle,
      signatureLink: `${config.frontend.url}/contracts/${data.contractId}`,
      role: data.role,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Contract Signature Required - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending signature request email', error);
    throw error;
  }
};

/**
 * Send contract signed notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.signerName - Name of the person who signed
 * @param {string} data.signerRole - Role of the person who signed (hirer or worker)
 */
exports.sendContractSigned = async (data) => {
  try {
    const templateContent = loadTemplate('contract-signed') || defaultTemplates.contractSigned;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      signerName: data.signerName,
      signerRole: data.signerRole === 'hirer' ? 'Client' : 'Service Provider',
      contractLink: `${config.frontend.url}/contracts/${data.contractId}`,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Contract Signed by ${data.signerName} - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending contract signed email', error);
    throw error;
  }
};

/**
 * Send contract activated notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.role - Recipient role (hirer or worker)
 */
exports.sendContractActivated = async (data) => {
  try {
    const templateContent = loadTemplate('contract-activated') || defaultTemplates.contractActivated;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      role: data.role === 'hirer' ? 'Client' : 'Service Provider',
      contractLink: `${config.frontend.url}/contracts/${data.contractId}`,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Contract Activated - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending contract activated email', error);
    throw error;
  }
};

/**
 * Send contract completed notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.role - Recipient role (hirer or worker)
 */
exports.sendContractCompleted = async (data) => {
  try {
    const templateContent = loadTemplate('contract-completed') || defaultTemplates.contractCompleted;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      role: data.role === 'hirer' ? 'Client' : 'Service Provider',
      contractLink: `${config.frontend.url}/contracts/${data.contractId}`,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Contract Completed - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending contract completed email', error);
    throw error;
  }
};

/**
 * Send milestone completed notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.milestoneTitle - Milestone title
 * @param {string} data.completedBy - Name of person who completed the milestone
 */
exports.sendMilestoneCompleted = async (data) => {
  try {
    const templateContent = loadTemplate('milestone-completed') || defaultTemplates.milestoneCompleted;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      milestoneTitle: data.milestoneTitle,
      completedBy: data.completedBy,
      contractLink: `${config.frontend.url}/contracts/${data.contractId}`,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Milestone Completed - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending milestone completed email', error);
    throw error;
  }
};

/**
 * Send contract cancelled notification
 * 
 * @param {Object} data - Data for the email
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.contractId - Contract ID
 * @param {string} data.contractNumber - Contract number
 * @param {string} data.contractTitle - Contract title
 * @param {string} data.cancelledBy - Name of person who cancelled the contract
 * @param {string} data.reason - Reason for cancellation
 */
exports.sendContractCancelled = async (data) => {
  try {
    const templateContent = loadTemplate('contract-cancelled') || defaultTemplates.contractCancelled;
    const html = compileTemplate(templateContent, {
      name: data.name,
      contractNumber: data.contractNumber,
      contractTitle: data.contractTitle,
      cancelledBy: data.cancelledBy,
      reason: data.reason || 'No reason provided',
      contractLink: `${config.frontend.url}/contracts/${data.contractId}`,
      platformName: config.app.name,
      supportEmail: config.email.supportEmail
    });
    
    await sendEmail({
      to: data.email,
      subject: `${config.app.name}: Contract Cancelled - ${data.contractNumber}`,
      html
    });
  } catch (error) {
    logger.error('Error sending contract cancelled email', error);
    throw error;
  }
};

// Default email templates (fallback if file templates aren't available)
const defaultTemplates = {
  contractSignatureRequest: `
    <h2>Contract Signature Required</h2>
    <p>Hello {{name}},</p>
    <p>A new contract requires your signature:</p>
    <ul>
      <li><strong>Contract:</strong> {{contractNumber}}</li>
      <li><strong>Title:</strong> {{contractTitle}}</li>
      <li><strong>Job:</strong> {{jobTitle}}</li>
    </ul>
    <p>Please review and sign the contract by clicking the button below:</p>
    <p><a href="{{signatureLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">Review & Sign Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `,
  
  contractSigned: `
    <h2>Contract Signed</h2>
    <p>Hello {{name}},</p>
    <p>The contract {{contractNumber}} - "{{contractTitle}}" has been signed by {{signerName}} ({{signerRole}}).</p>
    <p>You can view the contract by clicking the button below:</p>
    <p><a href="{{contractLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">View Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `,
  
  contractActivated: `
    <h2>Contract Activated</h2>
    <p>Hello {{name}},</p>
    <p>Great news! The contract {{contractNumber}} - "{{contractTitle}}" has been activated.</p>
    <p>Both parties have signed the contract and work can now begin according to the agreed terms.</p>
    <p>You can view the contract by clicking the button below:</p>
    <p><a href="{{contractLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">View Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `,
  
  contractCompleted: `
    <h2>Contract Completed</h2>
    <p>Hello {{name}},</p>
    <p>The contract {{contractNumber}} - "{{contractTitle}}" has been marked as completed.</p>
    <p>All milestones have been successfully completed. Thank you for using our platform!</p>
    <p>You can view the contract by clicking the button below:</p>
    <p><a href="{{contractLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">View Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `,
  
  milestoneCompleted: `
    <h2>Milestone Completed</h2>
    <p>Hello {{name}},</p>
    <p>A milestone in the contract {{contractNumber}} - "{{contractTitle}}" has been completed:</p>
    <p><strong>Milestone:</strong> {{milestoneTitle}}</p>
    <p><strong>Completed by:</strong> {{completedBy}}</p>
    <p>You can view the contract by clicking the button below:</p>
    <p><a href="{{contractLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">View Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `,
  
  contractCancelled: `
    <h2>Contract Cancelled</h2>
    <p>Hello {{name}},</p>
    <p>The contract {{contractNumber}} - "{{contractTitle}}" has been cancelled by {{cancelledBy}}.</p>
    <p><strong>Reason:</strong> {{reason}}</p>
    <p>You can view the contract by clicking the button below:</p>
    <p><a href="{{contractLink}}" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">View Contract</a></p>
    <p>If you have any questions, please contact our support team at {{supportEmail}}.</p>
    <p>Thank you,<br>{{platformName}} Team</p>
  `
}; 