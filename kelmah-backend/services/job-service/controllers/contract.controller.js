/**
 * Contract Controller
 * Handles API operations for contracts
 */

const db = require('../models');
const Contract = db.Contract;
const Milestone = db.Milestone;
const User = db.User;
const Job = db.Job;
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const notificationService = require('../../notification-service/socket/notificationSocket');
const { createNotification } = require('../utils/notification.utils');

// Utility functions
const { validateUUID } = require('../../../utils/validators');
const { sendError } = require('../../../utils/error-handler');

/**
 * Create a new contract
 * 
 * @route POST /api/contracts
 * @param {object} req.body - Contract data
 * @returns {object} Created contract
 */
exports.create = async (req, res) => {
  try {
    const { 
      jobId, title, description, terms, startDate, endDate,
      paymentAmount, paymentTerms, contractType, workerId,
      milestones = [] 
    } = req.body;
    
    // Validate required fields
    if (!jobId || !title || !paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, title, and payment amount are required'
      });
    }

    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Generate a contract number
    const contractNumber = await generateContractNumber();

    // Create the contract
    const contract = await Contract.create({
      jobId,
      contractNumber,
      title,
      description,
      terms,
      startDate,
      endDate,
      paymentAmount,
      paymentTerms,
      contractType,
      status: 'draft',
      hirerId: req.userId, // Current user is the hirer
      workerId,
      createdBy: req.userId
    });

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      const createdMilestones = await Promise.all(
        milestones.map(milestone => 
          Milestone.create({
            ...milestone,
            contractId: contract.id,
            status: 'pending',
            createdBy: req.userId
          })
        )
      );
      
      // Send notification for contract creation
      try {
        await notificationService.sendContractNotification(contract.id, 'created', {
          contractNumber: contract.contractNumber,
          hirerId: contract.hirerId,
          workerId: contract.workerId,
          jobId: contract.jobId,
          jobTitle: job.title
        });
      } catch (notificationError) {
        logger.error('Error sending contract creation notification:', notificationError);
        // Continue execution even if notification fails
      }
      
      // Return the contract with milestones
      return res.status(201).json({
      success: true,
        message: 'Contract created successfully',
      data: {
          ...contract.toJSON(),
          milestones: createdMilestones
        }
      });
    }
    
    // Send notification for contract creation
    try {
      await notificationService.sendContractNotification(contract.id, 'created', {
        contractNumber: contract.contractNumber,
        hirerId: contract.hirerId,
        workerId: contract.workerId,
        jobId: contract.jobId,
        jobTitle: job.title
      });
    } catch (notificationError) {
      logger.error('Error sending contract creation notification:', notificationError);
      // Continue execution even if notification fails
    }

    // Return the contract
    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Error creating contract:', error);
    sendError(res, error);
  }
};

/**
 * Get a contract
 * 
 * @route GET /api/contracts/:id
 * @param {string} id - Contract ID
 * @returns {object} Contract data
 */
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole || 'user';
    
    // Validate ID format
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    // Find the contract
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'hirer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'worker',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title']
        }
      ]
    });
    
    // Check if contract exists
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check permissions - only contract hirer and admins can view
    if (userRole !== 'admin' && contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this contract'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Error getting contract:', error);
    sendError(res, error);
  }
};

/**
 * Update a contract
 * 
 * @route PUT /api/contracts/:id
 * @param {string} id - Contract ID
 * @param {object} req.body - Updated contract data
 * @returns {object} Success message and updated contract
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, dueDate, jobId } = req.body;
    const userId = req.userId;
    
    if (!validateUUID(id)) {
        return res.status(400).json({
          success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    if (!title || !amount || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and job ID are required'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only contract hirer can update
    if (contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this contract'
      });
    }
    
    // Prevent updating contracts that are not in draft status
    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a contract with status: ${contract.status}`
      });
    }
    
    // Update contract data
    await contract.update({
      title,
      description,
      amount: parseFloat(amount),
      dueDate: dueDate || null,
      jobId,
      updatedBy: userId
    });
    
    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Error updating contract:', error);
    sendError(res, error);
  }
};

/**
 * Delete a contract
 * 
 * @route DELETE /api/contracts/:id
 * @param {string} id - Contract ID
 * @returns {object} Success message
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole || 'user';
    
    // Validate ID format
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    // Find the contract
    const contract = await Contract.findByPk(id);
    
    // Check if contract exists
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check permissions - only contract hirer and admins can delete
    if (userRole !== 'admin' && contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this contract'
      });
    }
    
    // Prevent deletion of contracts that are not in draft status
    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a contract with status: ${contract.status}`
      });
    }
    
    // Delete the contract
    await contract.destroy();
    
    // Return success message
    res.status(200).json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting contract:', error);
    sendError(res, error);
  }
};

/**
 * Send contract for signature
 * 
 * @route POST /api/contracts/:id/send-for-signature
 * @param {string} id - Contract ID
 * @returns {object} Updated contract
 */
