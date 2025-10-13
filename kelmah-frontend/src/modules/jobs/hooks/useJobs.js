import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import jobService from '../services/jobsService';
import { setJobs, setLoading, setError } from '../services/jobSlice';

export const useJobs = () => {
  const dispatch = useDispatch();
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState({});

  const loadJobs = useCallback(
    async (newFilters = {}) => {
      try {
        dispatch(setLoading(true));
        const data = await jobService.getJobs(newFilters);
        const jobsList = Array.isArray(data) ? data : data.jobs || [];
        dispatch(setJobs(jobsList));
        setFilters(newFilters);
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const searchJobs = useCallback(
    async (query) => {
      try {
        dispatch(setLoading(true));
        const jobs = await jobService.searchJobs(query, filters);
        dispatch(setJobs(jobs));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, filters],
  );

  const loadJobDetails = useCallback(
    async (jobId) => {
      try {
        dispatch(setLoading(true));
        const job = await jobService.getJobById(jobId);
        setSelectedJob(job);
        return job;
      } catch (error) {
        dispatch(setError(error.message));
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const createJob = useCallback(
    async (jobData) => {
      try {
        dispatch(setLoading(true));
        const newJob = await jobService.createJob(jobData);
        dispatch(setJobs((prev) => [...prev, newJob]));
        return newJob;
      } catch (error) {
        dispatch(setError(error.message));
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const updateJob = useCallback(
    async (jobId, jobData) => {
      try {
        dispatch(setLoading(true));
        const updatedJob = await jobService.updateJob(jobId, jobData);
        dispatch(
          setJobs((prev) =>
            prev.map((job) => (job.id === jobId ? updatedJob : job)),
          ),
        );
        return updatedJob;
      } catch (error) {
        dispatch(setError(error.message));
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const deleteJob = useCallback(
    async (jobId) => {
      try {
        dispatch(setLoading(true));
        await jobService.deleteJob(jobId);
        dispatch(setJobs((prev) => prev.filter((job) => job.id !== jobId)));
        return true;
      } catch (error) {
        dispatch(setError(error.message));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const applyForJob = useCallback(
    async (jobId, applicationData) => {
      try {
        dispatch(setLoading(true));
        const application = await jobService.applyForJob(
          jobId,
          applicationData,
        );
        return application;
      } catch (error) {
        dispatch(setError(error.message));
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const saveJob = useCallback(
    async (jobId) => {
      try {
        dispatch(setLoading(true));
        await jobService.saveJob(jobId);
        return true;
      } catch (error) {
        dispatch(setError(error.message));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const loadSavedJobs = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const savedJobs = await jobService.getSavedJobs();
      dispatch(setJobs(savedJobs));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadFeaturedJobs = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const featuredJobs = await jobService.getFeaturedJobs();
      dispatch(setJobs(featuredJobs));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    selectedJob,
    filters,
    loadJobs,
    searchJobs,
    loadJobDetails,
    createJob,
    updateJob,
    deleteJob,
    applyForJob,
    saveJob,
    loadSavedJobs,
    loadFeaturedJobs,
    setFilters,
  };
};
