const express = require('express');
const router = express.Router();

// Temporary authentication middleware
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.params.userId || 'development-user-id' };
    next();
  }
};

// Mock data for worker jobs
const workerJobsData = {
  activeJobs: [
    {
      id: 'job-1',
      title: 'Kitchen Remodeling',
      clientName: 'Robert Johnson',
      clientId: 'client-101',
      location: 'Boston, MA',
      startDate: '2025-03-10T08:00:00Z',
      expectedEndDate: '2025-03-25T17:00:00Z',
      status: 'in-progress',
      hourlyRate: 45,
      hoursLogged: 32,
      totalBudget: 2000,
      description: 'Complete kitchen remodeling including cabinet installation and countertop replacement',
      milestones: [
        { id: 'ms-1', title: 'Cabinet removal', completed: true, completedDate: '2025-03-12T16:00:00Z' },
        { id: 'ms-2', title: 'New cabinet installation', completed: true, completedDate: '2025-03-18T17:30:00Z' },
        { id: 'ms-3', title: 'Countertop installation', completed: false }
      ],
      nextAppointment: '2025-03-22T09:00:00Z',
      messages: 3,
      attachments: 2
    },
    {
      id: 'job-2',
      title: 'Bathroom Plumbing Repair',
      clientName: 'Emily Davis',
      clientId: 'client-102',
      location: 'Cambridge, MA',
      startDate: '2025-03-15T10:00:00Z',
      expectedEndDate: '2025-03-20T15:00:00Z',
      status: 'in-progress',
      hourlyRate: 55,
      hoursLogged: 12,
      totalBudget: 800,
      description: 'Fix leaking pipes and install new shower fixtures',
      milestones: [
        { id: 'ms-4', title: 'Assess plumbing issues', completed: true, completedDate: '2025-03-15T13:00:00Z' },
        { id: 'ms-5', title: 'Replace damaged pipes', completed: true, completedDate: '2025-03-17T14:30:00Z' },
        { id: 'ms-6', title: 'Install new fixtures', completed: false }
      ],
      nextAppointment: '2025-03-19T10:00:00Z',
      messages: 5,
      attachments: 1
    }
  ],
  completedJobs: [
    {
      id: 'job-3',
      title: 'Electrical Wiring Update',
      clientName: 'Michael Smith',
      clientId: 'client-103',
      location: 'Somerville, MA',
      startDate: '2025-02-10T09:00:00Z',
      endDate: '2025-02-15T16:00:00Z',
      status: 'completed',
      hourlyRate: 50,
      hoursLogged: 28,
      totalEarned: 1400,
      description: 'Update electrical wiring throughout the house to meet current code standards',
      rating: 4.8,
      clientReview: 'Excellent work! Professional and efficient.',
      feedback: 'Client was very satisfied with the quality of work and timeliness.',
      paymentStatus: 'paid',
      paymentDate: '2025-02-18T14:00:00Z'
    },
    {
      id: 'job-4',
      title: 'Deck Construction',
      clientName: 'Jennifer Wilson',
      clientId: 'client-104',
      location: 'Medford, MA',
      startDate: '2025-01-20T08:00:00Z',
      endDate: '2025-02-05T17:00:00Z',
      status: 'completed',
      hourlyRate: 40,
      hoursLogged: 80,
      totalEarned: 3200,
      description: 'Build a new wooden deck with railings and stairs',
      rating: 5.0,
      clientReview: 'Amazing work! The deck looks beautiful and was completed ahead of schedule.',
      feedback: 'Client has already referred two new customers.',
      paymentStatus: 'paid',
      paymentDate: '2025-02-10T11:30:00Z'
    }
  ],
  availableJobs: [
    {
      id: 'job-5',
      title: 'Drywall Repair and Painting',
      clientName: 'David Brown',
      location: 'Brookline, MA',
      postedDate: '2025-03-18T09:30:00Z',
      estimatedDuration: '3-5 days',
      budget: '600-800',
      description: 'Repair damaged drywall in living room and paint the walls',
      requirementsList: ['Drywall repair experience', 'Painting', 'Own tools'],
      bidEndDate: '2025-03-25T23:59:59Z',
      bidCount: 3,
      averageBidAmount: 650
    },
    {
      id: 'job-6',
      title: 'Backyard Landscaping',
      clientName: 'Susan Miller',
      location: 'Newton, MA',
      postedDate: '2025-03-17T14:45:00Z',
      estimatedDuration: '1-2 weeks',
      budget: '2000-2500',
      description: 'Redesign backyard landscape including planting new shrubs and laying a stone path',
      requirementsList: ['Landscaping experience', 'Plant knowledge', 'Stone work'],
      bidEndDate: '2025-03-28T23:59:59Z',
      bidCount: 5,
      averageBidAmount: 2250
    }
  ],
  jobProposals: [
    {
      id: 'proposal-1',
      jobId: 'job-5',
      jobTitle: 'Drywall Repair and Painting',
      clientName: 'David Brown',
      submittedDate: '2025-03-19T10:15:00Z',
      proposedAmount: 700,
      proposedDuration: '4 days',
      status: 'pending',
      coverLetter: 'I have over 10 years of experience in drywall repair and painting. I can complete this job efficiently and with high quality results.',
      attachments: [
        { name: 'Previous_Drywall_Work.jpg', url: 'https://example.com/attachments/previous_work.jpg' }
      ]
    },
    {
      id: 'proposal-2',
      jobId: 'job-6',
      jobTitle: 'Backyard Landscaping',
      clientName: 'Susan Miller',
      submittedDate: '2025-03-18T16:30:00Z',
      proposedAmount: 2300,
      proposedDuration: '10 days',
      status: 'pending',
      coverLetter: 'I specialize in backyard redesigns and have completed many similar projects. I can create a beautiful and functional space for your home.',
      attachments: [
        { name: 'Landscape_Portfolio.pdf', url: 'https://example.com/attachments/landscape_portfolio.pdf' },
        { name: 'Garden_Design_Sample.jpg', url: 'https://example.com/attachments/garden_sample.jpg' }
      ]
    }
  ],
  earnings: {
    total: 14500,
    pending: 2450,
    thisMonth: 4600,
    lastMonth: 3800,
    monthly: [
      { month: 'Jan', amount: 2800 },
      { month: 'Feb', amount: 3800 },
      { month: 'Mar', amount: 4600 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Aug', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Oct', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dec', amount: 0 }
    ],
    recentTransactions: [
      { id: 'trans-1', date: '2025-03-15T14:00:00Z', amount: 1400, jobId: 'job-3', jobTitle: 'Electrical Wiring Update', status: 'completed' },
      { id: 'trans-2', date: '2025-02-10T11:30:00Z', amount: 3200, jobId: 'job-4', jobTitle: 'Deck Construction', status: 'completed' },
      { id: 'trans-3', date: '2025-03-18T16:45:00Z', amount: 450, jobId: 'job-2', jobTitle: 'Bathroom Plumbing Repair', status: 'pending' }
    ]
  }
};

// Get all active jobs
router.get('/active', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: workerJobsData.activeJobs
  });
});

