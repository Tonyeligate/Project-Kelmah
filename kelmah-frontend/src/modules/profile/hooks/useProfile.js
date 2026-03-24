import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import profileService from '../services/profileService';
import {
  setProfile,
  setLoading,
  setError,
} from '../../../store/slices/profileSlice.js';
import useAuth from '../../auth/hooks/useAuth';
import {
  createFeatureLogger,
  devError,
  devWarn,
} from '';

const PROFILE_REQUEST_TIMEOUT_MS = 5000;
let profileInitPromise = null;
const profileDebug = createFeatureLogger({
  flagName: 'VITE_DEBUG_PROFILE',
  level: 'debug',
});

export const useProfile = (options = {}) => {
  const { autoInitialize = true } = options;
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [activity, setActivity] = useState([]);
  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);

  const isCurrentRequest = useCallback(
    (requestId) =>
      isMountedRef.current && requestId === activeRequestIdRef.current,
    [],
  );

  const loadProfile = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    const startedAt = Date.now();
    let timeoutId;
    if (isCurrentRequest(requestId)) {
      dispatch(setLoading(true));
    }
    profileDebug('[ProfileHook] loadProfile() initiated');

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

      if (isCurrentRequest(requestId)) {
        dispatch(setProfile(profile));
        dispatch(setError(null)); // Clear any previous errors
      }
      profileDebug('[ProfileHook] loadProfile() completed successfully', {
        durationMs: Date.now() - startedAt,
      });
      return profile;
    } catch (error) {
      const isTimeout = error?.message === 'Profile request timed out';
      const friendlyMessage = isTimeout
        ? 'Profile is taking too long to load. Please try again.'
        : error?.message || 'Failed to load profile. Please try again later.';

      if (isCurrentRequest(requestId)) {
        dispatch(setError(friendlyMessage));
      }
      devWarn('Profile loading error (with fallback):', error.message);
      if (isTimeout) {
        devWarn('[ProfileHook] loadProfile() timed out after 5s');
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      profileDebug('[ProfileHook] loadProfile() finished', {
        durationMs: Date.now() - startedAt,
      });
      if (isCurrentRequest(requestId)) {
        dispatch(setLoading(false));
      }
    }
  }, [dispatch, isCurrentRequest]);

  const updateProfile = useCallback(
    async (profileData) => {
      try {
        dispatch(setLoading(true));
        profileDebug('[ProfileHook] updateProfile() initiated');
        const updatedProfile = await profileService.updateProfile(profileData);
        dispatch(setProfile(updatedProfile));
        dispatch(setError(null));
        profileDebug('[ProfileHook] updateProfile() completed');
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
        profileDebug('[ProfileHook] uploadProfilePicture() initiated');
        const result = await profileService.uploadProfilePicture(file);
        await loadProfile(); // Reload profile to get updated picture
        profileDebug('[ProfileHook] uploadProfilePicture() completed');
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
      if (isMountedRef.current) {
        setStatistics(stats);
      }
      return stats;
    } catch (error) {
      devWarn('Statistics loading error (with fallback):', error.message);
      // Don't re-throw since profileService now provides fallback data
      return null;
    }
  }, []);

  const loadActivity = useCallback(async (filters = {}) => {
    try {
      const activities = await profileService.getActivity(filters);
      if (isMountedRef.current) {
        setActivity(activities);
      }
      return activities;
    } catch (error) {
      devWarn('Activity loading error (with fallback):', error.message);
      // Don't re-throw since profileService now provides fallback data
      return [];
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeRequestIdRef.current += 1;
    };
  }, []);

  // Load profile when authenticated
  useEffect(() => {
    if (isAuthenticated && autoInitialize) {
      if (!profileInitPromise) {
        profileInitPromise = (async () => {
          try {
            const profile = await loadProfile();

            if (profile) {
              await Promise.allSettled([
                loadStatistics().catch((error) => {
                  devWarn(
                    'Statistics loading failed (gracefully handled):',
                    error.message,
                  );
                }),
                loadActivity().catch((error) => {
                  devWarn(
                    'Activity loading failed (gracefully handled):',
                    error.message,
                  );
                }),
              ]);
            }

            profileDebug('[ProfileHook] Profile initialization completed');
          } catch (error) {
            devError('Profile initialization error:', error);
          } finally {
            profileInitPromise = null;
          }
        })();
      }

      profileInitPromise.catch(() => {});
    }
  }, [isAuthenticated, autoInitialize, loadProfile, loadStatistics, loadActivity]);

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
