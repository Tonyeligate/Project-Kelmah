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

// Mock data for verification and assessment
const verificationData = {
  documents: [
    {
      id: 'doc-1',
      userId: 'user-123',
      type: 'identity',
      documentType: 'driver_license',
      documentNumber: 'DL1234567',
      issueDate: '2022-05-10',
      expiryDate: '2027-05-10',
      issuingAuthority: 'MA DMV',
      status: 'verified',
      verificationDate: '2025-01-15T10:30:00Z',
      uploadDate: '2025-01-10T14:20:00Z',
      documentUrl: 'https://example.com/documents/dl-user123.jpg',
      notes: 'Identity verified successfully',
      verifiedBy: 'admin-456'
    },
    {
      id: 'doc-2',
      userId: 'user-123',
      type: 'address',
      documentType: 'utility_bill',
      issueDate: '2025-02-05',
      status: 'verified',
      verificationDate: '2025-02-10T09:15:00Z',
      uploadDate: '2025-02-08T16:45:00Z',
      documentUrl: 'https://example.com/documents/utility-user123.pdf',
      notes: 'Address verified successfully',
      verifiedBy: 'admin-456'
    },
    {
      id: 'doc-3',
      userId: 'user-123',
      type: 'qualification',
      documentType: 'professional_license',
      documentNumber: 'PL9876543',
      issueDate: '2023-09-20',
      expiryDate: '2026-09-20',
      issuingAuthority: 'Massachusetts Board of Electricians',
      status: 'verified',
      verificationDate: '2025-01-20T11:45:00Z',
      uploadDate: '2025-01-18T13:10:00Z',
      documentUrl: 'https://example.com/documents/license-user123.pdf',
      notes: 'Professional license verified successfully',
      verifiedBy: 'admin-789'
    },
    {
      id: 'doc-4',
      userId: 'user-123',
      type: 'insurance',
      documentType: 'liability_insurance',
      policyNumber: 'LI7654321',
      issueDate: '2025-01-01',
      expiryDate: '2026-01-01',
      issuingAuthority: 'WorkerShield Insurance Co.',
      coverage: '$1,000,000',
      status: 'verified',
      verificationDate: '2025-01-25T14:20:00Z',
      uploadDate: '2025-01-23T10:30:00Z',
      documentUrl: 'https://example.com/documents/insurance-user123.pdf',
      notes: 'Insurance coverage verified',
      verifiedBy: 'admin-789'
    }
  ],
  assessments: [
    {
      id: 'assess-1',
      userId: 'user-123',
      skillId: 'skill-1',
      skillName: 'JavaScript',
      score: 92,
      maxScore: 100,
      level: 'expert',
      status: 'completed',
      completedDate: '2025-02-10T16:30:00Z',
      validUntil: '2027-02-10T16:30:00Z',
      certificateUrl: 'https://example.com/certificates/js-user123.pdf',
      badgeUrl: 'https://example.com/badges/js-expert.svg'
    },
    {
      id: 'assess-2',
      userId: 'user-123',
      skillId: 'skill-2',
      skillName: 'React',
      score: 88,
      maxScore: 100,
      level: 'advanced',
      status: 'completed',
      completedDate: '2025-02-15T14:45:00Z',
      validUntil: '2027-02-15T14:45:00Z',
      certificateUrl: 'https://example.com/certificates/react-user123.pdf',
      badgeUrl: 'https://example.com/badges/react-advanced.svg'
    },
    {
      id: 'assess-3',
      userId: 'user-123',
      skillId: 'skill-5',
      skillName: 'MongoDB',
      status: 'in_progress',
      startedDate: '2025-03-18T10:00:00Z',
      expiryDate: '2025-03-25T10:00:00Z',
      progressPercentage: 60
    },
    {
      id: 'assess-4',
      userId: 'user-123',
      skillId: 'skill-4',
      skillName: 'TypeScript',
      status: 'scheduled',
      scheduledDate: '2025-03-30T13:00:00Z'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      userId: 'user-123',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      credentialId: 'AWS-123456',
      issueDate: '2024-01-15T00:00:00Z',
      expiryDate: '2027-01-15T00:00:00Z',
      status: 'active',
      verificationUrl: 'https://aws.amazon.com/verification',
      certificateUrl: 'https://example.com/certificates/aws-user123.pdf',
      skills: ['AWS', 'Cloud Architecture', 'Infrastructure'],
      badgeUrl: 'https://example.com/badges/aws-architect.svg'
    },
    {
      id: 'cert-2',
      userId: 'user-123',
      name: 'Professional Electrician License',
      issuer: 'Massachusetts Board of Electricians',
      credentialId: 'MA-ELEC-987654',
      issueDate: '2023-09-20T00:00:00Z',
      expiryDate: '2026-09-20T00:00:00Z',
      status: 'active',
      documentId: 'doc-3',
      skills: ['Electrical Wiring', 'Electrical Safety', 'Code Compliance'],
      badgeUrl: 'https://example.com/badges/electrician-ma.svg'
    }
  ],
  badges: [
    {
      id: 'badge-1',
      userId: 'user-123',
      name: 'Top Rated',
      description: 'Consistently receives 5-star ratings',
      issueDate: '2025-02-01T00:00:00Z',
      iconUrl: 'https://example.com/badges/top-rated.svg',
      criteria: 'Maintain 4.8+ rating over 6 months with at least 20 reviews'
    },
    {
      id: 'badge-2',
      userId: 'user-123',
      name: 'Quick Responder',
      description: 'Typically responds to inquiries within 1 hour',
      issueDate: '2025-01-15T00:00:00Z',
      iconUrl: 'https://example.com/badges/quick-responder.svg',
      criteria: 'Respond to 90% of messages within 60 minutes during business hours'
    },
    {
      id: 'badge-3',
      userId: 'user-123',
      name: 'Background Verified',
      description: 'Has passed background verification checks',
      issueDate: '2025-01-10T00:00:00Z',
      iconUrl: 'https://example.com/badges/verified.svg',
      criteria: 'Complete identity and background verification process'
    }
  ],
  verificationStatus: {
    id: 'vstatus-123',
    userId: 'user-123',
    identityVerified: true,
    addressVerified: true,
    backgroundCheckStatus: 'passed',
    backgroundCheckDate: '2025-01-05T00:00:00Z',
    professionalLicenseVerified: true,
    insuranceVerified: true,
    taxInformationVerified: true,
    overallVerificationStatus: 'verified',
    verificationLevel: 'premium',
    verificationBadgeIssued: true,
    lastUpdated: '2025-02-15T00:00:00Z'
  }
};

