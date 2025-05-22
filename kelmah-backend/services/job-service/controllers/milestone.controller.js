const Milestone = require('../models/milestone.model');
const Contract = require('../models/contract.model');
const { createNotification } = require('../utils/notification.utils');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const Job = require('../models/job.model');
const Escrow = require('../models/escrow.model');

// Get all milestones for a contract
exports.getMilestones = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Verify the user has access to this contract
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    // Check if user is either the hirer or worker on this contract
    const userId = req.user.id;
    if (contract.hirerId.toString() !== userId && contract.workerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to contract milestones' });
    }
    
    const milestones = await Milestone.find({ contractId }).sort({ order: 1 });
    res.status(200).json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new milestone
exports.createMilestone = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { title, description, amount, dueDate, deliverables } = req.body;
    
    // Verify the user is the hirer
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    // Only hirers can create milestones
    const userId = req.user.id;
    if (contract.hirerId.toString() !== userId) {
      return res.status(403).json({ message: 'Only the hirer can create milestones' });
    }
    
    // Get the count of existing milestones to determine the order
    const existingMilestonesCount = await Milestone.countDocuments({ contractId });
    
    const newMilestone = new Milestone({
      contractId,
      title,
      description,
      amount,
      dueDate,
      deliverables: deliverables || [],
      order: existingMilestonesCount + 1
    });
    
    await newMilestone.save();
    
    // Notify the worker
    await createNotification({
      userId: contract.workerId,
      type: 'NEW_MILESTONE',
      message: `A new milestone "${title}" has been added to your contract`,
      data: {
        contractId: contract._id,
        milestoneId: newMilestone._id
      }
    });
    
    res.status(201).json(newMilestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a milestone
exports.updateMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const updateData = req.body;
    
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Verify the user has access to this milestone
    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Associated contract not found' });
    }
    
    const userId = req.user.id;
    const isHirer = contract.hirerId.toString() === userId;
    const isWorker = contract.workerId.toString() === userId;
    
    if (!isHirer && !isWorker) {
      return res.status(403).json({ message: 'Unauthorized access to milestone' });
    }
    
    // Determine what fields can be updated based on user role and milestone status
    const allowedFields = [];
    
    if (isHirer) {
      // Hirers can update these fields if the milestone is pending or in progress
      if (milestone.status === 'pending' || milestone.status === 'in_progress') {
        allowedFields.push('title', 'description', 'amount', 'dueDate', 'deliverables');
      }
      
      // Hirers can approve or reject submitted milestones
      if (milestone.status === 'submitted') {
        allowedFields.push('status', 'feedback', 'approvalDate', 'rejectionReason');
      }
    }
    
    if (isWorker) {
      // Workers can update status to in_progress or submitted
      if (milestone.status === 'pending') {
        allowedFields.push('status'); // Can change to in_progress
      }
      
      if (milestone.status === 'in_progress') {
        allowedFields.push('status', 'submissionNotes', 'submissionDate'); // Can submit work
        
        // Allow workers to update deliverable completion status
        if (updateData.deliverables) {
          allowedFields.push('deliverables');
        }
      }
    }
    
    // Filter update data to only include allowed fields
    const filteredUpdate = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }
    
    // Special handling for status changes
    if (filteredUpdate.status) {
      // If worker is starting a milestone
      if (isWorker && milestone.status === 'pending' && filteredUpdate.status === 'in_progress') {
        // Additional logic for starting a milestone
      }
      
      // If worker is submitting a milestone
      if (isWorker && milestone.status === 'in_progress' && filteredUpdate.status === 'submitted') {
        filteredUpdate.submissionDate = new Date();
        
        // Notify the hirer
        await createNotification({
          userId: contract.hirerId,
          type: 'MILESTONE_SUBMITTED',
          message: `Milestone "${milestone.title}" has been submitted for review`,
          data: {
            contractId: contract._id,
            milestoneId: milestone._id
          }
        });
      }
      
      // If hirer is approving a milestone
      if (isHirer && milestone.status === 'submitted' && filteredUpdate.status === 'approved') {
        filteredUpdate.approvalDate = new Date();
        
        // Notify the worker
        await createNotification({
          userId: contract.workerId,
          type: 'MILESTONE_APPROVED',
          message: `Milestone "${milestone.title}" has been approved!`,
          data: {
            contractId: contract._id,
            milestoneId: milestone._id
          }
        });
      }
      
      // If hirer is rejecting a milestone
      if (isHirer && milestone.status === 'submitted' && filteredUpdate.status === 'rejected') {
        // Ensure rejection reason is provided
        if (!filteredUpdate.rejectionReason) {
          return res.status(400).json({ message: 'Rejection reason is required' });
        }
        
        // Notify the worker
        await createNotification({
          userId: contract.workerId,
          type: 'MILESTONE_REJECTED',
          message: `Milestone "${milestone.title}" requires revisions`,
          data: {
            contractId: contract._id,
            milestoneId: milestone._id,
            reason: filteredUpdate.rejectionReason
          }
        });
      }
    }
    
    // If there are no fields to update
    if (Object.keys(filteredUpdate).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    const updatedMilestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      filteredUpdate,
      { new: true }
    );
    
    res.status(200).json(updatedMilestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Verify the user is the hirer
    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Associated contract not found' });
    }
    
    const userId = req.user.id;
    if (contract.hirerId.toString() !== userId) {
      return res.status(403).json({ message: 'Only the hirer can delete milestones' });
    }
    
    // Only allow deletion of pending milestones
    if (milestone.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending milestones can be deleted' 
      });
    }
    
    await Milestone.findByIdAndDelete(milestoneId);
    
    // Reorder remaining milestones
    const remainingMilestones = await Milestone.find({ 
      contractId: milestone.contractId 
    }).sort({ order: 1 });
    
    const updateOperations = remainingMilestones.map((m, index) => {
      return Milestone.updateOne(
        { _id: m._id },
        { order: index + 1 }
      );
    });
    
    await Promise.all(updateOperations);
    
    res.status(200).json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific milestone