exports.sendForSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole || 'user';
    
    // Validate ID format
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    // Find the contract with related data
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'hirer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'worker',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title']
        }
      ]
    });
    
    // Check if contract exists
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check permissions - only contract hirer and admins can send for signature
    if (userRole !== 'admin' && contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send this contract for signature'
      });
    }
    
    // Contract must be in draft status
    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Contract must be in draft status to send for signature (current: ${contract.status})`
      });
    }
    
    // Update contract status
    await contract.update({
      status: 'pending_signature',
      updatedBy: userId
    });
    
    // Send notification for signature request
    try {
      await notificationService.sendContractNotification(contract.id, 'signature_requested', {
        contractNumber: contract.contractNumber,
        hirerId: contract.hirerId,
        workerId: contract.workerId,
        jobId: contract.jobId,
        jobTitle: contract.job.title
      });
    } catch (notificationError) {
      logger.error('Error sending signature request notification:', notificationError);
      // Continue execution even if notification fails
    }
    
    // Send email notifications to both parties
    // To hirer
    await emailService.sendContractSignatureRequest({
      email: contract.hirer.email,
      name: contract.hirer.name,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      contractTitle: contract.title,
      jobTitle: contract.job.title,
      role: 'hirer'
    });
    
    // To worker
    await emailService.sendContractSignatureRequest({
      email: contract.worker.email,
      name: contract.worker.name,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      contractTitle: contract.title,
      jobTitle: contract.job.title,
      role: 'worker'
    });
    
    // Return updated contract
    res.status(200).json({
      success: true,
      message: 'Contract sent for signature successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Error sending contract for signature:', error);
    sendError(res, error);
  }
};

/**
 * Complete a contract
 * 
 * @route POST /api/contracts/:id/complete
 * @param {string} id - Contract ID
 * @param {object} req.body - Contains completion notes
 * @returns {object} Success message and updated contract
 */
exports.completeContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;
    const userId = req.user.id;
    
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only contract parties can complete a contract
    if (contract.hirerId !== userId && contract.workerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this contract'
      });
    }
    
    // Contract must be active to complete
    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active contracts can be completed'
      });
    }
    
    await contract.complete(completionNotes, userId);
    
    res.status(200).json({
      success: true,
      message: 'Contract completed successfully',
      data: contract
    });
  } catch (error) {
    console.error('Error completing contract:', error);
    sendError(res, error);
  }
};

/**
 * Cancel a contract
 * 
 * @route POST /api/contracts/:id/cancel
 * @param {string} id - Contract ID
 * @param {object} req.body - Contains cancellation reason
 * @returns {object} Success message and updated contract
 */
exports.cancelContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;
    
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only contract parties can cancel a contract
    if (contract.hirerId !== userId && contract.workerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this contract'
      });
    }
    
    // Contract must not be completed or already cancelled
    if (['completed', 'cancelled', 'terminated'].includes(contract.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a contract that is already ${contract.status}`
      });
    }
    
    await contract.cancel(cancellationReason, userId);
    
    res.status(200).json({
      success: true,
      message: 'Contract cancelled successfully',
      data: contract
    });
  } catch (error) {
    console.error('Error cancelling contract:', error);
    sendError(res, error);
  }
};

