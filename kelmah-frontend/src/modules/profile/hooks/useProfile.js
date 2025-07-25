import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import profileService from '../services/profileService';
import {
  setProfile,
  setLoading,
  setError,
} from '../../../store/slices/profileSlice.js';
import useAuth from '../../auth/hooks/useAuth';

export const useProfile = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [activity, setActivity] = useState([]);

  const loadProfile = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const profile = await profileService.getProfile();
      dispatch(setProfile(profile));
      return profile;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const updateProfile = useCallback(
    async (profileData) => {
      try {
        dispatch(setLoading(true));
        const updatedProfile = await profileService.updateProfile(profileData);
        dispatch(setProfile(updatedProfile));
        return updatedProfile;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const uploadProfilePicture = useCallback(
    async (file) => {
      try {
        dispatch(setLoading(true));
        const result = await profileService.uploadProfilePicture(file);
        await loadProfile(); // Reload profile to get updated picture
        return result;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, loadProfile],
  );

  const updateSkills = useCallback(
    async (skills) => {
      try {
        dispatch(setLoading(true));
        const updatedProfile = await profileService.updateSkills(skills);
        dispatch(setProfile(updatedProfile));
        return updatedProfile;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const updateEducation = useCallback(
    async (education) => {
      try {
        dispatch(setLoading(true));
        const updatedProfile = await profileService.updateEducation(education);
        dispatch(setProfile(updatedProfile));
        return updatedProfile;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const updateExperience = useCallback(
    async (experience) => {
      try {
        dispatch(setLoading(true));
        const updatedProfile =
          await profileService.updateExperience(experience);
        dispatch(setProfile(updatedProfile));
        return updatedProfile;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const updatePreferences = useCallback(
    async (preferences) => {
      try {
        dispatch(setLoading(true));
        const updatedProfile =
          await profileService.updatePreferences(preferences);
        dispatch(setProfile(updatedProfile));
        return updatedProfile;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const loadStatistics = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const stats = await profileService.getStatistics();
      setStatistics(stats);
      return stats;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadActivity = useCallback(
    async (filters = {}) => {
      try {
        dispatch(setLoading(true));
        const activities = await profileService.getActivity(filters);
        setActivity(activities);
        return activities;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Load profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadStatistics();
      loadActivity();
    }
  }, [isAuthenticated, loadProfile, loadStatistics, loadActivity]);

  return {
    loadProfile,
    updateProfile,
    uploadProfilePicture,
    updateSkills,
    updateEducation,
    updateExperience,
    updatePreferences,
    loadStatistics,
    loadActivity,
    statistics,
    activity,
  };
};
