/**
 * PDF Service
 * Handles generation of PDF documents for contracts and other documents
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const logger = require('../../../utils/logger');

/**
 * Generate a PDF for a contract
 * 
 * @param {Object} contract - The contract object with all related data
 * @returns {Buffer} PDF document as a buffer
 */
exports.generateContractPDF = async (contract) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Contract - ${contract.contractNumber}`,
          Author: 'Kelmah Platform',
          Subject: 'Job Contract',
          Keywords: 'contract, agreement, job, kelmah'
        }
      });
      
      // Buffer to store PDF data
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add company logo (if available)
      try {
        const logoPath = path.join(__dirname, '../../../public/images/logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 140 })
            .moveDown();
        }
      } catch (err) {
        logger.warn('Logo not found for PDF generation', err);
      }
      
      // Add contract header
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('SERVICE CONTRACT', { align: 'center' })
         .moveDown();
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`Contract #: ${contract.contractNumber}`, { align: 'center' })
         .moveDown(0.5);
      
      // Add date
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Date: ${moment().format('MMMM D, YYYY')}`, { align: 'center' })
         .moveDown(2);
      
      // Add parties section
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('PARTIES', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`This Service Contract (the "Agreement") is entered into by and between:`, { align: 'left' })
         .moveDown(0.5);
      
      // Hirer details
      doc.font('Helvetica-Bold')
         .text(`CLIENT:`)
         .font('Helvetica')
         .text(`${contract.hirer?.name || 'CLIENT NAME'}`)
         .text(`Email: ${contract.hirer?.email || 'client@example.com'}`)
         .text(`Phone: ${contract.hirer?.phone || 'N/A'}`)
         .moveDown();
      
      // Worker details
      doc.font('Helvetica-Bold')
         .text(`SERVICE PROVIDER:`)
         .font('Helvetica')
         .text(`${contract.worker?.name || 'SERVICE PROVIDER NAME'}`)
         .text(`Email: ${contract.worker?.email || 'provider@example.com'}`)
         .text(`Phone: ${contract.worker?.phone || 'N/A'}`)
         .moveDown(2);
      
      // Contract details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('CONTRACT DETAILS', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Job Title:')
         .font('Helvetica')
         .text(`${contract.job?.title || contract.title || 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('Contract Title:')
         .font('Helvetica')
         .text(`${contract.title || 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('Description:')
         .font('Helvetica')
         .text(`${contract.description || 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('Start Date:')
         .font('Helvetica')
         .text(`${contract.startDate ? moment(contract.startDate).format('MMMM D, YYYY') : 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('End Date:')
         .font('Helvetica')
         .text(`${contract.endDate ? moment(contract.endDate).format('MMMM D, YYYY') : 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('Payment Amount:')
         .font('Helvetica')
         .text(`${contract.paymentAmount ? `${contract.currency || 'GHS'} ${parseFloat(contract.paymentAmount).toFixed(2)}` : 'N/A'}`)
         .moveDown(0.5);
      
      doc.font('Helvetica-Bold')
         .text('Payment Terms:')
         .font('Helvetica')
         .text(`${contract.paymentTerms || 'N/A'}`)
         .moveDown(2);
      
      // Milestones section
      if (contract.milestones && contract.milestones.length > 0) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('MILESTONES', { underline: true })
           .moveDown(0.5);
        
        contract.milestones.forEach((milestone, index) => {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(`Milestone ${index + 1}: ${milestone.title}`)
             .font('Helvetica')
             .text(`Description: ${milestone.description || 'N/A'}`)
             .text(`Amount: ${milestone.amount ? `${contract.currency || 'GHS'} ${parseFloat(milestone.amount).toFixed(2)}` : 'N/A'}`)
             .text(`Due Date: ${milestone.dueDate ? moment(milestone.dueDate).format('MMMM D, YYYY') : 'N/A'}`)
             .text(`Status: ${milestone.status || 'pending'}`)
             .moveDown();
        });
        
        doc.moveDown();
      }
      
      // Terms and conditions
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('TERMS AND CONDITIONS', { underline: true })
         .moveDown(0.5);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(contract.terms || 'No specific terms provided. Standard platform terms apply.', {
           align: 'left',
           columns: 1
         })
         .moveDown(2);
      
      // Signatures section
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('SIGNATURES', { underline: true })
         .moveDown(1);
      
      // Create signature blocks
      const signatureStartY = doc.y;
      
      // Client signature
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('CLIENT:', 50, signatureStartY);
      
      if (contract.hirerSignature) {
        // Convert data URL to Buffer
        const signatureData = contract.hirerSignature.replace(/^data:image\/\w+;base64,/, '');
        const signatureBuffer = Buffer.from(signatureData, 'base64');
        
        // Create a temporary file to store the signature
        const tempSignaturePath = path.join(__dirname, `../../../temp/hirer-signature-${contract.id}.png`);
        fs.writeFileSync(tempSignaturePath, signatureBuffer);
        
        // Add the signature image
        doc.image(tempSignaturePath, 50, signatureStartY + 20, { width: 150 });
        
        // Clean up the temporary file
        fs.unlinkSync(tempSignaturePath);
      } else {
        doc.rect(50, signatureStartY + 20, 150, 40).stroke();
      }
      
      doc.text(`Name: ${contract.hirer?.name || 'CLIENT NAME'}`, 50, signatureStartY + 70)
         .text(`Date: ${contract.hirerSignatureDate ? moment(contract.hirerSignatureDate).format('MMMM D, YYYY') : '_____________________'}`, 50, signatureStartY + 85);
      
      // Service provider signature
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('SERVICE PROVIDER:', 300, signatureStartY);
      
      if (contract.workerSignature) {
        // Convert data URL to Buffer
        const signatureData = contract.workerSignature.replace(/^data:image\/\w+;base64,/, '');
        const signatureBuffer = Buffer.from(signatureData, 'base64');
        
        // Create a temporary file to store the signature
        const tempSignaturePath = path.join(__dirname, `../../../temp/worker-signature-${contract.id}.png`);
        fs.writeFileSync(tempSignaturePath, signatureBuffer);
        
        // Add the signature image
        doc.image(tempSignaturePath, 300, signatureStartY + 20, { width: 150 });
        
        // Clean up the temporary file
        fs.unlinkSync(tempSignaturePath);
      } else {
        doc.rect(300, signatureStartY + 20, 150, 40).stroke();
      }
      
      doc.text(`Name: ${contract.worker?.name || 'SERVICE PROVIDER NAME'}`, 300, signatureStartY + 70)
         .text(`Date: ${contract.workerSignatureDate ? moment(contract.workerSignatureDate).format('MMMM D, YYYY') : '_____________________'}`, 300, signatureStartY + 85);
      
      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Add page number
        doc.fontSize(8)
           .font('Helvetica')
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
        
        // Add footer
        doc.fontSize(8)
           .font('Helvetica')
           .text(
             `Generated by Kelmah Platform on ${moment().format('MMMM D, YYYY [at] HH:mm')}`,
             50,
             doc.page.height - 35,
             { align: 'center' }
           );
      }
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      logger.error('Error generating contract PDF:', error);
      reject(error);
    }
  });
};

/**
 * Generate an invoice PDF
 * 
 * @param {Object} invoice - The invoice object with all related data
 * @returns {Buffer} PDF document as a buffer
 */
exports.generateInvoicePDF = async (invoice) => {
  // Similar implementation to generateContractPDF but for invoices
  // This is a placeholder for future implementation
  throw new Error('Invoice PDF generation not implemented yet');
}; 