import apiClient from '../../../api/index';

class ProfileService {
  // Get user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/profile');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/profile', profileData);
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
      const response = await apiClient.post('/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Update user skills
  async updateSkills(skills) {
    try {
      const response = await apiClient.put('/profile/skills', { skills });
      return response.data.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  }

  // Update user education
  async updateEducation(education) {
    try {
      const response = await apiClient.put('/profile/education', { education });
      return response.data.data;
    } catch (error) {
      console.error('Error updating education:', error);
      throw error;
    }
  }

  // Update user experience
  async updateExperience(experience) {
    try {
      const response = await apiClient.put('/profile/experience', {
        experience,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.put('/profile/preferences', {
        preferences,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const response = await apiClient.get('/profile/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  // Get user activity
  async getActivity(filters = {}) {
    try {
      const response = await apiClient.get('/profile/activity', {
        params: filters,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  }
}

const profileService = new ProfileService();
export default profileService;
