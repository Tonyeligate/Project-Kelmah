export const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
};

export const DEFAULT_APPLICATION_COUNTS = {
  pending: 0,
  accepted: 0,
  rejected: 0,
  under_review: 0,
  withdrawn: 0,
  total: 0,
};

export const APPLICATIONS_PAGE_SIZE = 10;
export const APPLICATIONS_PAGE_SIZE_OPTIONS = [10, 20, 50];
export const APPLICATION_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'highest-rated', label: 'Highest rated applicant' },
  { value: 'proposed-rate', label: 'Highest proposed rate' },
];
export const APPLICATION_STATUS_TABS = ['pending', 'accepted', 'rejected'];

export const normalizeApplicationsTab = (value) =>
  APPLICATION_STATUS_TABS.includes(value) ? value : 'pending';

export const normalizeApplicationsSort = (value) => {
  const normalizedValue =
    typeof value === 'string' ? value.trim().toLowerCase() : '';
  return APPLICATION_SORT_OPTIONS.some(
    (option) => option.value === normalizedValue,
  )
    ? normalizedValue
    : 'newest';
};

export const normalizeApplicationsPageSize = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return APPLICATIONS_PAGE_SIZE_OPTIONS.includes(parsedValue)
    ? parsedValue
    : APPLICATIONS_PAGE_SIZE;
};

export const normalizeApplicationsPage = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

export const formatStatusLabel = (value, fallback = 'Pending') => {
  const source = String(value || '').trim();
  if (!source) {
    return fallback;
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
};

export const formatEstimatedDuration = (value) => {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value} day${value === 1 ? '' : 's'}`;
  }

  if (typeof value === 'object') {
    const numericValue = Number(
      value.value ?? value.amount ?? value.days ?? value.weeks ?? value.months,
    );
    const inferredUnit =
      value.unit ||
      (value.days != null ? 'day' : null) ||
      (value.weeks != null ? 'week' : null) ||
      (value.months != null ? 'month' : null);

    if (Number.isFinite(numericValue) && inferredUnit) {
      const singularUnit = String(inferredUnit).replace(/s$/, '');
      return `${numericValue} ${singularUnit}${numericValue === 1 ? '' : 's'}`;
    }

    if (typeof value.label === 'string' && value.label.trim()) {
      return value.label.trim();
    }
  }

  return null;
};

export const isBiddingJob = (job) => {
  if (job?.responseMode === 'bids') {
    return true;
  }

  if (job?.responseMode === 'applications') {
    return false;
  }

  if (job?.biddingEnabled === true || job?.biddingEnabled === 'true') {
    return true;
  }

  const responseBidCount = Number(
    job?.responseCounts?.bids ?? job?.bidCount ?? job?.bidsCount,
  );
  const responseApplicationCount = Number(
    job?.responseCounts?.applications ??
      job?.applicationsCount ??
      job?.applicantCount ??
      job?.proposalCount,
  );

  if (
    Number.isFinite(responseApplicationCount) &&
    responseApplicationCount > 0 &&
    (!Number.isFinite(responseBidCount) || responseBidCount <= 0)
  ) {
    return false;
  }

  if (Number.isFinite(responseBidCount) && responseBidCount > 0) {
    return true;
  }

  // Legacy fallback for records created before biddingEnabled was persisted.
  const currentBidders = Number(job?.bidding?.currentBidders ?? 0);
  return Number.isFinite(currentBidders) && currentBidders > 0;
};

export const normalizeApplication = (raw, jobIdFallback, jobTitleFallback) => {
  const worker = raw?.worker || {};
  const parsedWorkerRating = Number(raw?.workerRating ?? worker?.rating);
  const parsedProposedRate = Number(raw?.proposedRate ?? raw?.bidAmount);
  const workerName =
    raw?.workerName ||
    worker?.name ||
    [worker?.firstName, worker?.lastName].filter(Boolean).join(' ').trim() ||
    'Worker';

  return {
    ...raw,
    id: raw?.id || raw?._id,
    jobId:
      raw?.jobId ||
      raw?.job?._id ||
      raw?.job?.id ||
      (typeof raw?.job === 'string' ? raw?.job : undefined) ||
      jobIdFallback,
    jobTitle:
      raw?.jobTitle || raw?.job?.title || jobTitleFallback || 'Unknown Job',
    workerId: raw?.workerId || worker?.id || worker?._id,
    workerName,
    workerAvatar: raw?.workerAvatar || worker?.avatar || worker?.profileImage,
    workerRating: Number.isFinite(parsedWorkerRating)
      ? parsedWorkerRating
      : null,
    coverLetter: raw?.coverLetter || raw?.coverLetterPreview || '',
    proposedRate: Number.isFinite(parsedProposedRate)
      ? parsedProposedRate
      : null,
    estimatedDuration: formatEstimatedDuration(raw?.estimatedDuration),
  };
};
