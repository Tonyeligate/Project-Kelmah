import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const { isAuthenticated, getToken } = useAuth();
  const [workerSearchResults, setWorkerSearchResults] = useState({
    workers: [],
    total: 0,
    loading: false,
    error: null,
  });
  const [jobSearchResults, setJobSearchResults] = useState({
    jobs: [],
    total: 0,
    loading: false,
    error: null,
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [popularTerms, setPopularTerms] = useState([]);
  
  // Function to search for workers
  const searchWorkers = useCallback(async (searchParams) => {
    setWorkerSearchResults((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Convert arrays to JSON strings for query params
      const params = { ...searchParams };
      if (params.skills && Array.isArray(params.skills)) {
        params.skills = JSON.stringify(params.skills);
      }
      if (params.categories && Array.isArray(params.categories)) {
        params.categories = JSON.stringify(params.categories);
      }
      if (params.priceRange && typeof params.priceRange === 'object') {
        params.priceRange = JSON.stringify(params.priceRange);
      }
      
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/workers`, { 
        params,
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });
      
      // Add to search history
      if (searchParams.keyword) {
        setSearchHistory((prev) => {
          const newHistory = [
            { term: searchParams.keyword, timestamp: new Date() },
            ...prev.filter(item => item.term !== searchParams.keyword)
          ];
          // Keep only last 10 searches
          return newHistory.slice(0, 10);
        });
      }
      
      const data = response.data.data || response.data;
      setWorkerSearchResults({
        workers: data.workers || data.items || data,
        total: data.total || (data.workers || data.items || data).length,
        loading: false,
        error: null,
      });
      
      return data;
    } catch (error) {
      console.error('Error searching workers:', error);
      setWorkerSearchResults((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error searching workers',
      }));
      throw error;
    }
  }, [getToken]);
  
  // Function to search for jobs
  const searchJobs = useCallback(async (searchParams) => {
    setJobSearchResults((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Convert arrays to JSON strings for query params
      const params = { ...searchParams };
      if (params.skills && Array.isArray(params.skills)) {
        params.skills = JSON.stringify(params.skills);
      }
      if (params.categories && Array.isArray(params.categories)) {
        params.categories = JSON.stringify(params.categories);
      }
      
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/jobs`, { 
        params,
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });
      
      // Add to search history
      if (searchParams.keyword) {
        setSearchHistory((prev) => {
          const newHistory = [
            { term: searchParams.keyword, timestamp: new Date() },
            ...prev.filter(item => item.term !== searchParams.keyword)
          ];
          // Keep only last 10 searches
          return newHistory.slice(0, 10);
        });
      }
      
      const data = response.data.data || response.data;
      setJobSearchResults({
        jobs: data.jobs || data.items || data,
        total: data.total || (data.jobs || data.items || data).length,
        loading: false,
        error: null,
      });
      
      return data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobSearchResults((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error searching jobs',
      }));
      throw error;
    }
  }, [getToken]);
  
  // Function to get job recommendations for a worker
  const getJobRecommendations = useCallback(async (workerId, limit = 10) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/search/recommendations/jobs/${workerId}`,
        {
          params: { limit },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      throw error;
    }
  }, [isAuthenticated, getToken]);
  
  // Function to get worker recommendations for a job
  const getWorkerRecommendations = useCallback(async (jobId, limit = 10) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/search/recommendations/workers/${jobId}`,
        {
          params: { limit },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting worker recommendations:', error);
      throw error;
    }
  }, [isAuthenticated, getToken]);
  
  // Function to save a search
  const saveSearch = useCallback(async (name, type, parameters) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/search/saved`,
        { name, type, parameters },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update saved searches list
      const newSavedSearch = response.data.data || response.data;
      setSavedSearches(prev => [...prev, newSavedSearch]);
      
      return newSavedSearch;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }, [isAuthenticated, getToken]);
  
  // Function to get saved searches
  const getSavedSearches = useCallback(async () => {
    if (!isAuthenticated()) {
      return [];
    }
    
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/search/saved`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const savedSearches = response.data.data || response.data;
      setSavedSearches(savedSearches);
      return savedSearches;
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      return [];
    }
  }, [isAuthenticated, getToken]);
  
  // Function to delete a saved search
  const deleteSavedSearch = useCallback(async (searchId) => {
    if (!isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    try {
      const token = getToken();
      await axios.delete(
        `${API_URL}/search/saved/${searchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update saved searches list
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
      
      return true;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      throw error;
    }
  }, [isAuthenticated, getToken]);
  
  // Function to get popular search terms
  const getPopularSearchTerms = useCallback(async (limit = 10) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/analytics/popular-terms`, {
        params: { limit },
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : {}
      });
      
      const popularTerms = response.data.data || response.data;
      setPopularTerms(popularTerms);
      return popularTerms;
    } catch (error) {
      console.error('Error getting popular search terms:', error);
      return [];
    }
  }, [getToken]);
  
  // Load popular terms and saved searches on context mount
  React.useEffect(() => {
    if (isAuthenticated()) {
      getPopularSearchTerms().catch(err => console.error(err));
      getSavedSearches().catch(err => console.error(err));
    }
  }, [isAuthenticated, getPopularSearchTerms, getSavedSearches]);
  
  const value = {
    workerSearchResults,
    jobSearchResults,
    searchHistory,
    savedSearches,
    popularTerms,
    searchWorkers,
    searchJobs,
    getJobRecommendations,
    getWorkerRecommendations,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    getPopularSearchTerms
  };
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 