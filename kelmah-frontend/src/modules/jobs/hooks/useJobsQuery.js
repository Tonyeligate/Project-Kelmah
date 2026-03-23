import { useMemo } from 'react';
import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import jobsApi from '../services/jobsService';

const EMPTY_QUERY_PARAMS = {};

const sanitizeParams = (rawParams = EMPTY_QUERY_PARAMS, defaults = EMPTY_QUERY_PARAMS) => {
    const merged = {
        ...defaults,
        ...rawParams,
    };

    return Object.entries(merged).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) {
            return acc;
        }

        if (typeof value === 'string' && value.trim() === '') {
            return acc;
        }

        if (Array.isArray(value) && value.length === 0) {
            return acc;
        }

        acc[key] = value;
        return acc;
    }, {});
};

const sanitizeFilters = (rawFilters = EMPTY_QUERY_PARAMS) =>
    sanitizeParams(rawFilters, { status: 'open' });

const stableSerialize = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => stableSerialize(item));
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
                acc[key] = stableSerialize(value[key]);
                return acc;
            }, {});
    }

    return value;
};

const buildStableParamsKey = (params = EMPTY_QUERY_PARAMS) =>
    JSON.stringify(stableSerialize(params ?? EMPTY_QUERY_PARAMS));

const parseStableParamsKey = (stableKey, fallback = EMPTY_QUERY_PARAMS) => {
    try {
        const parsed = JSON.parse(stableKey);
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
        return fallback;
    }
};

export const jobKeys = {
    all: () => ['jobs'],
    list: (filters = {}) => ['jobs', 'list', filters],
    detail: (jobId) => ['jobs', 'detail', jobId],
    saved: (params = {}) => ['jobs', 'saved', params],
    my: (role = 'hirer', params = {}) => ['jobs', 'my', role, params],
};

const deriveSavedJobIds = (jobsResponse) => {
    const list = Array.isArray(jobsResponse?.jobs)
        ? jobsResponse.jobs
        : Array.isArray(jobsResponse?.data)
            ? jobsResponse.data
            : [];
    return new Set(
        list.map((job) => job?.id || job?._id || job?.jobId).filter(Boolean),
    );
};

const updateSavedJobsCache = (current, job, mode = 'add') => {
    if (!current) return current;
    const jobs = Array.isArray(current.jobs)
        ? current.jobs
        : Array.isArray(current.data)
            ? current.data
            : [];
    const normalizeId = (item) => item?.id || item?._id || item?.jobId || item;

    if (mode === 'remove') {
        const nextJobs = jobs.filter(
            (item) => normalizeId(item) !== normalizeId(job),
        );
        return { ...current, jobs: nextJobs, data: nextJobs };
    }

    if (!job) {
        // Nothing to optimistically add
        return current;
    }

    const alreadySaved = jobs.some(
        (item) => normalizeId(item) === normalizeId(job),
    );
    if (alreadySaved) {
        return current;
    }

    const nextJobs = [job, ...jobs];
    return { ...current, jobs: nextJobs, data: nextJobs };
};

const normalizeJobId = (job) => job?.id || job?._id || job?.jobId || job;

const markJobAsApplied = (job) => {
    if (!job || typeof job !== 'object') {
        return job;
    }

    const currentCount = Number(job.applicationsCount ?? job.proposalCount ?? 0);
    const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;
    return {
        ...job,
        hasApplied: true,
        applicationsCount: nextCount,
        proposalCount: nextCount,
    };
};

const updateJobInCollection = (collection, jobId) => {
    if (!Array.isArray(collection)) {
        return collection;
    }

    return collection.map((job) =>
        normalizeJobId(job) === jobId ? markJobAsApplied(job) : job,
    );
};

export const useJobsQuery = (filters = EMPTY_QUERY_PARAMS, options = {}) => {
    const filtersKey = buildStableParamsKey(filters);
    const normalizedFilters = useMemo(
        () => sanitizeFilters(parseStableParamsKey(filtersKey, EMPTY_QUERY_PARAMS)),
        [filtersKey],
    );

    return useQuery({
        queryKey: jobKeys.list(normalizedFilters),
        queryFn: ({ signal }) => jobsApi.getJobs(normalizedFilters, { signal }),
        staleTime: 2 * 60 * 1000, // AUD2-L08: 2 min — avoids hammering API on every mount without sacrificing freshness
        gcTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
        ...options,
    });
};

export const useJobQuery = (jobId, options = {}) =>
    useQuery({
        queryKey: jobKeys.detail(jobId),
        queryFn: ({ signal }) => jobsApi.getJobById(jobId, { signal }),
        enabled: Boolean(jobId),
        staleTime: 2 * 60 * 1000, // AUD2-L08: 2 min for detail pages
        gcTime: 5 * 60 * 1000,
        ...options,
    });

