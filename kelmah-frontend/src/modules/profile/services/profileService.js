import { userServiceClient } from '../../common/services/axios';
import { API_ENDPOINTS } from '../../../config/environment';

class ProfileService {
  // Get user profile
  async getProfile() {
    try {
      console.debug('[ProfileService] Requesting /api/users/profile');
      const response = await userServiceClient.get(API_ENDPOINTS.USER.PROFILE);
      const payload = response.data || {};

      if (payload.success === false) {
        throw new Error(payload.error?.message || 'Failed to load profile');
      }

      if (payload.data) {
        console.debug(
          '[ProfileService] Received profile payload',
          payload.meta || {},
        );
        return {
          ...(payload.data || {}),
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
      const response = await userServiceClient.put(
        API_ENDPOINTS.USER.UPDATE,
        profileData,
      );
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
      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await userServiceClient.post(
        API_ENDPOINTS.USER.PROFILE_PICTURE,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Update user skills
  async updateSkills(skills) {
    try {
      const response = await userServiceClient.put(
        API_ENDPOINTS.USER.PROFILE_SKILLS,
        {
          skills,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  }

  // Update user education
  async updateEducation(education) {
    try {
      const response = await userServiceClient.put(
        API_ENDPOINTS.USER.PROFILE_EDUCATION,
        {
          education,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating education:', error);
      throw error;
    }
  }

  // Update user experience
  async updateExperience(experience) {
    try {
      const response = await userServiceClient.put(
        API_ENDPOINTS.USER.PROFILE_EXPERIENCE,
        {
          experience,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await userServiceClient.put(
        API_ENDPOINTS.USER.PROFILE_PREFERENCES,
        {
          preferences,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const response = await userServiceClient.get(
        API_ENDPOINTS.USER.PROFILE_STATISTICS,
      );
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
      const response = await userServiceClient.get(
        API_ENDPOINTS.USER.PROFILE_ACTIVITY,
        {
          params: filters,
        },
      );
      return response.data?.data || response.data || [];
    } catch (error) {
      console.warn('Activity service unavailable:', { error: error.message });
      return [];
    }
  }
}

const profileService = new ProfileService();
export default profileService;
