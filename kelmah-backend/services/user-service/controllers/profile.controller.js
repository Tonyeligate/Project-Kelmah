const { Profile, Address, WorkExperience, Education, Certification, PortfolioItem, SocialProfile } = require('../models/profile.model');
const Skill = require('../models/skill.model');
const { response } = require('../../../shared');
const { validationResult } = require('express-validator');
const axios = require('axios');

/**
 * Get user profile by userId
 * @route GET /profiles/:userId
 * @access Public
 */
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find profile with associations
    const profile = await Profile.findOne({ 
      where: { userId },
      include: [
        { model: Address, as: 'address' },
        { model: WorkExperience, as: 'experiences' },
        { model: Education, as: 'education' },
        { model: Certification, as: 'certifications' },
        { model: PortfolioItem, as: 'portfolioItems' },
        { model: SocialProfile, as: 'socialProfiles' }
      ]
    });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }

    // Check profile visibility if not the profile owner
    if (req.user && req.user.id !== userId && profile.visibility === 'Private') {
      return response.error(res, 403, 'Profile is private');
    }

    return response.success(res, 200, profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return response.error(res, 500, 'Failed to retrieve profile');
  }
};

/**
 * Create or update user profile
 * @route POST /profiles
 * @access Private
 */
exports.createOrUpdateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.error(
        res, 
        400, 
        'Validation error', 
        response.formatValidationErrors(errors.array())
      );
    }

    const userId = req.user.id;
    const profileData = req.body;

    // Process skills if provided
    if (profileData.skills && profileData.skills.length > 0) {
      // Process each skill - find or create in the skill database
      const processedSkills = [];
      for (const skill of profileData.skills) {
        try {
          // Ensure the skill exists in the skill catalog
          const skillData = {
            name: skill.name,
            category: skill.category || 'Other'
          };
          
          await Skill.findOrCreate(skillData);
          
          // Add to profile's skills
          processedSkills.push({
            name: skill.name,
            level: skill.level || 'Intermediate',
            yearsOfExperience: skill.yearsOfExperience || 0
          });
        } catch (error) {
          console.error('Error processing skill:', error);
          // Continue with other skills
        }
      }
      
      // Replace skills in the profile data
      profileData.skills = processedSkills;
    }

    // Set or update geoLocation if address is provided
    if (profileData.address && 
        profileData.address.city && 
        profileData.address.state && 
        profileData.address.country) {
      try {
        // Format address for geocoding
        const addressString = `${profileData.address.street || ''}, ${profileData.address.city}, ${profileData.address.state}, ${profileData.address.zipCode || ''}, ${profileData.address.country}`;
        
        // Call a geocoding service
        // This would typically be an external API like Google Maps, but we're mocking it here
        // const geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
        
        // Mock response for now
        const mockCoordinates = [-73.9857, 40.7484]; // Example: NYC coordinates
        
        // Set the geolocation in the address
        if (!profileData.address.location) {
          profileData.address.location = {};
        }
        
        profileData.address.location.type = 'Point';
        profileData.address.location.coordinates = mockCoordinates;
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue without setting coordinates
      }
    }

    // Find the profile by userId
    let profile = await Profile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: profileData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      profile = new Profile({
        userId,
        ...profileData
      });
      await profile.save();
    }

    return response.success(res, 200, profile);
  } catch (error) {
    console.error('Update profile error:', error);
    return response.error(res, 500, 'Failed to update profile');
  }
};

/**
 * Delete user profile
 * @route DELETE /profiles/:userId
 * @access Private
 */
exports.deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return response.error(res, 403, 'Not authorized to delete this profile');
    }
    
    // Find and delete profile
    const deletedProfile = await Profile.findOneAndDelete({ userId });
    
    if (!deletedProfile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    return response.success(res, 200, { message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return response.error(res, 500, 'Failed to delete profile');
  }
};

/**
 * Add experience to profile
 * @route POST /profiles/:userId/experiences
 * @access Private
 */
exports.addExperience = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.error(
        res, 
        400, 
        'Validation error', 
        response.formatValidationErrors(errors.array())
      );
    }
    
    const { userId } = req.params;
    
    // Ensure user can only modify their own profile
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }
    
    const experienceData = req.body;
    
    // Find profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Add new experience to beginning of array
    profile.experiences.unshift(experienceData);
    
    await profile.save();
    
    return response.success(res, 200, profile.experiences);
  } catch (error) {
    console.error('Add experience error:', error);
    return response.error(res, 500, 'Failed to add experience');
  }
};

/**
 * Update experience in profile
 * @route PUT /profiles/:userId/experiences/:expId
 * @access Private
 */
exports.updateExperience = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.error(
        res, 
        400, 
        'Validation error', 
        response.formatValidationErrors(errors.array())
      );
    }
    
    const { userId, expId } = req.params;
    
    // Ensure user can only modify their own profile
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }
    
    const updateData = req.body;
    
    // Find profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Find experience index
    const expIndex = profile.experiences.findIndex(exp => exp._id.toString() === expId);
    
    if (expIndex === -1) {
      return response.error(res, 404, 'Experience not found');
    }
    
    // Update experience fields
    Object.keys(updateData).forEach(key => {
      profile.experiences[expIndex][key] = updateData[key];
    });
    
    await profile.save();
    
    return response.success(res, 200, profile.experiences);
  } catch (error) {
    console.error('Update experience error:', error);
    return response.error(res, 500, 'Failed to update experience');
  }
};

/**
 * Delete experience from profile
 * @route DELETE /profiles/:userId/experiences/:expId
 * @access Private
 */
exports.deleteExperience = async (req, res) => {
  try {
    const { userId, expId } = req.params;
    
    // Ensure user can only modify their own profile
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }
    
    // Find profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Filter out the experience
    profile.experiences = profile.experiences.filter(
      exp => exp._id.toString() !== expId
    );
    
    await profile.save();
    
    return response.success(res, 200, profile.experiences);
  } catch (error) {
    console.error('Delete experience error:', error);
    return response.error(res, 500, 'Failed to delete experience');
  }
};

/**
 * Add education to profile
 * @route POST /profiles/:userId/education
 * @access Private
 */
exports.addEducation = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.error(
        res, 
        400, 
        'Validation error', 
        response.formatValidationErrors(errors.array())
      );
    }
    
    const { userId } = req.params;
    
    // Ensure user can only modify their own profile
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }
    
    const educationData = req.body;
    
    // Find profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Add new education to beginning of array
    profile.education.unshift(educationData);
    
    await profile.save();
    
    return response.success(res, 200, profile.education);
  } catch (error) {
    console.error('Add education error:', error);
    return response.error(res, 500, 'Failed to add education');
  }
};

/**
 * Update portfolio settings
 * @route PUT /profiles/:userId/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own profile
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }
    
    const preferencesData = req.body;
    
    // Find profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Update preferences
    Object.keys(preferencesData).forEach(key => {
      profile.preferences[key] = preferencesData[key];
    });
    
    await profile.save();
    
    return response.success(res, 200, profile.preferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    return response.error(res, 500, 'Failed to update preferences');
  }
}; 