/**
 * Add a milestone to a contract
 * 
 * @route POST /api/contracts/:id/milestone
 * @param {string} id - Contract ID
 * @param {object} req.body - Milestone data
 * @returns {object} Success message and updated contract
 */
exports.addMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, dueDate } = req.body;
    const userId = req.user.id;
    
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Title and amount are required'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only hirer can add milestones
    if (contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the hirer can add milestones'
      });
    }
    
    // Contract must be in draft or active status
    if (!['draft', 'active'].includes(contract.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot add milestones to a ${contract.status} contract`
      });
    }
    
    // Create milestone object
    const milestone = {
      id: require('uuid').v4(),
      title,
      description: description || '',
      amount: parseFloat(amount),
      dueDate: dueDate || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: userId
    };
    
    // Add milestone to contract
    const milestones = [...(contract.milestones || []), milestone];
    await contract.update({
      milestones,
      lastModifiedBy: userId
    });
    
    res.status(201).json({
      success: true,
      message: 'Milestone added successfully',
      data: {
        milestone,
        contract
      }
    });
  } catch (error) {
    console.error('Error adding milestone:', error);
    sendError(res, error);
  }
};

/**
 * Update a milestone
 * 
 * @route PUT /api/contracts/:id/milestone/:milestoneId
 * @param {string} id - Contract ID
 * @param {string} milestoneId - Milestone ID
 * @param {object} req.body - Updated milestone data
 * @returns {object} Success message and updated contract
 */
exports.updateMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { status, completionNotes } = req.body;
    const userId = req.userId;
    
    // Validate IDs
    if (!validateUUID(id) || !validateUUID(milestoneId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    // Find the contract with related data
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'hirer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'worker',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title']
        }
      ]
    });
    
    // Check if contract exists
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Check if user is a party to the contract
    if (contract.hirerId !== userId && contract.workerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update milestones for this contract'
      });
    }
    
    // Find the milestone
    const milestone = await Milestone.findOne({
      where: {
        id: milestoneId,
        contractId: id
      }
    });
    
    // Check if milestone exists
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    // Contract must be active to update milestone status
    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Milestones can only be updated for active contracts'
      });
    }
    
    // Update milestone
    await milestone.update({
      status,
      ...(status === 'completed' && { 
        completedAt: new Date(),
        completedBy: userId,
        completionNotes: completionNotes || null
      }),
      updatedBy: userId
    });
    
    // Send notification if milestone is completed
    if (status === 'completed') {
      try {
        const completer = await User.findByPk(userId);
        
        await notificationService.sendContractNotification(contract.id, 'milestone_completed', {
          contractNumber: contract.contractNumber,
          hirerId: contract.hirerId,
          workerId: contract.workerId,
          jobId: contract.jobId,
          jobTitle: contract.job.title,
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          completedBy: completer?.name || 'A user'
        });
      } catch (notificationError) {
        logger.error('Error sending milestone completion notification:', notificationError);
        // Continue execution even if notification fails
      }
    }
    
    // Check if all milestones are completed
    const allMilestones = await Milestone.findAll({
      where: { contractId: id }
    });
    
    const allCompleted = allMilestones.every(m => m.status === 'completed');
    
    // If all milestones are completed, update contract status
    if (allCompleted) {
    await contract.update({
        status: 'completed',
        completedAt: new Date(),
        completedBy: userId,
        updatedBy: userId
      });
      
      // Send notification for contract completion
      try {
        await notificationService.sendContractNotification(contract.id, 'completed', {
          contractNumber: contract.contractNumber,
          hirerId: contract.hirerId,
          workerId: contract.workerId,
          jobId: contract.jobId,
          jobTitle: contract.job.title
        });
      } catch (notificationError) {
        logger.error('Error sending contract completion notification:', notificationError);
        // Continue execution even if notification fails
      }
      
      // Send notifications to both parties
      // Send email to hirer
      await emailService.sendContractCompleted({
        email: contract.hirer.email,
        name: contract.hirer.name,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        contractTitle: contract.title,
        role: 'hirer'
      });
      
      // Send email to worker
      await emailService.sendContractCompleted({
        email: contract.worker.email,
        name: contract.worker.name,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        contractTitle: contract.title,
        role: 'worker'
      });
    }
    
    // Return updated milestone and contract status
    res.status(200).json({
      success: true,
      message: 'Milestone updated successfully',
      data: {
        milestone,
        contractStatus: allCompleted ? 'completed' : contract.status,
        allMilestonesCompleted: allCompleted
      }
    });
  } catch (error) {
    logger.error('Error updating milestone:', error);
    sendError(res, error);
  }
};

/**
 * Delete a milestone
 * 
 * @route DELETE /api/contracts/:id/milestone/:milestoneId
 * @param {string} id - Contract ID
 * @param {string} milestoneId - Milestone ID
 * @returns {object} Success message and updated contract
 */
exports.deleteMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const userId = req.userId;
    
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only hirer can delete milestones
    if (contract.hirerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the hirer can delete milestones'
      });
    }
    
    // Find the milestone
    let milestones = contract.milestones || [];
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    
    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    // Cannot delete completed milestones
    if (milestones[milestoneIndex].status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed milestone'
      });
    }
    
    // Remove the milestone
    milestones = milestones.filter(m => m.id !== milestoneId);
    
    await contract.update({
      milestones,
      lastModifiedBy: userId
    });
    
    res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully',
      data: {
        contract
      }
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    sendError(res, error);
  }
};

/**
 * Complete a milestone
 * 
 * @route POST /api/contracts/:id/milestone/:milestoneId/complete
 * @param {string} id - Contract ID
 * @param {string} milestoneId - Milestone ID
 * @returns {object} Success message and updated contract
 */
exports.completeMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const userId = req.userId;
    
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    const contract = await Contract.findByPk(id);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Only contract parties can complete milestones
    if (contract.hirerId !== userId && contract.workerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this milestone'
      });
    }
    
    // Contract must be active
    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Milestones can only be completed for active contracts'
      });
    }
    
    // Find the milestone
    const milestones = contract.milestones || [];
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    
    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    // Cannot complete already completed milestones
    if (milestones[milestoneIndex].status === 'completed') {
      return res.status(400).json({
      success: false,
        message: 'Milestone is already completed'
      });
    }
    
    // Update milestone status
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: userId
    };
    
    await contract.update({
      milestones,
      lastModifiedBy: userId
    });
    
    // Check if all milestones are completed
    const allCompleted = milestones.every(m => m.status === 'completed');
    
    await notificationService.sendContractNotification(contract.id, 'milestone_completed', {
      contractNumber: contract.contractNumber,
      hirerId: contract.hirerId,
      workerId: contract.workerId,
      jobId: contract.jobId,
      jobTitle: contract.job?.title || 'Job',
      milestoneId: milestones[milestoneIndex].id,
      milestoneTitle: milestones[milestoneIndex].title,
      completedBy: userId
    });
    
    res.status(200).json({
      success: true,
      message: 'Milestone completed successfully',
      data: {
        milestone: milestones[milestoneIndex],
        contract,
        allMilestonesCompleted: allCompleted
      }
    });
  } catch (error) {
    console.error('Error completing milestone:', error);
    sendError(res, error);
  }
};

/**
 * Search contracts with advanced filtering
 * 
 * @route GET /api/contracts/search
 * @param {object} req.query - Search parameters
 * @returns {object} List of contracts and pagination info
 */
exports.searchContracts = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Extract search parameters from query
    const { 
      status, jobId, title, startDateFrom, startDateTo,
      endDateFrom, endDateTo, minAmount, maxAmount, page, limit 
    } = req.query;
    
    const params = {
      userId,
      userRole,
      status,
      jobId,
      title,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      minAmount,
      maxAmount,
      page,
      limit
    };
    
    const result = await Contract.searchContracts(params);
    
    res.status(200).json({
      success: true,
      data: result.contracts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error searching contracts:', error);
    sendError(res, error);
  }
};

/**
 * Get contract statistics
 * 
 * @route GET /api/contracts/stats
 * @returns {object} Contract statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole || 'user';
    
    // Prepare filter based on user role
    const condition = userRole === 'admin' 
      ? {} 
      : { 
          [Op.or]: [
            { hirerId: userId },
            { workerId: userId }
          ]
        };
    
    // Get counts by status
    const [
      totalCount,
      draftCount,
      pendingSignatureCount,
      activeCount,
      completedCount,
      cancelledCount
    ] = await Promise.all([
      Contract.count({ where: condition }),
      Contract.count({ where: { ...condition, status: 'draft' } }),
      Contract.count({ where: { ...condition, status: 'pending_signature' } }),
      Contract.count({ where: { ...condition, status: 'active' } }),
      Contract.count({ where: { ...condition, status: 'completed' } }),
      Contract.count({ where: { ...condition, status: 'cancelled' } })
    ]);
    
    // Get totals by role
    let hirerTotal = 0;
    let workerTotal = 0;
    
    if (userRole === 'admin' || userRole === 'client') {
      hirerTotal = await Contract.count({
        where: { hirerId: userId }
      });
    }
    
    if (userRole === 'admin' || userRole === 'worker') {
      workerTotal = await Contract.count({
        where: { workerId: userId }
      });
    }
    
    // Get recent contracts
    const recentContracts = await Contract.findAll({
      where: condition,
      include: [
        {
          model: User,
          as: 'hirer',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'worker',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    // Return statistics
    res.status(200).json({
      success: true,
      data: {
        totalCount,
        byStatus: {
          draft: draftCount,
          pendingSignature: pendingSignatureCount,
          active: activeCount,
          completed: completedCount,
          cancelled: cancelledCount
        },
        byRole: {
          hirer: hirerTotal,
          worker: workerTotal
        },
        recentContracts
      }
    });
  } catch (error) {
    logger.error('Error getting contract statistics:', error);
    sendError(res, error);
  }
};

/**
 * Helper function to generate a unique contract number
 */
async function generateContractNumber() {
  // Get current year and month
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get count of contracts created this month
  const count = await Contract.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1)
      }
    }
  });
  
  // Generate sequential number
  const sequence = String(count + 1).padStart(4, '0');
  
  // Combine parts: K-YY-MM-NNNN
  return `K-${year}-${month}-${sequence}`;
}

/**
 * Sign a contract
 * 
 * @route POST /api/contracts/:id/sign
 * @param {string} id - Contract ID
 * @param {object} req.body - Signature data
 * @returns {object} Updated contract
 */
exports.signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, comments } = req.body;
    const userId = req.userId;
    
    // Validate ID and signature
    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract ID format'
      });
    }
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Signature is required'
      });
    }
    
    // Find the contract with related data
    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'hirer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'worker',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title']
        }
      ]
    });
    
    // Check if contract exists
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }
    
    // Contract must be in pending_signature status
    if (contract.status !== 'pending_signature') {
      return res.status(400).json({
        success: false,
        message: `Contract must be in pending_signature status to sign (current: ${contract.status})`
      });
    }
    
    // Check if user is a party to the contract
    if (contract.hirerId !== userId && contract.workerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to sign this contract'
      });
    }
    
    // Determine if user is hirer or worker and update accordingly
    const isHirer = contract.hirerId === userId;
    const signatureDate = new Date();
    
    const updateData = isHirer 
      ? {
          hirerSignature: signature,
          hirerSignatureDate: signatureDate,
          hirerComments: comments || null
        }
      : {
          workerSignature: signature,
          workerSignatureDate: signatureDate,
          workerComments: comments || null
        };
    
    // Check if both parties have now signed
    let newStatus = contract.status;
    if (
      (isHirer && contract.workerSignatureDate) ||
      (!isHirer && contract.hirerSignatureDate)
    ) {
      newStatus = 'active';
    }
    
    // Update contract
    await contract.update({
      ...updateData,
      status: newStatus,
      ...(newStatus === 'active' && { activatedAt: new Date() }),
      updatedBy: userId
    });
    
    // Send notification for contract signature
    try {
      const signerName = isHirer ? contract.hirer.name : contract.worker.name;
      const signerRole = isHirer ? 'hirer' : 'worker';
      
      await notificationService.sendContractNotification(contract.id, 'signed', {
        contractNumber: contract.contractNumber,
        hirerId: contract.hirerId,
        workerId: contract.workerId,
        jobId: contract.jobId,
        jobTitle: contract.job.title,
        signerName,
        signerRole
      });
    } catch (notificationError) {
      logger.error('Error sending contract signature notification:', notificationError);
      // Continue execution even if notification fails
    }
    
    // If contract is now active, send additional notification
    if (newStatus === 'active') {
      try {
        await notificationService.sendContractNotification(contract.id, 'activated', {
          contractNumber: contract.contractNumber,
          hirerId: contract.hirerId,
          workerId: contract.workerId,
          jobId: contract.jobId,
          jobTitle: contract.job.title
        });
      } catch (notificationError) {
        logger.error('Error sending contract activation notification:', notificationError);
        // Continue execution even if notification fails
      }
      
      // Send email to hirer
      await emailService.sendContractActivated({
        email: contract.hirer.email,
        name: contract.hirer.name,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        contractTitle: contract.title,
        role: 'hirer'
      });
      
      // Send email to worker
      await emailService.sendContractActivated({
        email: contract.worker.email,
        name: contract.worker.name,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        contractTitle: contract.title,
        role: 'worker'
      });
    }
    
    // Return updated contract
    res.status(200).json({
      success: true,
      message: 'Contract signed successfully',
      data: {
        contractId: contract.id,
        status: newStatus,
        isFullySigned: newStatus === 'active'
      }
    });
  } catch (error) {
    logger.error('Error signing contract:', error);
    sendError(res, error);
  }
};

/**
 * Create a contract automatically when a job application is accepted
 * @param {Object} jobData - The job object
 * @param {Object} applicationData - The application object
 * @returns {Promise<Object>} - The created contract
 */
exports.createContractFromApplication = async (jobData, applicationData) => {
  try {
    const { Contract } = await getModels();
    
    // Generate contract number
    const contractNumber = `CNT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Create basic contract
    const contract = await Contract.create({
      contractNumber,
      jobId: jobData.id,
      hirerId: jobData.hirerId,
      workerId: applicationData.workerId,
      title: `Contract for: ${jobData.title}`,
      description: jobData.description,
      totalAmount: applicationData.proposedBudget,
      currency: applicationData.currency || jobData.currency,
      paymentType: applicationData.milestoneProposal?.length > 0 ? 'milestone' : jobData.paymentType,
      status: 'draft',
      startDate: new Date(),
      endDate: jobData.deadline || null,
      milestones: applicationData.milestoneProposal || []
    });
    
    // Add default terms
    const defaultTerms = `
This Agreement is made between the Hirer and the Worker for the services described in the job posting.

1. Services: The Worker agrees to perform the services described in the job posting to the satisfaction of the Hirer.

2. Payment: The Hirer agrees to pay the Worker the agreed amount upon satisfactory completion of the services or as per the milestone schedule.

3. Timeline: The work shall commence upon signing of this contract and be completed according to the agreed timeline.

4. Confidentiality: Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this agreement.

5. Intellectual Property: Upon full payment, all intellectual property rights for the deliverables shall transfer to the Hirer, unless otherwise specified.

6. Termination: Either party may terminate this agreement with written notice if the other party breaches this agreement.

7. Dispute Resolution: Any disputes shall be resolved through the platform's dispute resolution process.

Total Contract Value: ${contract.totalAmount} ${contract.currency}
`;
    
    contract.terms = defaultTerms;
    await contract.save();
    
    // Update job with contract ID
    await jobData.update({ contractId: contract.id });
    
    // Create notifications for both parties
    await createNotification({
      userId: jobData.hirerId,
      type: 'CONTRACT_CREATED',
      title: 'Contract Created',
      message: `A contract has been created for the job: ${jobData.title}`,
      data: {
        jobId: jobData.id,
        contractId: contract.id
      }
    });
    
    await createNotification({
      userId: applicationData.workerId,
      type: 'CONTRACT_CREATED',
      title: 'Contract Created',
      message: `A contract has been created for the job: ${jobData.title}`,
      data: {
        jobId: jobData.id,
        contractId: contract.id
      }
    });
    
    return contract;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}; 