// Get job details
router.get('/:jobId', authMiddleware.authenticate, (req, res) => {
  const { jobId } = req.params;
  
  // Find the job in active or completed jobs
  const job = [...workerJobsData.activeJobs, ...workerJobsData.completedJobs]
    .find(job => job.id === jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: job
  });
});

// Get completed jobs
router.get('/completed', authMiddleware.authenticate, (req, res) => {
  // Optional query parameters for filtering
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  
  // For mock data, just return all completed jobs
  // In a real implementation, we would filter and paginate
  
  res.status(200).json({
    success: true,
    data: workerJobsData.completedJobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: workerJobsData.completedJobs.length
    }
  });
});

// Update job progress (log hours, update milestone, etc.)
router.put('/:jobId/progress', authMiddleware.authenticate, (req, res) => {
  const { jobId } = req.params;
  const { hoursLogged, milestoneId, notes } = req.body;
  
  // Find the job
  const jobIndex = workerJobsData.activeJobs.findIndex(job => job.id === jobId);
  
  if (jobIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or not active'
    });
  }
  
  // In a real implementation, we would update the job progress
  // For now, just return a success response
  
  res.status(200).json({
    success: true,
    message: 'Job progress updated successfully',
    data: {
      jobId,
      hoursLogged: hoursLogged || workerJobsData.activeJobs[jobIndex].hoursLogged,
      milestoneCompleted: milestoneId ? true : false,
      updatedAt: new Date().toISOString()
    }
  });
});

