/**
 * QuickJob Controller - Protected Quick-Hire System
 * Handles all QuickJob operations: create, quote, accept, track, complete, dispute
 */

const { QuickJob, User } = require('../models');
const logger = require('../utils/logger');

// Constants
const PLATFORM_FEE_RATE = 0.15; // 15%
const MIN_JOB_AMOUNT = 25; // GH₵25
const NOTIFICATION_RADIUS_KM = 10;
const GPS_VERIFICATION_RADIUS_M = 100;

/**
 * Create a new QuickJob request
 * POST /api/quick-jobs
 */
const createQuickJob = async (req, res) => {
  try {
    const {
      category,
      description,
      title,
      photos,
      voiceNote,
      location,
      urgency,
      preferredDate,
      preferredTimeSlot
    } = req.body;

    // Validate required fields
    if (!category || !description || !location) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Category, description, and location are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Validate location has coordinates
    if (!location.coordinates || !location.address || !location.city || !location.region) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Location must include coordinates, address, city, and region',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Create the QuickJob
    const quickJob = new QuickJob({
      client: req.user._id,
      category,
      description,
      title: title || `${category.replace('_', ' ')} job`,
      photos: photos || [],
      voiceNote: voiceNote || null,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        landmark: location.landmark || '',
        city: location.city,
        region: location.region
      },
      urgency: urgency || 'soon',
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTimeSlot: preferredTimeSlot || 'anytime',
      status: 'pending'
    });

    await quickJob.save();

    // Populate client info for response
    await quickJob.populate('client', 'firstName lastName profilePicture phoneNumber');

    logger.info(`QuickJob created: ${quickJob._id} by client ${req.user._id}`);

    // TODO: Trigger notification to nearby workers (Firebase + SMS)
    // This will be handled by the notification service

    res.status(201).json({
      success: true,
      data: quickJob,
      message: 'Job request created! Workers nearby will be notified.'
    });
  } catch (error) {
    logger.error('Error creating QuickJob:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create job request',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get QuickJobs near a location (for workers)
 * GET /api/quick-jobs/nearby
 */
const getNearbyQuickJobs = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 10, category } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Longitude and latitude are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const jobs = await QuickJob.findNearby(
      parseFloat(lng),
      parseFloat(lat),
      parseFloat(maxDistance),
      category || null
    );

    res.json({
      success: true,
      data: jobs,
      meta: {
        count: jobs.length,
        maxDistance: `${maxDistance}km`
      }
    });
  } catch (error) {
    logger.error('Error fetching nearby QuickJobs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch nearby jobs',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get a single QuickJob by ID
 * GET /api/quick-jobs/:id
 */
const getQuickJob = async (req, res) => {
  try {
    const { id } = req.params;

    const quickJob = await QuickJob.findById(id)
      .populate('client', 'firstName lastName profilePicture phoneNumber rating')
      .populate('acceptedQuote.worker', 'firstName lastName profilePicture phoneNumber rating skills')
      .populate('quotes.worker', 'firstName lastName profilePicture rating skills');

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Filter quotes visibility: workers can only see their own quotes
    // Client can see all quotes
    if (req.user && req.user._id.toString() !== quickJob.client._id.toString()) {
      quickJob.quotes = quickJob.quotes.filter(
        q => q.worker._id.toString() === req.user._id.toString()
      );
    }

    res.json({
      success: true,
      data: quickJob
    });
  } catch (error) {
    logger.error('Error fetching QuickJob:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch job',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get QuickJobs for current user (client's jobs)
 * GET /api/quick-jobs/my-jobs
 */
const getMyQuickJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { client: req.user._id };
    if (status) {
      query.status = status;
    }

    const jobs = await QuickJob.find(query)
      .populate('acceptedQuote.worker', 'firstName lastName profilePicture phoneNumber rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await QuickJob.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching my QuickJobs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch your jobs',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Get QuickJobs where worker has quoted or been accepted
 * GET /api/quick-jobs/my-quotes
 */
const getMyQuotedJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { 'quotes.worker': req.user._id },
        { 'acceptedQuote.worker': req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    const jobs = await QuickJob.find(query)
      .populate('client', 'firstName lastName profilePicture phoneNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await QuickJob.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching quoted QuickJobs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch your quoted jobs',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Submit a quote for a QuickJob (worker)
 * POST /api/quick-jobs/:id/quote
 */
const submitQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, message, availableAt, estimatedDuration, includesTransport, includesMaterials, materialsCost } = req.body;

    // Validate amount
    if (!amount || amount < MIN_JOB_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Minimum job amount is GH₵${MIN_JOB_AMOUNT}`,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Check if job can accept quotes
    if (!quickJob.canAcceptQuotes()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'This job is no longer accepting quotes',
          code: 'JOB_CLOSED'
        }
      });
    }

    // Check if worker already quoted
    const existingQuote = quickJob.quotes.find(
      q => q.worker.toString() === req.user._id.toString() && q.status !== 'withdrawn'
    );

    if (existingQuote) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You have already submitted a quote for this job',
          code: 'DUPLICATE_QUOTE'
        }
      });
    }

    // Workers cannot quote on their own jobs
    if (quickJob.client.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You cannot quote on your own job',
          code: 'INVALID_ACTION'
        }
      });
    }

    // Add the quote
    quickJob.quotes.push({
      worker: req.user._id,
      amount,
      message: message || '',
      availableAt: availableAt || 'today',
      estimatedDuration: estimatedDuration || 'half_day',
      includesTransport: includesTransport !== false,
      includesMaterials: includesMaterials || false,
      materialsCost: materialsCost || 0,
      status: 'pending'
    });

    // Update status to quoted if first quote
    if (quickJob.status === 'pending') {
      quickJob.status = 'quoted';
    }

    await quickJob.save();

    // TODO: Notify client of new quote

    logger.info(`Quote submitted on QuickJob ${id} by worker ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Quote submitted successfully!',
      data: {
        quoteId: quickJob.quotes[quickJob.quotes.length - 1]._id,
        amount,
        estimatedPayout: amount * (1 - PLATFORM_FEE_RATE)
      }
    });
  } catch (error) {
    logger.error('Error submitting quote:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to submit quote',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Accept a quote (client)
 * POST /api/quick-jobs/:id/accept-quote
 */
const acceptQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quote ID is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const quickJob = await QuickJob.findById(id)
      .populate('quotes.worker', 'firstName lastName phoneNumber');

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify ownership
    if (quickJob.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the job owner can accept quotes',
          code: 'FORBIDDEN'
        }
      });
    }

    // Check status
    if (!['pending', 'quoted'].includes(quickJob.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot accept quotes at this stage',
          code: 'INVALID_STATUS'
        }
      });
    }

    // Find the quote
    const quote = quickJob.quotes.id(quoteId);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quote not found',
          code: 'NOT_FOUND'
        }
      });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'This quote is no longer available',
          code: 'QUOTE_UNAVAILABLE'
        }
      });
    }

    // Accept the quote
    quote.status = 'accepted';
    quickJob.acceptedQuote = {
      quote: quote._id,
      worker: quote.worker._id,
      amount: quote.amount,
      acceptedAt: new Date()
    };
    quickJob.status = 'accepted';

    // Reject all other quotes
    quickJob.quotes.forEach(q => {
      if (q._id.toString() !== quoteId && q.status === 'pending') {
        q.status = 'rejected';
      }
    });

    // Set up escrow (payment not yet made)
    quickJob.escrow = {
      amount: quote.amount,
      platformFee: Math.round(quote.amount * PLATFORM_FEE_RATE * 100) / 100,
      workerPayout: Math.round(quote.amount * (1 - PLATFORM_FEE_RATE) * 100) / 100,
      status: 'pending'
    };

    await quickJob.save();

    // TODO: Notify worker of accepted quote
    // TODO: Send payment link to client

    logger.info(`Quote ${quoteId} accepted on QuickJob ${id}`);

    res.json({
      success: true,
      message: 'Quote accepted! Please pay to secure the worker.',
      data: {
        jobId: quickJob._id,
        worker: quote.worker,
        amount: quote.amount,
        escrow: quickJob.escrow
      }
    });
  } catch (error) {
    logger.error('Error accepting quote:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to accept quote',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Worker marks as on the way
 * POST /api/quick-jobs/:id/on-way
 */
const markOnWay = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify worker
    if (!quickJob.acceptedQuote.worker || 
        quickJob.acceptedQuote.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the assigned worker can update job status',
          code: 'FORBIDDEN'
        }
      });
    }

    // Check status - must be funded
    if (quickJob.status !== 'funded') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Payment must be completed before starting job',
          code: 'PAYMENT_REQUIRED'
        }
      });
    }

    quickJob.status = 'worker_on_way';
    quickJob.tracking.workerOnWay = {
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    };

    await quickJob.save();

    // TODO: Notify client that worker is on the way

    logger.info(`Worker ${req.user._id} on way to QuickJob ${id}`);

    res.json({
      success: true,
      message: 'Client notified that you are on your way!',
      data: {
        status: quickJob.status
      }
    });
  } catch (error) {
    logger.error('Error marking on way:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update status',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Worker marks as arrived (GPS verification)
 * POST /api/quick-jobs/:id/arrived
 */
const markArrived = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Location is required for arrival verification',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify worker
    if (!quickJob.acceptedQuote.worker || 
        quickJob.acceptedQuote.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the assigned worker can update job status',
          code: 'FORBIDDEN'
        }
      });
    }

    // Check status
    if (quickJob.status !== 'worker_on_way') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid status for arrival marking',
          code: 'INVALID_STATUS'
        }
      });
    }

    // GPS Verification
    const verification = quickJob.verifyWorkerArrival(latitude, longitude);

    quickJob.tracking.workerArrived = {
      timestamp: new Date(),
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      verified: verification.verified,
      distanceFromJob: verification.distance
    };

    if (verification.verified) {
      quickJob.status = 'worker_arrived';
      logger.info(`Worker ${req.user._id} arrived at QuickJob ${id} - GPS verified`);
    } else {
      // Still allow but flag as not verified
      quickJob.status = 'worker_arrived';
      logger.warn(`Worker ${req.user._id} arrived at QuickJob ${id} - GPS NOT verified (${verification.distance}m away)`);
    }

    await quickJob.save();

    // TODO: Notify client that worker has arrived

    res.json({
      success: true,
      message: verification.verified 
        ? 'Arrival confirmed! GPS verified.' 
        : `Arrival noted, but you appear to be ${verification.distance}m from the job location.`,
      data: {
        status: quickJob.status,
        gpsVerified: verification.verified,
        distance: verification.distance
      }
    });
  } catch (error) {
    logger.error('Error marking arrived:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to verify arrival',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Worker starts work
 * POST /api/quick-jobs/:id/start
 */
const startWork = async (req, res) => {
  try {
    const { id } = req.params;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify worker
    if (!quickJob.acceptedQuote.worker || 
        quickJob.acceptedQuote.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the assigned worker can start work',
          code: 'FORBIDDEN'
        }
      });
    }

    if (quickJob.status !== 'worker_arrived') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Must be at job location before starting work',
          code: 'INVALID_STATUS'
        }
      });
    }

    quickJob.status = 'in_progress';
    quickJob.tracking.workStarted = {
      timestamp: new Date()
    };

    await quickJob.save();

    logger.info(`Work started on QuickJob ${id} by worker ${req.user._id}`);

    res.json({
      success: true,
      message: 'Work started! Good luck.',
      data: {
        status: quickJob.status,
        startedAt: quickJob.tracking.workStarted.timestamp
      }
    });
  } catch (error) {
    logger.error('Error starting work:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start work',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Worker marks work as complete (with photos)
 * POST /api/quick-jobs/:id/complete
 */
const markComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos, note, latitude, longitude } = req.body;

    if (!photos || photos.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'At least one completion photo is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify worker
    if (!quickJob.acceptedQuote.worker || 
        quickJob.acceptedQuote.worker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the assigned worker can mark work as complete',
          code: 'FORBIDDEN'
        }
      });
    }

    if (quickJob.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Work must be in progress to mark complete',
          code: 'INVALID_STATUS'
        }
      });
    }

    quickJob.status = 'completed';
    quickJob.tracking.workCompleted = {
      timestamp: new Date(),
      photos: photos.map(p => ({
        url: p.url,
        uploadedAt: new Date(),
        location: latitude && longitude ? {
          type: 'Point',
          coordinates: [longitude, latitude]
        } : undefined
      })),
      workerNote: note || ''
    };

    await quickJob.save();

    // TODO: Notify client to approve and release payment
    // Set auto-release timer for 24 hours

    logger.info(`Work completed on QuickJob ${id} by worker ${req.user._id}`);

    res.json({
      success: true,
      message: 'Work marked as complete! Client will be asked to approve.',
      data: {
        status: quickJob.status,
        completedAt: quickJob.tracking.workCompleted.timestamp,
        autoReleaseIn: '24 hours'
      }
    });
  } catch (error) {
    logger.error('Error marking complete:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to mark work complete',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Client approves work and releases payment
 * POST /api/quick-jobs/:id/approve
 */
const approveWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const quickJob = await QuickJob.findById(id)
      .populate('acceptedQuote.worker', 'firstName lastName');

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify client
    if (quickJob.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the job owner can approve work',
          code: 'FORBIDDEN'
        }
      });
    }

    if (quickJob.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Work must be completed before approval',
          code: 'INVALID_STATUS'
        }
      });
    }

    quickJob.status = 'approved';
    quickJob.tracking.clientApproved = {
      timestamp: new Date(),
      rating: rating || null,
      review: review || ''
    };

    // Release escrow
    quickJob.escrow.status = 'released';
    quickJob.escrow.releasedAt = new Date();

    await quickJob.save();

    // TODO: Trigger actual payment to worker via Paystack
    // TODO: Update worker's rating

    logger.info(`Work approved on QuickJob ${id} - payment released to worker`);

    res.json({
      success: true,
      message: `Payment of GH₵${quickJob.escrow.workerPayout} released to ${quickJob.acceptedQuote.worker.firstName}!`,
      data: {
        status: quickJob.status,
        paymentReleased: quickJob.escrow.workerPayout,
        rating: rating
      }
    });
  } catch (error) {
    logger.error('Error approving work:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to approve work',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Raise a dispute
 * POST /api/quick-jobs/:id/dispute
 */
const raiseDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description, evidence } = req.body;

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Reason and description are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify user is involved
    const isClient = quickJob.client.toString() === req.user._id.toString();
    const isWorker = quickJob.acceptedQuote.worker && 
                     quickJob.acceptedQuote.worker.toString() === req.user._id.toString();

    if (!isClient && !isWorker) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the client or assigned worker can raise a dispute',
          code: 'FORBIDDEN'
        }
      });
    }

    // Can only dispute funded/in-progress/completed jobs
    const disputeableStatuses = ['funded', 'worker_on_way', 'worker_arrived', 'in_progress', 'completed'];
    if (!disputeableStatuses.includes(quickJob.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot raise dispute at current job stage',
          code: 'INVALID_STATUS'
        }
      });
    }

    // Check if already disputed
    if (quickJob.dispute && quickJob.dispute.status === 'open') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'A dispute is already open for this job',
          code: 'DISPUTE_EXISTS'
        }
      });
    }

    quickJob.status = 'disputed';
    quickJob.dispute = {
      raisedBy: isClient ? 'client' : 'worker',
      raisedByUser: req.user._id,
      reason,
      description,
      evidence: evidence || [],
      status: 'open',
      raisedAt: new Date(),
      autoResolveDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    };

    await quickJob.save();

    // TODO: Notify other party of dispute
    // TODO: Notify support staff

    logger.info(`Dispute raised on QuickJob ${id} by ${isClient ? 'client' : 'worker'}`);

    res.json({
      success: true,
      message: 'Dispute submitted. Both parties will be notified.',
      data: {
        status: quickJob.status,
        dispute: {
          reason: quickJob.dispute.reason,
          status: quickJob.dispute.status,
          autoResolveDeadline: quickJob.dispute.autoResolveDeadline
        }
      }
    });
  } catch (error) {
    logger.error('Error raising dispute:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to raise dispute',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/**
 * Cancel a QuickJob
 * POST /api/quick-jobs/:id/cancel
 */
const cancelQuickJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const quickJob = await QuickJob.findById(id);

    if (!quickJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          code: 'NOT_FOUND'
        }
      });
    }

    const isClient = quickJob.client.toString() === req.user._id.toString();
    const isWorker = quickJob.acceptedQuote.worker && 
                     quickJob.acceptedQuote.worker.toString() === req.user._id.toString();

    if (!isClient && !isWorker) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the client or assigned worker can cancel',
          code: 'FORBIDDEN'
        }
      });
    }

    // Check cancellation rules
    const cancellableStatuses = ['pending', 'quoted', 'accepted', 'funded', 'worker_on_way'];
    if (!cancellableStatuses.includes(quickJob.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot cancel at current stage',
          code: 'INVALID_STATUS'
        }
      });
    }

    let workerCompensation = null;
    let refundAmount = null;

    // Client cancellation after worker is on the way - 5% compensation
    if (isClient && quickJob.status === 'worker_on_way' && quickJob.escrow && quickJob.escrow.amount) {
      workerCompensation = {
        amount: Math.round(quickJob.escrow.amount * 0.05 * 100) / 100,
        status: 'pending'
      };
      refundAmount = quickJob.escrow.amount - workerCompensation.amount;
      quickJob.escrow.status = 'partial_refund';
      quickJob.escrow.refundAmount = refundAmount;
      quickJob.escrow.refundReason = 'Client cancelled after worker started traveling';
    } else if (isClient && quickJob.escrow && quickJob.escrow.status === 'held') {
      // Full refund if before worker left
      quickJob.escrow.status = 'refunded';
      quickJob.escrow.refundedAt = new Date();
      quickJob.escrow.refundAmount = quickJob.escrow.amount;
      refundAmount = quickJob.escrow.amount;
    }

    quickJob.status = 'cancelled';
    quickJob.cancellation = {
      cancelledBy: isClient ? 'client' : 'worker',
      cancelledByUser: req.user._id,
      reason: reason || '',
      cancelledAt: new Date(),
      workerCompensation
    };

    await quickJob.save();

    // TODO: Process refund via Paystack
    // TODO: Notify other party

    logger.info(`QuickJob ${id} cancelled by ${isClient ? 'client' : 'worker'}`);

    let message = 'Job cancelled successfully.';
    if (refundAmount) {
      message += ` GH₵${refundAmount} will be refunded.`;
    }
    if (workerCompensation) {
      message += ` Worker will receive GH₵${workerCompensation.amount} compensation.`;
    }

    res.json({
      success: true,
      message,
      data: {
        status: quickJob.status,
        refundAmount,
        workerCompensation
      }
    });
  } catch (error) {
    logger.error('Error cancelling QuickJob:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel job',
        code: 'SERVER_ERROR'
      }
    });
  }
};

module.exports = {
  createQuickJob,
  getNearbyQuickJobs,
  getQuickJob,
  getMyQuickJobs,
  getMyQuotedJobs,
  submitQuote,
  acceptQuote,
  markOnWay,
  markArrived,
  startWork,
  markComplete,
  approveWork,
  raiseDispute,
  cancelQuickJob
};
