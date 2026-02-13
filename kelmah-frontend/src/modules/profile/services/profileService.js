import { api } from '../../../services/apiClient';

const PROFILE_PICTURE_STORAGE_KEY = 'kelmah_profile_picture_preview';

const getStoredProfilePicture = () => {
  try {
    return localStorage.getItem(PROFILE_PICTURE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const setStoredProfilePicture = (value = '') => {
  try {
    if (value) {
      localStorage.setItem(PROFILE_PICTURE_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(PROFILE_PICTURE_STORAGE_KEY);
    }
  } catch {
    // no-op: storage can be unavailable in hardened browser modes
  }
};

class ProfileService {
  // Get user profile
  async getProfile() {
    try {
      // Note: apiClient.baseURL already includes '/api', so we use '/users/profile'
      console.debug('[ProfileService] Requesting /users/profile');
      const response = await api.get('/users/profile');
      const payload = response.data || {};

      if (payload.success === false) {
        throw new Error(payload.error?.message || 'Failed to load profile');
      }

      if (payload.data) {
        console.debug(
          '[ProfileService] Received profile payload',
          payload.meta || {},
        );
        const profilePicture =
          payload?.data?.profilePicture || getStoredProfilePicture();
        return {
          ...(payload.data || {}),
          ...(profilePicture ? { profilePicture } : {}),
          meta: payload.meta || null,
        };
      }

      console.debug(
        '[ProfileService] Response missing data property, returning raw payload',
      );
      return payload;
    } catch (error) {
      console.warn('Profile service unavailable:', { error: error.message });
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      console.debug('[ProfileService] Profile update succeeded');
      return response.data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      if (!file) {
        setStoredProfilePicture('');
        return { profilePicture: '' };
      }

      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedPicture =
        response?.data?.data?.profilePicture ||
        response?.data?.profilePicture ||
        '';
      if (uploadedPicture) {
        setStoredProfilePicture(uploadedPicture);
      }
      return response.data.data;
    } catch (error) {
      console.warn(
        'Profile picture upload endpoint unavailable, using local preview fallback:',
        error?.message,
      );
      const previewUrl = URL.createObjectURL(file);
      setStoredProfilePicture(previewUrl);
      return { profilePicture: previewUrl, localOnly: true };
    }
  }

  // Update user skills
  async updateSkills(skills) {
    try {
      const response = await api.put('/users/profile', { skills });
      return response.data.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  }

  // Update user education
  async updateEducation(education) {
    try {
      const response = await api.put('/users/profile', { education });
      return response.data.data;
    } catch (error) {
      console.error('Error updating education:', error);
      throw error;
    }
  }

  // Update user experience
  async updateExperience(experience) {
    try {
      const response = await api.put('/users/profile', { experience });
      return response.data.data;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/users/profile', { preferences });
      return response.data.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const response = await api.get('/users/profile/statistics');
      return (
        response.data?.data ||
        response.data || { jobsCompleted: 0, successRate: 0 }
      );
    } catch (error) {
      console.warn('Statistics service unavailable:', { error: error.message });
      return { jobsCompleted: 0, successRate: 0 };
    }
  }

  // Get user activity
  async getActivity(filters = {}) {
    try {
      const response = await api.get('/users/profile/activity', {
        params: filters,
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.warn('Activity service unavailable:', { error: error.message });
      return [];
    }
  }
}

const profileService = new ProfileService();
export default profileService;