// Get all verification documents
router.get('/documents', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    count: verificationData.documents.length,
    data: verificationData.documents
  });
});

// Get document by ID
router.get('/documents/:documentId', authMiddleware.authenticate, (req, res) => {
  const { documentId } = req.params;
  
  const document = verificationData.documents.find(doc => doc.id === documentId);
  
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: document
  });
});

// Upload a new verification document
router.post('/documents', authMiddleware.authenticate, (req, res) => {
  const { type, documentType, documentNumber, issueDate, expiryDate, issuingAuthority } = req.body;
  
  // Validate required fields
  if (!type || !documentType) {
    return res.status(400).json({
      success: false,
      message: 'Document type is required'
    });
  }
  
  // Create new document
  const newDocument = {
    id: `doc-${Date.now()}`,
    userId: req.user.id,
    type,
    documentType,
    documentNumber: documentNumber || null,
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    issuingAuthority: issuingAuthority || null,
    status: 'pending',
    uploadDate: new Date().toISOString(),
    documentUrl: 'https://example.com/documents/placeholder.pdf', // In a real app, this would be the uploaded file URL
    notes: ''
  };
  
  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: newDocument
  });
});

// Update document details
router.put('/documents/:documentId', authMiddleware.authenticate, (req, res) => {
  const { documentId } = req.params;
  const updateData = req.body;
  
  const document = verificationData.documents.find(doc => doc.id === documentId);
  
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }
  
  // Ensure only allowed fields are updated
  const allowedFields = ['documentNumber', 'issueDate', 'expiryDate', 'issuingAuthority', 'notes'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: {
      ...document,
      ...updates,
      id: documentId // Ensure ID doesn't change
    }
  });
});

