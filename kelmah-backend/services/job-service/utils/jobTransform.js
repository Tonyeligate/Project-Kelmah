/**
 * Job Response Transformation Utility
 * Standardizes job data format for frontend consumption
 */

/**
 * Transform a job document to match frontend expectations
 * @param {Object} job - Raw job document from MongoDB
 * @returns {Object} - Transformed job object
 */
function transformJobForFrontend(job) {
  if (!job) return null;

  // Ensure _id is string
  const jobId = job._id ? job._id.toString() : job.id || null;

  // Build budget object (frontend expects { min, max, type, amount, currency })
  const budgetObj = typeof job.budget === 'object' && job.budget !== null
    ? job.budget
    : {
        min: job.bidding?.minBidAmount || job.budget || 0,
        max: job.bidding?.maxBidAmount || job.budget || 0,
        type: job.paymentType || 'fixed',
        amount: job.budget || 0,
        currency: job.currency || 'GHS'
      };

  // Build hirer/employer object
  let hirerObj = null;
  let hirerName = 'Unknown';
  
  if (job.hirer) {
    if (typeof job.hirer === 'object' && job.hirer.firstName) {
      // Hirer is populated
      hirerName = `${job.hirer.firstName || ''} ${job.hirer.lastName || ''}`.trim() || 
                  job.hirer.companyName || 
                  job.hirer.email || 
                  'Unknown';
      hirerObj = {
        _id: job.hirer._id ? job.hirer._id.toString() : String(job.hirer._id || job.hirer.id),
        id: job.hirer._id ? job.hirer._id.toString() : String(job.hirer._id || job.hirer.id),
        firstName: job.hirer.firstName || '',
        lastName: job.hirer.lastName || '',
        name: hirerName,
        email: job.hirer.email || null,
        profileImage: job.hirer.profileImage || job.hirer.avatar || null,
        avatar: job.hirer.profileImage || job.hirer.avatar || null,
        logo: job.hirer.profileImage || job.hirer.avatar || null,
        verified: job.hirer.verified || job.hirer.isVerified || false,
        isVerified: job.hirer.verified || job.hirer.isVerified || false,
        rating: job.hirer.rating || null,
        companyName: job.hirer.companyName || null
      };
    } else if (typeof job.hirer === 'string') {
      // Hirer is ObjectId string - use employerName if available
      hirerName = job.employerName || 'Unknown';
    }
  } else if (job.employerName) {
    hirerName = job.employerName;
  }

  // Build skills array
  const skillsArray = Array.isArray(job.skills) 
    ? job.skills 
    : Array.isArray(job.requiredSkills)
      ? job.requiredSkills
      : typeof job.skills_required === 'string'
        ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
        : [];

  // Build location string
  const locationStr = job.location || 
    (job.locationDetails 
      ? [job.locationDetails.district, job.locationDetails.region].filter(Boolean).join(', ')
      : 'Ghana');

  // Transform job object
  // IMPORTANT: Spread raw job FIRST so our normalized fields take precedence
  const transformed = {
    // Raw fields as base (overridden by explicit mappings below)
    ...job,

    // IDs
    _id: jobId,
    id: jobId,
    jobId: job.jobId || jobId,

    // Basic fields
    title: job.title || '',
    description: job.description || '',
    category: job.category || '',
    profession: job.category || '', // Alias for frontend

    // Budget/Salary
    budget: budgetObj,
    salary: job.salary || budgetObj, // Support both field names
    currency: job.currency || 'GHS',
    paymentType: job.paymentType || 'fixed',

    // Location
    location: locationStr,
    locationDetails: job.locationDetails || null,

    // Skills
    skills: skillsArray,
    requiredSkills: skillsArray,
    skills_required: skillsArray.join(', '), // String format for legacy

    // Dates
    createdAt: job.createdAt || job.created_at || new Date(),
    created_at: job.createdAt || job.created_at || new Date(),
    postedDate: job.createdAt || job.created_at || new Date(),
    updatedAt: job.updatedAt || job.updated_at || new Date(),
    startDate: job.startDate || null,
    endDate: job.endDate || null,
    deadline: job.endDate || job.bidding?.bidDeadline || job.expiresAt || null,

    // Status and metadata
    status: job.status || 'open',
    visibility: job.visibility || 'public',
    isFeatured: job.isFeatured || job.featured || job.performanceTier === 'tier1' || false,
    featured: job.isFeatured || job.featured || job.performanceTier === 'tier1' || false,
    urgent: job.urgent || job.urgency === 'urgent' || false,
    verified: job.verified || false,

    // Hirer/Employer
    hirer: hirerObj,
    hirer_name: hirerName,
    employerName: hirerName,
    employer: hirerObj ? {
      name: hirerName,
      logo: hirerObj.logo,
      verified: hirerObj.verified,
      rating: hirerObj.rating,
      id: hirerObj.id
    } : {
      name: hirerName,
      logo: null,
      verified: false,
      rating: null,
      id: null
    },

    // Counts
    proposalCount: job.proposalCount || job.applicantsCount || 0,
    applicantsCount: job.applicantsCount || job.proposalCount || 0,
    viewCount: job.viewCount || 0,

    // Additional fields
    duration: job.duration || { value: 1, unit: 'week' },
    experienceLevel: job.experienceLevel || job.requirements?.experienceLevel || 'intermediate',
    rating: job.rating || 4.5,
    relevanceScore: job.relevanceScore || null,

    // Bidding info
    bidding: job.bidding || null,
  };

  return transformed;
}

/**
 * Transform an array of jobs
 * @param {Array} jobs - Array of job documents
 * @returns {Array} - Array of transformed job objects
 */
function transformJobsForFrontend(jobs) {
  if (!Array.isArray(jobs)) return [];
  return jobs.map(transformJobForFrontend).filter(Boolean);
}

module.exports = {
  transformJobForFrontend,
  transformJobsForFrontend
};

