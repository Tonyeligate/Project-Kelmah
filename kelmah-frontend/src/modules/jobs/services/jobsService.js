import { api } from '../../../services/apiClient';

// Use centralized jobServiceClient with auth/retry interceptors

// Data transformation helpers
const normalizeTextValue = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    if (typeof value.label === 'string') return value.label.trim();
    if (typeof value.name === 'string') return value.name.trim();
    if (typeof value.value === 'string') return value.value.trim();
  }
  return fallback;
};

const normalizeLocationValue = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location.trim();
  if (typeof location !== 'object') return '';

  const city = normalizeTextValue(location.city);
  const region = normalizeTextValue(location.region);
  const country = normalizeTextValue(location.country);
  const address = normalizeTextValue(location.address);
  const type = normalizeTextValue(location.type);

  const parts = [city, region, country].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  if (address) return address;
  if (type) {
    if (type.toLowerCase() === 'remote') return 'Remote';
    return type;
  }
  return '';
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((skill) => normalizeTextValue(skill))
    .filter(Boolean);
};

const transformJobListItem = (job) => {
  if (!job) return null;

  // Handle employer/hirer data with multiple fallbacks
  const getEmployerInfo = () => {
    // Priority 1: Full hirer object with populated data
    if (job.hirer && typeof job.hirer === 'object' && job.hirer.name) {
      return {
        name: job.hirer.name,
        logo: job.hirer.logo || job.hirer.avatar || null,
        verified: job.hirer.verified || job.hirer.isVerified || false,
        rating: job.hirer.rating || null,
        id: job.hirer._id || job.hirer.id || null,
        _source: 'hirer_object',
      };
    }

    // Priority 2: Hirer name as string (ObjectId reference)
    if (job.hirer_name && job.hirer_name !== 'Unknown') {
      return {
        name: job.hirer_name,
        logo: null,
        verified: false,
        rating: null,
        id: job.hirer || null,
        _source: 'hirer_name_string',
      };
    }

    // Priority 3: Company name field
    if (job.company || job.companyName) {
      return {
        name: job.company || job.companyName,
        logo: job.companyLogo || null,
        verified: false,
        rating: null,
        id: null,
        _source: 'company_field',
      };
    }

    // Fallback: Flag for admin review
    console.warn(
      `⚠️ Job ${job._id || job.id} missing employer data - flagged for admin review`,
    );
    return {
      name: 'Employer Name Pending',
      logo: null,
      verified: false,
      rating: null,
      id: null,
      _isFallback: true, // Flag for backend data improvement
      _needsAdminReview: true, // Flag for admin attention
      _jobId: job._id || job.id,
      _source: 'fallback',
    };
  };

  const employer = getEmployerInfo();

  return {
    id: job._id || job.id, // Handle MongoDB _id or regular id
    title: normalizeTextValue(job.title, 'Untitled Job'),
    description: (() => {
      const text = normalizeTextValue(job.description);
      if (!text) return '';
      return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    })(),
    fullDescription: normalizeTextValue(job.description), // Keep full description for detail view
    category: normalizeTextValue(job.category),
    subcategory: normalizeTextValue(job.subcategory),
    type: normalizeTextValue(job.type),
    budget: job.budget,
    currency: job.currency || 'GHS',
    status: job.status,
    location: normalizeLocationValue(job.location || job.locationDetails),
    skills: normalizeSkills(job.skills),
    // Map API date fields to frontend expected fields
    postedDate: job.createdAt ? new Date(job.createdAt) : new Date(),
    deadline: job.endDate
      ? new Date(job.endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startDate: job.startDate ? new Date(job.startDate) : new Date(),
    // Employer information
    employer,
    hirer: employer, // Backward compatibility
    hirerName: employer.name,
    hirerLogo: employer.logo,
    hirerVerified: employer.verified,
    // Additional fields for display
    proposalCount: job.proposalCount || 0,
    viewCount: job.viewCount || 0,
    rating: job.rating || 4.5,
    urgent: job.urgent || job.proposalCount > 15, // Auto-mark as urgent if many applicants
    verified: job.verified || employer.verified,
    paymentType: job.paymentType || 'fixed',
    duration: job.duration,
    coverImage: job.coverImage || '',
  };
};

// Jobs API service - using real backend data only
const jobsApi = {
  /**
   * Get all jobs with filtering and pagination
   */
  async getJobs(params = {}) {
    try {
      const response = await api.get('/jobs', { params });

      // Handle different response formats from the backend
      let jobs = [];
      let totalPages = 1;
      let totalJobs = 0;
      let currentPage = 1;

      if (response.data) {
        // Check if response has pagination structure
        if (response.data.data && Array.isArray(response.data.data)) {
          // Format: { data: [...jobs], pagination: {...} }
          jobs = response.data.data;
          totalPages = response.data.pagination?.totalPages || 1;
          totalJobs = response.data.pagination?.totalItems || jobs.length;
          currentPage = response.data.pagination?.currentPage || 1;
        } else if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          // Format: { data: { items: [...jobs], pagination: {...} }, meta: {...} }
          // This is the paginatedResponse format from the job service
          const paginated = response.data.data;
          jobs = paginated.items;
          totalPages = paginated.pagination?.totalPages || response.data.meta?.pagination?.totalPages || 1;
          totalJobs = paginated.pagination?.total || response.data.meta?.pagination?.total || jobs.length;
          currentPage = paginated.pagination?.page || response.data.meta?.pagination?.page || 1;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // Format: { items: [...jobs], page: 1, total: 12 }
          jobs = response.data.items;
          totalPages =
            Math.ceil(response.data.total / response.data.limit) || 1;
          totalJobs = response.data.total || jobs.length;
          currentPage = response.data.page || 1;
        } else if (Array.isArray(response.data)) {
          jobs = response.data;
        } else if (response.data.jobs && Array.isArray(response.data.jobs)) {
          jobs = response.data.jobs;
          totalPages = response.data.totalPages || 1;
          totalJobs = response.data.totalJobs || jobs.length;
          currentPage = response.data.currentPage || 1;
        }
      }

      // Track and report jobs with missing employer data
      const jobsNeedingReview = [];
      const transformedJobs = jobs.map((job) => {
        const transformed = transformJobListItem(job);
        if (transformed.employer._needsAdminReview) {
          jobsNeedingReview.push({
            jobId: transformed.id,
            title: transformed.title,
            category: transformed.category,
            postedDate: transformed.postedDate,
          });
        }
        return transformed;
      });

      // Log jobs needing admin review
      if (jobsNeedingReview.length > 0) {
        console.warn(
          `⚠️ ${jobsNeedingReview.length} jobs missing employer data:`,
          jobsNeedingReview,
        );
        // TODO: Send notification to admin dashboard
        // adminNotificationService.flagJobsForReview(jobsNeedingReview);
      }

      return {
        data: transformedJobs,
        jobs: transformedJobs,
        totalPages,
        totalJobs,
        currentPage,
        jobsNeedingReview: jobsNeedingReview.length, // Include count in response
      };
    } catch (error) {
      console.warn('❌ Job service API error:', error.message, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Normalize raw form data to match the canonical Job model shape.
   * Maps flat UI fields to the nested objects the backend expects:
   *   budget  → Number
   *   duration → { value: Number, unit: String }
   *   location → { type: String, country?: String, city?: String }
   */
  normalizeJobPayload(raw) {
    const payload = { ...raw };

    // budget: ensure it's a number
    if (payload.budget != null) {
      payload.budget = Number(payload.budget);
    }

    // currency: default to GHS
    if (!payload.currency) {
      payload.currency = 'GHS';
    }

    // duration: convert flat string/number into { value, unit } object
    if (payload.duration && typeof payload.duration !== 'object') {
      // Try to parse strings like "2 weeks" or plain numbers
      const match = String(payload.duration).match(/(\d+)\s*(hour|day|week|month)?s?/i);
      if (match) {
        payload.duration = { value: Number(match[1]), unit: (match[2] || 'week').toLowerCase() };
      } else {
        payload.duration = { value: Number(payload.duration) || 1, unit: 'week' };
      }
    }
    // Ensure value is a number if already an object
    if (payload.duration && typeof payload.duration === 'object' && payload.duration.value != null) {
      payload.duration.value = Number(payload.duration.value);
    }

    // location: convert flat string into { type, city/address } object
    if (payload.location && typeof payload.location === 'string') {
      const locationType = payload.locationType || payload.jobType || 'onsite';
      payload.location = {
        type: ['remote', 'onsite', 'hybrid'].includes(locationType) ? locationType : 'onsite',
        city: payload.location,
      };
    }
    // If locationType was a separate field, fold it in and clean up
    if (payload.locationType && payload.location && typeof payload.location === 'object') {
      payload.location.type = payload.locationType;
    }
    delete payload.locationType;

    // visibility: default to public
    if (!payload.visibility) {
      payload.visibility = 'public';
    }

    return payload;
  },

  /**
   * Create a job (hirer)
   */
  async createJob(jobData) {
    const normalized = this.normalizeJobPayload(jobData);
    const response = await api.post('/jobs', normalized);
    return response.data?.data || response.data;
  },

  /**
   * Saved jobs
   */
  async getSavedJobs(params = {}) {
    const response = await api.get('/jobs/saved', { params });
    const payload = response.data?.data || response.data;
    const jobs = Array.isArray(payload?.jobs)
      ? payload.jobs
      : Array.isArray(payload)
        ? payload
        : [];
    return { jobs: jobs.map(transformJobListItem), totalPages: 1 };
  },
  async saveJob(jobId) {
    const response = await api.post(`/jobs/${jobId}/save`);
    return response.data;
  },
  async unsaveJob(jobId) {
    const response = await api.delete(`/jobs/${jobId}/save`);
    return response.data;
  },

  /**
   * Get contracts (mocked) from job-service
   */
  async getContracts() {
    try {
      const response = await api.get('/jobs/contracts');
      // Prefer nested data shape, fallback to flat
      return response.data?.data?.contracts || response.data?.contracts || [];
    } catch (error) {
      console.warn('Job service unavailable for contracts:', error.message);
      return [];
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId) {
    // Validate jobId before making API call
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error('❌ Invalid job ID provided to getJobById:', jobId);
      throw new Error('Invalid job ID');
    }

    try {
      const response = await api.get(`/jobs/${jobId}`);

      // Handle the response format: {success: true, items: [...], page: 1, total: 12}
      if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        // Find the specific job by ID
        const job = response.data.items.find(
          (item) => item.id === jobId || item._id === jobId,
        );
        if (job) {
          // Return non-destructively normalized job
          const normalized = {
            ...job,
            // Provide compatibility fields used by UI
            created_at: job.created_at || job.createdAt || job.postedDate,
            hirer_name: job.hirer_name || job.hirer?.name,
            postedDate:
              job.postedDate ||
              (job.createdAt ? new Date(job.createdAt) : undefined),
            deadline:
              job.deadline || (job.endDate ? new Date(job.endDate) : undefined),
            skills: Array.isArray(job.skills)
              ? job.skills
              : typeof job.skills_required === 'string'
                ? job.skills_required
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                : [],
          };
          return normalized;
        }
      }

      // Fallback to old format (return merged normalized fields without removing originals)
      const raw = response.data.data || response.data;
      const normalized =
        raw && typeof raw === 'object'
          ? {
            ...raw,
            created_at: raw.created_at || raw.createdAt || raw.postedDate,
            hirer_name: raw.hirer_name || raw.hirer?.name,
            postedDate:
              raw.postedDate ||
              (raw.createdAt ? new Date(raw.createdAt) : undefined),
            deadline:
              raw.deadline ||
              (raw.endDate ? new Date(raw.endDate) : undefined),
            skills: Array.isArray(raw.skills)
              ? raw.skills
              : typeof raw.skills_required === 'string'
                ? raw.skills_required
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                : [],
          }
          : raw;
      return normalized;
    } catch (error) {
      console.warn(`Job service unavailable for job ${jobId}:`, error.message);
      throw error;
    }
  },

  /**
   * Search jobs by criteria
   */
  async searchJobs(searchParams) {
    try {
      // Backend supports filtering and text search via /api/jobs with ?search=
      const response = await api.get('/jobs', {
        params: searchParams,
      });
      const jobs = response.data.data || response.data.jobs || [];
      return {
        jobs: jobs.map(transformJobListItem),
        totalPages: response.data.totalPages || 1,
        totalJobs: response.data.totalJobs || jobs.length,
        currentPage: response.data.currentPage || 1,
      };
    } catch (error) {
      console.warn('Job service unavailable for job search:', error.message);
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Apply to a job
   */
  async applyToJob(jobId, applicationData) {
    try {
      const response = await api.post(
        `/jobs/${jobId}/apply`,
        applicationData,
      );
      return response.data;
    } catch (error) {
      console.warn(
        `Job service unavailable for job application ${jobId}:`,
        error.message,
      );
      throw error;
    }
  },

  /**
   * Get job categories
   */
  async getJobCategories() {
    try {
      const response = await api.get('/jobs/categories');
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Job service unavailable for job categories:',
        error.message,
      );
      return [];
    }
  },

  /**
   * Personalized job recommendations for workers
   */
  async getPersonalizedJobRecommendations(params = {}) {
    try {
      const response = await api.get('/jobs/recommendations/personalized', {
        params,
      });
      const payload = response.data?.data || response.data;
      if (Array.isArray(payload?.recommendations)) {
        return payload.recommendations.map(transformJobListItem);
      }
      if (Array.isArray(payload)) {
        return payload.map(transformJobListItem);
      }
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items.map(transformJobListItem);
    } catch (error) {
      console.warn(
        'Job service unavailable for personalized recommendations:',
        error.message,
      );
      return [];
    }
  },
  /**
   * Get platform statistics (available jobs, active employers, skilled workers, success rate)
   * @returns {Promise<Object>} Platform statistics
   */
  async getPlatformStats() {
    try {
      const response = await api.get('/jobs/stats');
      return response.data?.data || response.data || {};
    } catch (error) {
      console.warn('Job service unavailable for platform stats:', error.message);
      return null;
    }
  },
};

export default jobsApi;
