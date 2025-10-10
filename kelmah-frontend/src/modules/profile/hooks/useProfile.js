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
      dispatch(setError(null)); // Clear any previous errors
      return profile;
    } catch (error) {
      dispatch(setError(error.message));
      console.warn('Profile loading error (with fallback):', error.message);
      // Don't re-throw since profileService now provides fallback data
      return null;
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
      const stats = await profileService.getStatistics();
      setStatistics(stats);
      return stats;
    } catch (error) {
      console.warn('Statistics loading error (with fallback):', error.message);
      // Don't re-throw since profileService now provides fallback data
      return null;
    }
  }, []);

  const loadActivity = useCallback(async (filters = {}) => {
    try {
      const activities = await profileService.getActivity(filters);
      setActivity(activities);
      return activities;
    } catch (error) {
      console.warn('Activity loading error (with fallback):', error.message);
      // Don't re-throw since profileService now provides fallback data
      return [];
    }
  }, []);

  // Load profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // ✅ FIXED: Add try-catch to prevent uncaught promise rejections
      const initializeProfile = async () => {
        try {
          // Load all profile data concurrently
          await Promise.allSettled([
            loadProfile().catch((error) => {
              console.warn(
                'Profile loading failed (gracefully handled):',
                error.message,
              );
            }),
            loadStatistics().catch((error) => {
              console.warn(
                'Statistics loading failed (gracefully handled):',
                error.message,
              );
            }),
            loadActivity().catch((error) => {
              console.warn(
                'Activity loading failed (gracefully handled):',
                error.message,
              );
            }),
          ]);
          console.log('🎯 Profile initialization completed with fallback data');
        } catch (error) {
          console.error('Profile initialization error:', error);
          // Error is already handled by individual catch blocks
        }
      };

      initializeProfile();
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