// Delete a document
router.delete('/documents/:documentId', authMiddleware.authenticate, (req, res) => {
  const { documentId } = req.params;
  
  const document = verificationData.documents.find(doc => doc.id === documentId);
  
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }
  
  // In a real app, check if document is in use by any verification process
  
  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
    data: {
      id: documentId
    }
  });
});

// Get verification status
router.get('/status', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: verificationData.verificationStatus
  });
});

// Get all skills assessments
router.get('/assessments', authMiddleware.authenticate, (req, res) => {
  // Optional query parameter for filtering by status
  const { status } = req.query;
  
  let assessments = verificationData.assessments;
  
  // Filter by status if provided
  if (status) {
    assessments = assessments.filter(assessment => assessment.status === status);
  }
  
  res.status(200).json({
    success: true,
    count: assessments.length,
    data: assessments
  });
});

// Get assessment by ID
router.get('/assessments/:assessmentId', authMiddleware.authenticate, (req, res) => {
  const { assessmentId } = req.params;
  
  const assessment = verificationData.assessments.find(assess => assess.id === assessmentId);
  
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: assessment
  });
});

// Start a new assessment
router.post('/assessments', authMiddleware.authenticate, (req, res) => {
  const { skillId, skillName } = req.body;
  
  // Validate required fields
  if (!skillId || !skillName) {
    return res.status(400).json({
      success: false,
      message: 'Skill information is required'
    });
  }
  
  // Create new assessment
  const newAssessment = {
    id: `assess-${Date.now()}`,
    userId: req.user.id,
    skillId,
    skillName,
    status: 'scheduled',
    scheduledDate: new Date(Date.now() + 86400000).toISOString() // Schedule for tomorrow
  };
  
  res.status(201).json({
    success: true,
    message: 'Assessment scheduled successfully',
    data: newAssessment
  });
});

// Start an assessment
router.put('/assessments/:assessmentId/start', authMiddleware.authenticate, (req, res) => {
  const { assessmentId } = req.params;
  
  const assessment = verificationData.assessments.find(assess => assess.id === assessmentId);
  
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }
  
  if (assessment.status !== 'scheduled') {
    return res.status(400).json({
      success: false,
      message: 'Only scheduled assessments can be started'
    });
  }
  
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry to 1 hour from now
  
  const updatedAssessment = {
    ...assessment,
    status: 'in_progress',
    startedDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    progressPercentage: 0
  };
  
  res.status(200).json({
    success: true,
    message: 'Assessment started successfully',
    data: updatedAssessment
  });
});

// Update assessment progress
router.put('/assessments/:assessmentId/progress', authMiddleware.authenticate, (req, res) => {
  const { assessmentId } = req.params;
  const { progressPercentage } = req.body;
  
  const assessment = verificationData.assessments.find(assess => assess.id === assessmentId);
  
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }
  
  if (assessment.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'Only in-progress assessments can be updated'
    });
  }
  
  if (progressPercentage === undefined || progressPercentage < 0 || progressPercentage > 100) {
    return res.status(400).json({
      success: false,
      message: 'Valid progress percentage is required (0-100)'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Assessment progress updated successfully',
    data: {
      id: assessmentId,
      progressPercentage,
      updatedAt: new Date().toISOString()
    }
  });
});

