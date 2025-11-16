import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import profileService from '../services/profileService';
import {
  setProfile,
  setLoading,
  setError,
} from '../../../store/slices/profileSlice.js';
import useAuth from '../../auth/hooks/useAuth';

const PROFILE_REQUEST_TIMEOUT_MS = 5000;

export const useProfile = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [activity, setActivity] = useState([]);

  const loadProfile = useCallback(async () => {
    const startedAt = Date.now();
    let timeoutId;
    dispatch(setLoading(true));
    console.debug('[ProfileHook] loadProfile() initiated');

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Profile request timed out')),
          PROFILE_REQUEST_TIMEOUT_MS,
        );
      });

      const profile = await Promise.race([
        profileService.getProfile(),
        timeoutPromise,
      ]);

      dispatch(setProfile(profile));
      dispatch(setError(null)); // Clear any previous errors
      console.debug('[ProfileHook] loadProfile() completed successfully', {
        durationMs: Date.now() - startedAt,
      });
      return profile;
    } catch (error) {
      const isTimeout = error?.message === 'Profile request timed out';
      const friendlyMessage = isTimeout
        ? 'Profile is taking too long to load. Please try again.'
        : error?.message || 'Failed to load profile. Please try again later.';

      dispatch(setError(friendlyMessage));
      console.warn('Profile loading error (with fallback):', error.message);
      if (isTimeout) {
        console.warn('[ProfileHook] loadProfile() timed out after 5s');
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      console.debug('[ProfileHook] loadProfile() finished', {
        durationMs: Date.now() - startedAt,
      });
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const updateProfile = useCallback(
    async (profileData) => {
      try {
        dispatch(setLoading(true));
        console.debug('[ProfileHook] updateProfile() initiated');
        const updatedProfile = await profileService.updateProfile(profileData);
        dispatch(setProfile(updatedProfile));
        dispatch(setError(null));
        console.debug('[ProfileHook] updateProfile() completed');
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
        console.debug('[ProfileHook] uploadProfilePicture() initiated');
        const result = await profileService.uploadProfilePicture(file);
        await loadProfile(); // Reload profile to get updated picture
        console.debug('[ProfileHook] uploadProfilePicture() completed');
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