exports.getMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Verify the user has access to this milestone
    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Associated contract not found' });
    }
    
    const userId = req.user.id;
    if (contract.hirerId.toString() !== userId && contract.workerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to milestone' });
    }
    
    res.status(200).json(milestone);
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a milestone as paid
exports.markMilestonePaid = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Verify the user is the hirer
    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Associated contract not found' });
    }
    
    const userId = req.user.id;
    if (contract.hirerId.toString() !== userId) {
      return res.status(403).json({ message: 'Only the hirer can mark milestones as paid' });
    }
    
    // Only approved milestones can be marked as paid
    if (milestone.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Only approved milestones can be marked as paid' 
      });
    }
    
    if (milestone.isPaid) {
      return res.status(400).json({ message: 'Milestone is already marked as paid' });
    }
    
    const updatedMilestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      { isPaid: true },
      { new: true }
    );
    
    // Notify the worker
    await createNotification({
      userId: contract.workerId,
      type: 'MILESTONE_PAYMENT',
      message: `Payment for milestone "${milestone.title}" has been processed`,
      data: {
        contractId: contract._id,
        milestoneId: milestone._id,
        amount: milestone.amount
      }
    });
    
    res.status(200).json(updatedMilestone);
  } catch (error) {
    console.error('Error marking milestone as paid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMilestoneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;
    
    // Find the milestone
    const milestone = await Milestone.findByPk(id, {
      include: [
        { 
          model: Contract, 
          as: 'contract',
          include: [
            { model: Job, as: 'job' },
            { model: Escrow, as: 'escrow' }
          ] 
        }
      ]
    });
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    // Check if user has permission to update this milestone
    if (milestone.contract.hirerId !== req.userId && milestone.contract.workerId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this milestone'
      });
    }
    
    // Only certain status transitions are allowed
    const allowedTransitions = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['submitted', 'cancelled'],
      'submitted': ['approved', 'rejected'],
      'rejected': ['in_progress', 'cancelled'],
      'approved': [], // Terminal state
      'cancelled': [] // Terminal state
    };
    
    if (!allowedTransitions[milestone.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change milestone status from ${milestone.status} to ${status}`
      });
    }
    
    // Process status change
    milestone.status = status;
    
    // Add completion notes if provided
    if (completionNotes) {
      milestone.completionNotes = completionNotes;
    }
    
    // Set relevant timestamps based on status
    if (status === 'submitted') {
      milestone.submittedAt = new Date();
    } else if (status === 'approved') {
      milestone.approvedAt = new Date();
    } else if (status === 'rejected') {
      milestone.rejectedAt = new Date();
    }
    
    await milestone.save();
    
    // If milestone is approved, process payment release from escrow
    if (status === 'approved') {
      try {
        // Check if there's an escrow associated with this contract
        if (milestone.contract.escrow) {
          const escrow = milestone.contract.escrow;
          
          // Call payment service to release milestone payment
          const paymentData = {
            escrowId: escrow.id,
            amount: milestone.amount,
            currency: milestone.currency || escrow.currency,
            description: `Payment for milestone: ${milestone.title}`,
            releasedBy: req.userId,
            milestoneId: milestone.id,
            contractId: milestone.contractId,
            jobId: milestone.contract.jobId,
            recipientId: milestone.contract.workerId,
            payerId: milestone.contract.hirerId
          };
          
          // Make API call to payment service
          const paymentResponse = await axios.post(
            `${config.paymentServiceUrl}/api/escrow/release`, 
            paymentData,
            { headers: { Authorization: req.headers.authorization } }
          );
          
          // Update milestone with payment information
          milestone.paymentId = paymentResponse.data.paymentId;
          milestone.paymentStatus = 'completed';
          milestone.paidAt = new Date();
          await milestone.save();
          
          // Send notification to worker about payment
          await createNotification({
            userId: milestone.contract.workerId,
            type: 'MILESTONE_PAYMENT',
            title: 'Milestone Payment Released',
            message: `Payment for milestone "${milestone.title}" has been released`,
            data: {
              milestoneId: milestone.id,
              contractId: milestone.contractId,
              jobId: milestone.contract.jobId,
              amount: milestone.amount,
              currency: milestone.currency
            }
          });
        } else {
          logger.warn(`No escrow found for contract ID: ${milestone.contractId}`);
        }
      } catch (paymentError) {
        logger.error('Error processing milestone payment:', paymentError);
        // Don't fail the milestone approval if payment processing fails
        // We'll just log the error and allow admin to handle it manually
      }
      
      // Check if all milestones are completed to update contract status
      const allMilestones = await Milestone.findAll({
        where: { contractId: milestone.contractId }
      });
      
      const allCompleted = allMilestones.every(m => m.status === 'approved' || m.status === 'cancelled');
      
      if (allCompleted) {
        // Update contract status
        await Contract.update(
          { status: 'completed', completedAt: new Date() },
          { where: { id: milestone.contractId } }
        );
        
        // Update job status if all milestones are completed
        await Job.update(
          { status: 'completed', completedAt: new Date() },
          { where: { id: milestone.contract.jobId } }
        );
        
        // Enable reviews for both parties
        await Contract.update(
          { hirerCanReview: true, workerCanReview: true },
          { where: { id: milestone.contractId } }
        );
        
        // Send notifications to both parties about job completion
        await createNotification({
          userId: milestone.contract.hirerId,
          type: 'JOB_COMPLETED',
          title: 'Job Completed',
          message: `All milestones for "${milestone.contract.job.title}" have been completed`,
          data: { jobId: milestone.contract.jobId, contractId: milestone.contractId }
        });
        
        await createNotification({
          userId: milestone.contract.workerId,
          type: 'JOB_COMPLETED',
          title: 'Job Completed',
          message: `All milestones for "${milestone.contract.job.title}" have been completed`,
          data: { jobId: milestone.contract.jobId, contractId: milestone.contractId }
        });
      }
    }
    
    // Return the updated milestone
    res.status(200).json({
      success: true,
      message: 'Milestone status updated successfully',
      data: milestone
    });
  } catch (error) {
    console.error('Error updating milestone status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone status',
      error: error.message
    });
  }
}; 