// Complete an assessment
router.put('/assessments/:assessmentId/complete', authMiddleware.authenticate, (req, res) => {
  const { assessmentId } = req.params;
  const { score, level } = req.body;
  
  const assessment = verificationData.assessments.find(assess => assess.id === assessmentId);
  
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }
  
  if (assessment.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'Only in-progress assessments can be completed'
    });
  }
  
  if (score === undefined || score < 0 || score > 100) {
    return res.status(400).json({
      success: false,
      message: 'Valid score is required (0-100)'
    });
  }
  
  if (!level) {
    return res.status(400).json({
      success: false,
      message: 'Skill level is required'
    });
  }
  
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 2); // Valid for 2 years
  
  const updatedAssessment = {
    ...assessment,
    status: 'completed',
    score,
    maxScore: 100,
    level,
    completedDate: now.toISOString(),
    validUntil: validUntil.toISOString(),
    certificateUrl: `https://example.com/certificates/${assessment.skillName.toLowerCase()}-${req.user.id}.pdf`,
    badgeUrl: `https://example.com/badges/${assessment.skillName.toLowerCase()}-${level}.svg`
  };
  
  res.status(200).json({
    success: true,
    message: 'Assessment completed successfully',
    data: updatedAssessment
  });
});

// Get all certifications
router.get('/certifications', authMiddleware.authenticate, (req, res) => {
  // Optional query parameter for filtering by status
  const { status } = req.query;
  
  let certifications = verificationData.certifications;
  
  // Filter by status if provided
  if (status) {
    certifications = certifications.filter(cert => cert.status === status);
  }
  
  res.status(200).json({
    success: true,
    count: certifications.length,
    data: certifications
  });
});

// Get certification by ID
router.get('/certifications/:certificationId', authMiddleware.authenticate, (req, res) => {
  const { certificationId } = req.params;
  
  const certification = verificationData.certifications.find(cert => cert.id === certificationId);
  
  if (!certification) {
    return res.status(404).json({
      success: false,
      message: 'Certification not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: certification
  });
});

// Add a new certification
router.post('/certifications', authMiddleware.authenticate, (req, res) => {
  const { name, issuer, credentialId, issueDate, expiryDate, verificationUrl, skills } = req.body;
  
  // Validate required fields
  if (!name || !issuer) {
    return res.status(400).json({
      success: false,
      message: 'Name and issuer are required'
    });
  }
  
  // Create new certification
  const newCertification = {
    id: `cert-${Date.now()}`,
    userId: req.user.id,
    name,
    issuer,
    credentialId: credentialId || null,
    issueDate: issueDate || new Date().toISOString(),
    expiryDate: expiryDate || null,
    status: 'pending_verification',
    verificationUrl: verificationUrl || null,
    skills: skills || [],
    certificateUrl: null
  };
  
  res.status(201).json({
    success: true,
    message: 'Certification added successfully',
    data: newCertification
  });
});

// Update certification
router.put('/certifications/:certificationId', authMiddleware.authenticate, (req, res) => {
  const { certificationId } = req.params;
  const updateData = req.body;
  
  const certification = verificationData.certifications.find(cert => cert.id === certificationId);
  
  if (!certification) {
    return res.status(404).json({
      success: false,
      message: 'Certification not found'
    });
  }
  
  // Ensure only allowed fields are updated
  const allowedFields = ['name', 'issuer', 'credentialId', 'issueDate', 'expiryDate', 'verificationUrl', 'skills'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'Certification updated successfully',
    data: {
      ...certification,
      ...updates,
      id: certificationId // Ensure ID doesn't change
    }
  });
});

// Delete certification
router.delete('/certifications/:certificationId', authMiddleware.authenticate, (req, res) => {
  const { certificationId } = req.params;
  
  const certification = verificationData.certifications.find(cert => cert.id === certificationId);
  
  if (!certification) {
    return res.status(404).json({
      success: false,
      message: 'Certification not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Certification deleted successfully',
    data: {
      id: certificationId
    }
  });
});

// Get all badges
router.get('/badges', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    count: verificationData.badges.length,
    data: verificationData.badges
  });
});

module.exports = router; 