export const useSavedJobsQuery = (params = EMPTY_QUERY_PARAMS, options = {}) => {
    const paramsKey = buildStableParamsKey(params);
    const normalizedParams = useMemo(
        () => sanitizeParams(parseStableParamsKey(paramsKey, EMPTY_QUERY_PARAMS)),
        [paramsKey],
    );

    return useQuery({
        queryKey: jobKeys.saved(normalizedParams),
        queryFn: ({ signal }) => jobsApi.getSavedJobs(normalizedParams, { signal }),
        staleTime: 2 * 60 * 1000, // AUD2-L08
        gcTime: 5 * 60 * 1000,
        ...options,
    });
};

export const useCreateJobMutation = (options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobPayload) => jobsApi.createJob(jobPayload),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: jobKeys.all() });
            queryClient.invalidateQueries({ queryKey: jobKeys.my('hirer') });
            options.onSuccess?.(data, variables, context);
        },
        ...options,
    });
};

export const useApplyToJobMutation = (options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId, applicationData }) =>
            jobsApi.applyToJob(jobId, applicationData),
        onMutate: async (variables) => {
            const jobId = normalizeJobId(variables?.jobId);
            if (!jobId) {
                return { snapshots: [] };
            }

            await Promise.all([
                queryClient.cancelQueries({ queryKey: jobKeys.detail(jobId) }),
                queryClient.cancelQueries({ queryKey: jobKeys.list(), exact: false }),
            ]);

            const snapshots = [
                [jobKeys.detail(jobId), queryClient.getQueryData(jobKeys.detail(jobId))],
                ...queryClient.getQueriesData({ queryKey: jobKeys.list(), exact: false }),
            ];

            const detailQuery = queryClient.getQueryData(jobKeys.detail(jobId));
            if (detailQuery && typeof detailQuery === 'object') {
                queryClient.setQueryData(jobKeys.detail(jobId), markJobAsApplied(detailQuery));
            }

            queryClient.getQueriesData({ queryKey: jobKeys.list(), exact: false }).forEach(([key, data]) => {
                if (!data || typeof data !== 'object') {
                    return;
                }

                const nextData = {
                    ...data,
                    jobs: updateJobInCollection(data?.jobs, jobId),
                    data: updateJobInCollection(data?.data, jobId),
                };
                queryClient.setQueryData(key, nextData);
            });

            return { snapshots };
        },
        onError: (error, variables, context) => {
            context?.snapshots?.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            options.onError?.(error, variables, context);
        },
        onSuccess: (data, variables, context) => {
            if (variables?.jobId) {
                queryClient.invalidateQueries({
                    queryKey: jobKeys.detail(variables.jobId),
                });
            }
            queryClient.invalidateQueries({ queryKey: jobKeys.list(), exact: false });
            queryClient.invalidateQueries({ queryKey: jobKeys.my('worker') });
            options.onSuccess?.(data, variables, context);
        },
        ...options,
    });
};

const invalidateSavedQueries = (queryClient) =>
    queryClient.invalidateQueries({ queryKey: jobKeys.saved(), exact: false });

const cancelSavedQueries = (queryClient) =>
    queryClient.cancelQueries({ queryKey: jobKeys.saved(), exact: false });

const getSavedQueriesSnapshot = (queryClient) =>
    queryClient.getQueriesData({ queryKey: jobKeys.saved(), exact: false });

export const useSaveJobMutation = (options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId }) => jobsApi.saveJob(jobId),
        onMutate: async (variables) => {
            await cancelSavedQueries(queryClient);
            const snapshot = getSavedQueriesSnapshot(queryClient);

            if (variables?.job) {
                snapshot.forEach(([key, data]) => {
                    queryClient.setQueryData(key, updateSavedJobsCache(data, variables.job, 'add'));
                });
            }

            return { snapshot };
        },
        onError: (error, variables, context) => {
            context?.snapshot?.forEach(([key, data]) => {
                queryClient.setQueryData(key, data);
            });
            options.onError?.(error, variables, context);
        },
        onSuccess: (data, variables, context) => {
            invalidateSavedQueries(queryClient);
            options.onSuccess?.(data, variables, context);
        },
        ...options,
    });
};

export const useUnsaveJobMutation = (options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ jobId }) => jobsApi.unsaveJob(jobId),
        onMutate: async (variables) => {
            await cancelSavedQueries(queryClient);
            const snapshot = getSavedQueriesSnapshot(queryClient);
            snapshot.forEach(([key, data]) => {
                queryClient.setQueryData(
                    key,
                    updateSavedJobsCache(data, variables?.jobId || variables?.job, 'remove'),
                );
            });
            return { snapshot };
        },
        onError: (error, variables, context) => {
            context?.snapshot?.forEach(([key, data]) => {
                queryClient.setQueryData(key, data);
            });
            options.onError?.(error, variables, context);
        },
        onSuccess: (data, variables, context) => {
            invalidateSavedQueries(queryClient);
            options.onSuccess?.(data, variables, context);
        },
        ...options,
    });
};

export const useSavedJobIds = (savedJobsData) =>
    useMemo(() => deriveSavedJobIds(savedJobsData), [savedJobsData]);
