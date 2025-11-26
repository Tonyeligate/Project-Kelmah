import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/apiClient';

export const DEFAULT_PROPOSAL_PAGE_SIZE = 10;
const MAX_RETRY_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 60 * 1000;
const PROPOSAL_ENDPOINT = '/jobs/proposals';

const buildCacheKey = (status, page, limit) => `${status}:${page}:${limit}`;

const normalizeItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
};

export const useProposals = ({
  status = 'all',
  page = 1,
  limit = DEFAULT_PROPOSAL_PAGE_SIZE,
} = {}) => {
  const [proposals, setProposals] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const cacheRef = useRef(new Map());
  const controllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const timedOutRef = useRef(false);

  const clearInFlightRequest = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    timedOutRef.current = false;
  }, []);

  const fetchProposals = useCallback(
    async ({
      targetStatus = status,
      targetPage = page,
      useCache = true,
    } = {}) => {
      const cacheKey = buildCacheKey(targetStatus, targetPage, limit);
      const cachedEntry = cacheRef.current.get(cacheKey);

      if (
        useCache &&
        cachedEntry &&
        Date.now() - cachedEntry.timestamp < CACHE_TTL_MS
      ) {
        setProposals(cachedEntry.items);
        setMeta(cachedEntry.meta);
        setLastUpdated(cachedEntry.updatedAt);
        setError(null);
        setHasTimedOut(false);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const hadWarmData = Boolean(cachedEntry);
      setLoading(!hadWarmData);
      setIsRefreshing(hadWarmData);
      setHasTimedOut(false);
      setError(null);

      let finalError = null;
      const requestId = `proposals_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
        clearInFlightRequest();
        const controller = new AbortController();
        controllerRef.current = controller;

        timeoutRef.current = setTimeout(() => {
          timedOutRef.current = true;
          setHasTimedOut(true);
          controller.abort();
        }, REQUEST_TIMEOUT_MS);

        try {
          const params = { page: targetPage, limit };
          if (targetStatus && targetStatus !== 'all') {
            params.status = targetStatus;
          }

          const response = await api.get(PROPOSAL_ENDPOINT, {
            params,
            signal: controller.signal,
          });

          const payload = response?.data?.data ?? response?.data ?? {};
          const items = normalizeItems(payload);
          const paginationData =
            payload.pagination ?? response?.data?.meta?.pagination ?? {};
          const aggregates =
            response?.data?.meta?.aggregates ?? payload.aggregates ?? {};
          const updatedAt = aggregates.updatedAt ?? new Date().toISOString();

          const pagination = {
            page: paginationData.page ?? targetPage,
            totalPages: paginationData.totalPages ?? 1,
            totalItems:
              paginationData.totalItems ?? aggregates.total ?? items.length,
            limit: paginationData.limit ?? limit,
          };

          const metaPayload = { pagination, aggregates };

          setProposals(items);
          setMeta(metaPayload);
          setError(null);
          setHasTimedOut(false);
          setLoading(false);
          setIsRefreshing(false);
          setLastUpdated(updatedAt);

          cacheRef.current.set(cacheKey, {
            items,
            meta: metaPayload,
            updatedAt,
            timestamp: Date.now(),
          });

          return;
        } catch (err) {
          finalError = err;
          if (err?.name === 'AbortError' && !timedOutRef.current) {
            setLoading(false);
            setIsRefreshing(false);
            return;
          }

          if (attempt === MAX_RETRY_ATTEMPTS) {
            break;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 400 * 2 ** attempt),
          );
        } finally {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          controllerRef.current = null;
        }
      }

      setLoading(false);
      setIsRefreshing(false);

      if (finalError) {
        const timedOut = timedOutRef.current;
        const message = timedOut
          ? 'Request timeout. Please try again.'
          : finalError?.response?.data?.error?.message ||
            finalError?.message ||
            'Unable to fetch proposals. Please try again later.';

        console.error('Unable to fetch proposals', {
          requestId,
          timedOut,
          status: finalError?.response?.status,
          details: finalError?.response?.data,
        });

        setError(message);
        setHasTimedOut(timedOut);
      }

      timedOutRef.current = false;
    },
    [status, page, limit, clearInFlightRequest],
  );

  useEffect(() => {
    fetchProposals();
    return () => clearInFlightRequest();
  }, [fetchProposals, clearInFlightRequest]);

  const refresh = useCallback(() => {
    return fetchProposals({
      targetStatus: status,
      targetPage: page,
      useCache: false,
    });
  }, [fetchProposals, status, page]);

  const retry = useCallback(() => {
    setAttempts((prev) => prev + 1);
    return fetchProposals({
      targetStatus: status,
      targetPage: page,
      useCache: false,
    });
  }, [fetchProposals, status, page]);

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    proposals,
    meta,
    loading,
    isRefreshing,
    error,
    hasTimedOut,
    lastUpdated,
    refresh,
    retry,
    invalidateCache,
    attempts,
  };
};
