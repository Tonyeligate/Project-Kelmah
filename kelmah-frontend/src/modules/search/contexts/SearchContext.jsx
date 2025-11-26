import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import searchService from '../services/searchService';

// Create Search Context
const SearchContext = createContext();

// Search Provider Component
export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (err) {
        console.error('Error parsing saved searches:', err);
        localStorage.removeItem('recentSearches');
      }
    }
  }, []);

  // Save recent searches to localStorage when they change
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Perform search with provided filters
  const performSearch = useCallback(
    async (searchFilters = {}, page = 1, limit = 10) => {
      setLoading(true);
      setError(null);

      try {
        // Merge new filters with existing ones or replace entirely
        const updatedFilters = {
          ...filters,
          ...searchFilters,
        };
        setFilters(updatedFilters);

        // Add search to recent searches
        if (searchFilters.keyword) {
          updateRecentSearches(searchFilters.keyword);
        }

        // Perform search API call
        const response = await searchService.searchJobs({
          ...updatedFilters,
          page,
          limit,
        });

        setSearchResults(response.jobs || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });

        return response;
      } catch (err) {
        console.error('Search error:', err);
        setError(err.response?.data?.message || 'Failed to perform search');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Update recent searches
  const updateRecentSearches = useCallback((keyword) => {
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== keyword.toLowerCase(),
      );

      // Add to beginning
      const updated = [keyword, ...filtered].slice(0, 10);

      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Change page
  const changePage = useCallback(
    (page) => {
      performSearch(filters, page, pagination.limit);
    },
    [filters, pagination.limit, performSearch],
  );

  // Context value
  const value = {
    searchResults,
    recentSearches,
    filters,
    loading,
    error,
    pagination,
    performSearch,
    clearFilters,
    clearRecentSearches,
    changePage,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

// PropTypes validation
SearchProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook for using the search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export default SearchContext;
