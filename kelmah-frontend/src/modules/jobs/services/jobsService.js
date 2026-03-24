import { api } from '../../../services/apiClient';
import {
  resolveMediaAssetUrl,
  resolveMediaAssetUrls,
  resolveJobVisualUrl,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';
import { devError, devWarn } from '@/modules/common/utils/devLogger';

const jobsWarn = devWarn;
const jobsError = devError;

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

const normalizeJobMedia = (job) => {
  if (!job || typeof job !== 'object') return [];

  const rawImages = Array.isArray(job.images) ? job.images : [];
  const rawAttachments = Array.isArray(job.attachments) ? job.attachments : [];

  return resolveMediaAssetUrls(rawImages, rawAttachments);
};

const normalizeCoverImageMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  return { ...metadata };
};

const transformJobListItem = (job) => {
  if (!job) return null;

  // Handle employer/hirer data with multiple fallbacks
  const getEmployerInfo = () => {
    // Priority 1: Full hirer object with populated data
    if (job.hirer && typeof job.hirer === 'object' && job.hirer.name) {
      return {
        name: job.hirer.name,
        logo:
          resolveMediaAssetUrl([
            job.hirer.logo,
            job.hirer.avatar,
            job.hirer.profilePicture,
            job.hirer.profileImage,
          ]) || null,
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
    jobsWarn(
      `Job ${job._id || job.id} missing employer data - flagged for admin review`,
    );
    // U-06 FIX: Neutral fallback - "Anonymous Employer" is honest, not misleading
    return {
      name: 'Anonymous Employer',
      logo: null,
      verified: false,
      rating: null,
      id: null,
      _isFallback: true,
      _needsAdminReview: true,
      _jobId: job._id || job.id,
      _source: 'fallback',
    };
  };

  const employer = getEmployerInfo();
  const imageGallery = normalizeJobMedia(job);
  const coverImageMetadata = normalizeCoverImageMetadata(job.coverImageMetadata);
  const rawCoverImage = resolveMediaAssetUrl([job.coverImage, coverImageMetadata]);
  const resolvedCoverImage = resolveJobVisualUrl({
    ...job,
    coverImage: rawCoverImage || job.coverImage,
    coverImageMetadata,
    images: Array.isArray(job?.images) ? job.images : imageGallery,
  });

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
    // U-05 FIX: Use actual bid deadline or null - never fabricate a deadline
    deadline: job.endDate
      ? new Date(job.endDate)
      : (job.bidding?.bidDeadline ? new Date(job.bidding.bidDeadline) : null),
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
    // U-03 FIX: Only show rating if it actually exists on the job - null hides the stars widget
    rating: job.rating || null,
    // LOW-15 FIX: Only use server-side urgent flag (don't auto-fabricate urgency)
    urgent: !!job.urgent,
    verified: job.verified || employer.verified,
    paymentType: job.paymentType || 'fixed',
    duration: job.duration,
    coverImage: rawCoverImage || '',
    coverImageMetadata,
    resolvedCoverImage: resolvedCoverImage || rawCoverImage || '',
    imageGallery,
  };
};

// Jobs API service - using real backend data only
const jobsApi = {
  /**
   * Get all jobs with filtering and pagination
   */
  async getJobs(params = {}, requestOptions = {}) {
    try {
      const response = await api.get('/jobs', {
        params,
        ...requestOptions,
      });

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
        jobsWarn(
          `${jobsNeedingReview.length} jobs missing employer data:`,
          jobsNeedingReview,
        );
        // Keep this review signal in the client response until moderation alerts are wired.
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
      jobsWarn('Job service API error:', error.message, {
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
    *   budget -> Number
    *   duration -> { value: Number, unit: String }
    *   location -> { type: String, country?: String, city?: String }
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
  async getSavedJobs(params = {}, requestOptions = {}) {
    const response = await api.get('/jobs/saved', {
      params,
      ...requestOptions,
    });
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
      jobsWarn('Job service unavailable for contracts:', error.message);
      return [];
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId, requestOptions = {}) {
    // Validate jobId before making API call
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      jobsError('Invalid job ID provided to getJobById:', jobId);
      throw new Error('Invalid job ID');
    }

    try {
      const response = await api.get(`/jobs/${jobId}`, requestOptions);

      // Backend GET /api/jobs/:id returns { success, data: { ...job } }
      const raw = response.data?.data || response.data;
      const normalizedImages = normalizeJobMedia(raw);
      const coverImageMetadata = normalizeCoverImageMetadata(raw?.coverImageMetadata);
      const rawCoverImage = resolveMediaAssetUrl([raw?.coverImage, coverImageMetadata]);
      const normalizedHirer =
        raw?.hirer && typeof raw.hirer === 'object'
          ? {
            ...raw.hirer,
            id: raw.hirer.id || raw.hirer._id || null,
            name:
              normalizeTextValue(raw.hirer.name) ||
              normalizeTextValue(raw.hirer.fullName) ||
              [normalizeTextValue(raw.hirer.firstName), normalizeTextValue(raw.hirer.lastName)]
                .filter(Boolean)
                .join(' ') ||
              normalizeTextValue(raw.hirer.email, 'Client'),
            avatar: resolveProfileImageUrl(raw.hirer) || null,
            companyName:
              normalizeTextValue(raw.hirer.companyName) ||
              normalizeTextValue(raw.hirer.company) ||
              null,
          }
          : raw?.hirer;
      const normalized =
        raw && typeof raw === 'object'
          ? {
            ...raw,
            hirer: normalizedHirer,
            coverImage: rawCoverImage || '',
            coverImageMetadata,
            resolvedCoverImage: resolveJobVisualUrl({
              ...raw,
              coverImage: rawCoverImage || raw?.coverImage,
              coverImageMetadata,
              images: normalizedImages,
            }) || rawCoverImage || '',
            created_at: raw.created_at || raw.createdAt || raw.postedDate,
            hirer_name: raw.hirer_name || normalizedHirer?.name,
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
            images: normalizedImages,
            imageGallery: normalizedImages,
            clientProfile: normalizedHirer
              ? {
                id: normalizedHirer.id,
                name: normalizedHirer.name,
                avatar: normalizedHirer.avatar,
                companyName: normalizedHirer.companyName,
                email: normalizeTextValue(normalizedHirer.email),
                verified: Boolean(normalizedHirer.verified || normalizedHirer.isVerified),
              }
              : null,
          }
          : raw;
      return normalized;
    } catch (error) {
      jobsWarn(`Job service unavailable for job ${jobId}:`, error.message);
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

      // Re-use the same multi-format response parsing as getJobs()
      let jobs = [];
      let totalPages = 1;
      let totalJobs = 0;
      let currentPage = 1;

      if (response.data) {
        if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          const paginated = response.data.data;
          jobs = paginated.items;
          totalPages = paginated.pagination?.totalPages || 1;
          totalJobs = paginated.pagination?.total || jobs.length;
          currentPage = paginated.pagination?.page || 1;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          jobs = response.data.data;
          totalPages = response.data.pagination?.totalPages || 1;
          totalJobs = response.data.pagination?.totalItems || jobs.length;
          currentPage = response.data.pagination?.currentPage || 1;
        } else if (Array.isArray(response.data.jobs)) {
          jobs = response.data.jobs;
          totalPages = response.data.totalPages || 1;
          totalJobs = response.data.totalJobs || jobs.length;
          currentPage = response.data.currentPage || 1;
        } else if (Array.isArray(response.data)) {
          jobs = response.data;
        }
      }

      return {
        jobs: jobs.map(transformJobListItem),
        totalPages,
        totalJobs,
        currentPage,
      };
    } catch (error) {
      jobsWarn('Job service unavailable for job search:', error.message);
      return {
        jobs: [],
        totalPages: 1,
        totalJobs: 0,
        currentPage: 1,
      };
    }
  },

  /**
   * Update an existing job (hirer)
   */
  async editJob(jobId, jobData) {
    const normalized = this.normalizeJobPayload(jobData);
    const response = await api.put(`/jobs/${jobId}`, normalized);
    return response.data?.data || response.data;
  },

  /**
   * Delete a job (hirer)
   */
  async removeJob(jobId) {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data?.data || response.data;
  },

  /**
   * Get featured jobs
   */
  async getFeaturedJobs(params = {}) {
    try {
      const response = await api.get('/jobs', {
        params: { ...params, featured: true },
      });
      const data = response.data?.data || response.data;
      const jobs = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.jobs)
            ? data.jobs
            : [];
      return jobs.map(transformJobListItem);
    } catch (error) {
      jobsWarn('Job service unavailable for featured jobs:', error.message);
      return [];
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
      jobsWarn(
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
      jobsWarn(
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
      if (Array.isArray(payload?.jobs)) {
        return payload.jobs.map(transformJobListItem);
      }
      if (Array.isArray(payload?.recommendations)) {
        return payload.recommendations.map(transformJobListItem);
      }
      if (Array.isArray(payload)) {
        return payload.map(transformJobListItem);
      }
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items.map(transformJobListItem);
    } catch (error) {
      jobsWarn(
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
      jobsWarn('Job service unavailable for platform stats:', error.message);
      return null;
    }
  },
};

export default jobsApi;

