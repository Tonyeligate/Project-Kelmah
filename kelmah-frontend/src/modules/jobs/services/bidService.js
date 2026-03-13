/**
 * Bid Service — Frontend API client for the bidding system
 *
 * DATA FLOW:
 *   Frontend component → bidApi method → GET/POST/PATCH /api/bids/* → Gateway → Job Service
 *
 * Per spec:
 *   - Max 5 bidders per job
 *   - Max 5 bids per worker per month
 *   - Bid amounts must be within job's min/max range
 *   - One bid per job per worker (modification allowed before deadline)
 */

import { api } from '../../../services/apiClient';

const DURATION_UNIT_MAP = {
  hour: 'hour',
  hours: 'hour',
  hr: 'hour',
  hrs: 'hour',
  day: 'day',
  days: 'day',
  week: 'week',
  weeks: 'week',
  wk: 'week',
  wks: 'week',
  month: 'month',
  months: 'month',
  mo: 'month',
  mos: 'month',
};

const DEFAULT_DURATION = { value: 1, unit: 'week' };

const buildDisplayName = (person = {}) => {
  if (typeof person?.name === 'string' && person.name.trim()) {
    return person.name.trim();
  }

  const fullName = [person?.firstName, person?.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();

  return fullName;
};

const normalizeBidRecord = (bid = {}) => {
  const worker = bid?.worker && typeof bid.worker === 'object'
    ? bid.worker
    : null;
  const normalizedScore = Number(bid.score ?? bid.performanceScore);

  return {
    ...bid,
    score: Number.isFinite(normalizedScore) ? normalizedScore : null,
    worker: worker
      ? {
          ...worker,
          name: buildDisplayName(worker) || 'Worker',
          avatar: worker.avatar || worker.profileImage || worker.profilePicture || null,
        }
      : bid.worker,
  };
};

const normalizeBidCollection = (payload) => {
  let items = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (Array.isArray(payload?.items)) {
    items = payload.items;
  } else if (Array.isArray(payload?.bids)) {
    items = payload.bids;
  }

  return items.map(normalizeBidRecord);
};

const normalizeBidStats = (payload = {}) => {
  const count = Number(payload.count ?? payload.monthlyBidCount ?? 0) || 0;
  const quota = Number(payload.quota ?? payload.monthlyBidLimit ?? 5) || 5;
  const remaining = Number(
    payload.remaining ?? payload.remainingBids ?? Math.max(quota - count, 0),
  ) || 0;
  const tier = payload.tier ?? payload.performanceTier ?? 'tier3';
  const successRate = Number(payload.successRate ?? payload.bidSuccessRate ?? 0) || 0;

  return {
    ...payload,
    count,
    quota,
    remaining,
    tier,
    successRate,
    monthlyBidCount: payload.monthlyBidCount ?? count,
    monthlyBidLimit: payload.monthlyBidLimit ?? quota,
    remainingBids: payload.remainingBids ?? remaining,
    performanceTier: payload.performanceTier ?? tier,
    bidSuccessRate: payload.bidSuccessRate ?? successRate,
  }; 
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeDurationUnit = (unit) => {
  if (!unit || typeof unit !== 'string') return null;
  return DURATION_UNIT_MAP[unit.trim().toLowerCase()] || null;
};

const normalizeEstimatedDuration = (value) => {
  if (value && typeof value === 'object') {
    const durationValue = toPositiveNumber(value.value ?? value.amount ?? value.duration);
    const durationUnit = normalizeDurationUnit(value.unit);
    if (durationValue && durationUnit) {
      return { value: durationValue, unit: durationUnit };
    }
  }

  if (typeof value === 'string') {
    const match = value.trim().match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (match) {
      const durationValue = toPositiveNumber(match[1]);
      const durationUnit = normalizeDurationUnit(match[2]);
      if (durationValue && durationUnit) {
        return { value: durationValue, unit: durationUnit };
      }
    }
  }

  return { ...DEFAULT_DURATION };
};

const normalizeAvailability = (availability = {}) => {
  const startDate = availability?.startDate
    ? new Date(availability.startDate)
    : new Date();

  const normalizedAvailability = {
    startDate: Number.isNaN(startDate.getTime()) ? new Date().toISOString() : startDate.toISOString(),
    flexible: availability?.flexible ?? true,
  };

  const hoursPerWeek = toPositiveNumber(availability?.hoursPerWeek);
  if (hoursPerWeek) {
    normalizedAvailability.hoursPerWeek = Math.min(hoursPerWeek, 168);
  }

  if (availability?.endDate) {
    const endDate = new Date(availability.endDate);
    if (!Number.isNaN(endDate.getTime())) {
      normalizedAvailability.endDate = endDate.toISOString();
    }
  }

  return normalizedAvailability;
};

const normalizeBidPayload = (data = {}) => {
  const jobId = data.jobId || data.job;
  const bidAmount = toPositiveNumber(data.bidAmount);

  if (!jobId) {
    throw new Error('Job reference is required to place a bid.');
  }

  if (!bidAmount) {
    throw new Error('A valid bid amount is required.');
  }

  return {
    jobId,
    bidAmount,
    estimatedDuration: normalizeEstimatedDuration(data.estimatedDuration),
    coverLetter: String(data.coverLetter || '').trim(),
    availability: normalizeAvailability(data.availability),
    portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
  };
};

const normalizeDecisionPayload = (data = {}, noteKey) => {
  const note = data?.[noteKey] ?? data?.reason ?? data?.notes;

  if (typeof note !== 'string' || !note.trim()) {
    return {};
  }

  return { [noteKey]: note.trim() };
};

const bidApi = {
  /**
   * Submit a new bid on a job (worker only)
   * @param {Object} data - { job, bidAmount, estimatedDuration, coverLetter, portfolio?, availability? }
   */
  async createBid(data) {
    const response = await api.post('/bids', normalizeBidPayload(data));
    return response.data?.data || response.data;
  },

  /**
   * Get all bids for a specific job (hirer/admin)
   * @param {string} jobId
   * @param {Object} params - { page, limit, sort }
   */
  async getJobBids(jobId, params = {}, requestConfig = {}) {
    const response = await api.get(`/bids/job/${jobId}`, {
      ...requestConfig,
      params,
    });
    return normalizeBidCollection(response.data?.data || response.data);
  },

  /**
   * Get all bids submitted by a worker (own/admin)
   * @param {string} workerId
   * @param {Object} params - { page, limit, status }
   */
  async getWorkerBids(workerId, params = {}, requestConfig = {}) {
    const path = workerId ? `/bids/worker/${workerId}` : '/bids/me';
    const response = await api.get(path, {
      ...requestConfig,
      params,
    });
    return normalizeBidCollection(response.data?.data || response.data);
  },

  async getMyBids(params = {}, requestConfig = {}) {
    return this.getWorkerBids(null, params, requestConfig);
  },

  /**
   * Get a single bid by ID
   * @param {string} bidId
   */
  async getBidById(bidId) {
    const response = await api.get(`/bids/${bidId}`);
    return response.data?.data || response.data;
  },

  /**
   * Accept a bid (hirer only — auto-rejects other bids for the job)
   * @param {string} bidId
   * @param {Object} data - { notes? }
   */
  async acceptBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/accept`, normalizeDecisionPayload(data, 'hirerNotes'));
    return response.data?.data || response.data;
  },

  /**
   * Reject a bid (hirer only)
   * @param {string} bidId
   * @param {Object} data - { reason? }
   */
  async rejectBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/reject`, normalizeDecisionPayload(data, 'hirerNotes'));
    return response.data?.data || response.data;
  },

  /**
   * Withdraw own bid (worker only)
   * @param {string} bidId
   * @param {Object} data - { reason? }
   */
  async withdrawBid(bidId, data = {}) {
    const response = await api.patch(`/bids/${bidId}/withdraw`, normalizeDecisionPayload(data, 'workerNotes'));
    return response.data?.data || response.data;
  },

  /**
   * Modify a pending bid (worker only — before deadline)
   * @param {string} bidId
   * @param {Object} data - { bidAmount?, estimatedDuration?, coverLetter? }
   */
  async modifyBid(bidId, data) {
    const response = await api.patch(`/bids/${bidId}/modify`, data);
    return response.data?.data || response.data;
  },

  /**
   * Get worker's monthly bid statistics
   * @param {string} workerId
   * @returns {Object} { count, quota, remaining, tier }
   */
  async getWorkerBidStats(workerId, requestConfig = {}) {
    const path = workerId ? `/bids/stats/worker/${workerId}` : '/bids/stats/me';
    const response = await api.get(path, requestConfig);
    return normalizeBidStats(response.data?.data || response.data);
  },

  async getMyBidStats(requestConfig = {}) {
    return this.getWorkerBidStats(null, requestConfig);
  },
};

export default bidApi;
