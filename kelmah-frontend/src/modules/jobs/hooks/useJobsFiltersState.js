import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

const DEFAULT_BUDGET_RANGE = [0, 100000];
const DEFAULT_QUICK_FILTERS = {
  urgent: false,
  verified: false,
  fullTime: false,
  contract: false,
};

const JOBS_PER_PAGE = 12;

export function useJobsFiltersState(initialState = {}) {
  const [searchQuery, setSearchQuery] = useState(
    initialState.searchQuery || '',
  );
  const [submittedSearch, setSubmittedSearch] = useState(
    initialState.submittedSearch ?? null,
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialState.selectedCategory || '',
  );
  const [selectedLocation, setSelectedLocation] = useState(
    initialState.selectedLocation || '',
  );
  const [budgetRange, setBudgetRange] = useState(
    Array.isArray(initialState.budgetRange)
      ? initialState.budgetRange
      : DEFAULT_BUDGET_RANGE,
  );
  const [budgetFilterActive, setBudgetFilterActive] = useState(
    Boolean(initialState.budgetFilterActive),
  );
  const [sortBy, setSortBy] = useState(initialState.sortBy || 'relevance');
  const [quickFilters, setQuickFilters] = useState({
    ...DEFAULT_QUICK_FILTERS,
    ...(initialState.quickFilters || {}),
  });
  const [showFilters, setShowFilters] = useState(
    Boolean(initialState.showFilters),
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(
    Boolean(initialState.mobileFilterOpen),
  );
  const [page, setPage] = useState(initialState.page || 1);
  const [totalPages, setTotalPages] = useState(initialState.totalPages || 1);
  const [totalJobs, setTotalJobs] = useState(initialState.totalJobs || 0);

  const debouncedSearch = useDebounce(searchQuery, 350);
  const debouncedBudgetRange = useDebounce(
    budgetFilterActive ? budgetRange : null,
    500,
  );

  const hasMore = page < totalPages;

  const effectiveSearch =
    submittedSearch !== null && searchQuery !== debouncedSearch
      ? submittedSearch
      : debouncedSearch;

  const hasActiveFilters = Boolean(
    effectiveSearch ||
      selectedCategory ||
      selectedLocation ||
      budgetFilterActive ||
      quickFilters.urgent ||
      quickFilters.verified ||
      quickFilters.fullTime ||
      quickFilters.contract,
  );

  const activeFilterCount = useMemo(
    () =>
      [
        effectiveSearch,
        selectedCategory,
        selectedLocation,
        budgetFilterActive,
        quickFilters.urgent,
        quickFilters.verified,
        quickFilters.fullTime,
        quickFilters.contract,
      ].filter(Boolean).length,
    [
      effectiveSearch,
      selectedCategory,
      selectedLocation,
      budgetFilterActive,
      quickFilters,
    ],
  );

  const toggleQuickFilter = useCallback((key) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearch(null);
    setSelectedCategory('');
    setSelectedLocation('');
    setBudgetRange(DEFAULT_BUDGET_RANGE);
    setBudgetFilterActive(false);
    setSortBy('relevance');
    setQuickFilters({ ...DEFAULT_QUICK_FILTERS });
    setPage(1);
  }, []);

  const handleOpenMobileFilters = useCallback(() => {
    setMobileFilterOpen(true);
  }, []);

  const handleCloseMobileFilters = useCallback(() => {
    setMobileFilterOpen(false);
  }, []);

  const handleApplyMobileFilters = useCallback((filters) => {
    if (filters.search !== undefined) setSearchQuery(filters.search);
    if (filters.search !== undefined) {
      setSubmittedSearch(filters.search.trim());
    }
    if (filters.category !== undefined) setSelectedCategory(filters.category);
    if (filters.location !== undefined) setSelectedLocation(filters.location);
    if (filters.salaryRange) {
      setBudgetRange(filters.salaryRange);
      setBudgetFilterActive(true);
    }
    setPage(1);
    setMobileFilterOpen(false);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleBudgetFilterToggle = useCallback((checked) => {
    setBudgetFilterActive(checked);
  }, []);

  const handleBudgetRangeChange = useCallback((newValue) => {
    if (Array.isArray(newValue)) {
      setBudgetRange(newValue);
      setBudgetFilterActive(true);
    }
  }, []);

  const handleBrowseCategorySelect = useCallback((categoryName) => {
    setSelectedCategory(categoryName);
    setPage(1);
  }, []);

  const prevFiltersRef = useRef('');
  useEffect(() => {
    const filterKey = JSON.stringify({
      effectiveSearch,
      selectedCategory,
      selectedLocation,
      debouncedBudgetRange,
      sortBy,
      quickFilters,
    });

    if (prevFiltersRef.current && prevFiltersRef.current !== filterKey) {
      setPage(1);
    }

    prevFiltersRef.current = filterKey;
  }, [
    effectiveSearch,
    selectedCategory,
    selectedLocation,
    debouncedBudgetRange,
    sortBy,
    quickFilters,
  ]);

  useEffect(() => {
    if (submittedSearch !== null && debouncedSearch === submittedSearch) {
      setSubmittedSearch(null);
    }
  }, [debouncedSearch, submittedSearch]);

  const jobsQueryFilters = useMemo(() => {
    const params = {
      status: 'open',
      search: effectiveSearch || undefined,
      category: selectedCategory || undefined,
      location: selectedLocation || undefined,
      sort: sortBy !== 'relevance' ? sortBy : undefined,
      limit: JOBS_PER_PAGE,
      page,
    };

    if (debouncedBudgetRange) {
      params.min_budget = debouncedBudgetRange[0];
      params.max_budget = debouncedBudgetRange[1];
    }

    if (quickFilters.urgent) params.urgent = 'true';
    if (quickFilters.verified) params.verified = 'true';
    if (quickFilters.fullTime) params.paymentType = 'hourly';
    if (quickFilters.contract) params.paymentType = 'fixed';

    return params;
  }, [
    effectiveSearch,
    selectedCategory,
    selectedLocation,
    debouncedBudgetRange,
    sortBy,
    quickFilters,
    page,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    submittedSearch,
    setSubmittedSearch,
    selectedCategory,
    setSelectedCategory,
    selectedLocation,
    setSelectedLocation,
    budgetRange,
    setBudgetRange,
    budgetFilterActive,
    setBudgetFilterActive,
    sortBy,
    setSortBy,
    quickFilters,
    showFilters,
    mobileFilterOpen,
    page,
    setPage,
    totalPages,
    setTotalPages,
    totalJobs,
    setTotalJobs,
    hasMore,
    effectiveSearch,
    hasActiveFilters,
    activeFilterCount,
    toggleQuickFilter,
    clearAllFilters,
    handleOpenMobileFilters,
    handleCloseMobileFilters,
    handleApplyMobileFilters,
    handleToggleFilters,
    handleBudgetFilterToggle,
    handleBudgetRangeChange,
    handleBrowseCategorySelect,
    jobsQueryFilters,
  };
}

export default useJobsFiltersState;