// Mark job as completed
router.put('/:jobId/complete', authMiddleware.authenticate, (req, res) => {
  const { jobId } = req.params;
  const { finalNotes, additionalHours } = req.body;
  
  // Find the job
  const jobIndex = workerJobsData.activeJobs.findIndex(job => job.id === jobId);
  
  if (jobIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or not active'
    });
  }
  
  // In a real implementation, we would mark the job as completed
  // For now, just return a success response
  
  res.status(200).json({
    success: true,
    message: 'Job marked as completed',
    data: {
      jobId,
      completedDate: new Date().toISOString(),
      finalNotes: finalNotes || '',
      totalHours: (workerJobsData.activeJobs[jobIndex].hoursLogged + (additionalHours || 0))
    }
  });
});

// Get available jobs matching worker's skills
router.get('/available', authMiddleware.authenticate, (req, res) => {
  // Optional query parameters for filtering
  const { skills, location, radius, page = 1, limit = 10 } = req.query;
  
  // For mock data, just return all available jobs
  // In a real implementation, we would filter based on worker's skills and location
  
  res.status(200).json({
    success: true,
    data: workerJobsData.availableJobs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: workerJobsData.availableJobs.length
    }
  });
});

// Submit a proposal/bid for a job
router.post('/proposals', authMiddleware.authenticate, (req, res) => {
  const { jobId, amount, duration, coverLetter, attachments } = req.body;
  
  // Find the job
  const job = workerJobsData.availableJobs.find(job => job.id === jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  // Create a new proposal
  const newProposal = {
    id: `proposal-${Date.now()}`,
    jobId,
    jobTitle: job.title,
    clientName: job.clientName,
    submittedDate: new Date().toISOString(),
    proposedAmount: amount,
    proposedDuration: duration,
    status: 'pending',
    coverLetter: coverLetter || '',
    attachments: attachments || []
  };
  
  res.status(201).json({
    success: true,
    message: 'Proposal submitted successfully',
    data: newProposal
  });
});

// Get worker's job proposals
router.get('/proposals', authMiddleware.authenticate, (req, res) => {
  // Optional query parameter for filtering by status
  const { status } = req.query;
  
  let proposals = workerJobsData.jobProposals;
  
  // Filter by status if provided
  if (status) {
    proposals = proposals.filter(proposal => proposal.status === status);
  }
  
  res.status(200).json({
    success: true,
    count: proposals.length,
    data: proposals
  });
});

// Withdraw a job proposal
router.delete('/proposals/:proposalId', authMiddleware.authenticate, (req, res) => {
  const { proposalId } = req.params;
  
  // Check if proposal exists
  const proposal = workerJobsData.jobProposals.find(p => p.id === proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }
  
  // Check if proposal can be withdrawn (only pending proposals)
  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending proposals can be withdrawn'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Proposal withdrawn successfully',
    data: {
      proposalId,
      jobId: proposal.jobId,
      jobTitle: proposal.jobTitle
    }
  });
});

// Get worker's earnings information
router.get('/earnings', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: workerJobsData.earnings
  });
});

// Get earnings for a specific period
router.get('/earnings/period', authMiddleware.authenticate, (req, res) => {
  const { startDate, endDate } = req.query;
  
  // In a real implementation, we would filter transactions by date range
  // For now, just return all transactions
  
  res.status(200).json({
    success: true,
    period: { startDate, endDate },
    data: {
      total: workerJobsData.earnings.total,
      transactions: workerJobsData.earnings.recentTransactions
    }
  });
});

module.exports = router; 