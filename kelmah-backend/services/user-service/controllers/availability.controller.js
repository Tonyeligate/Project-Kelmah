const Profile = require('../models/profile.model');
const { response } = require('../../../shared');
const mongoose = require('mongoose');

/**
 * Get user availability
 * @route GET /profiles/:userId/availability
 * @access Public
 */
exports.getUserAvailability = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.error(res, 400, 'Invalid user ID format');
    }

    const profile = await Profile.findOne({ userId })
      .select('availability preferences.visibility')
      .lean();

    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }

    // Check if profile is private and requester is not the owner
    if (profile.preferences?.visibility === 'private' && req.user?.id !== userId) {
      return response.error(res, 403, 'This profile is private');
    }

    return response.success(res, 200, profile.availability || []);
  } catch (error) {
    console.error('Get availability error:', error);
    return response.error(res, 500, 'Failed to get availability');
  }
};

/**
 * Update user availability
 * @route PUT /profiles/:userId/availability
 * @access Private
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { availability } = req.body;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.error(res, 400, 'Invalid user ID format');
    }

    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return response.error(res, 403, 'Unauthorized to update this profile');
    }

    // Validate availability format
    if (!Array.isArray(availability)) {
      return response.error(res, 400, 'Availability must be an array');
    }

    // Validate each availability entry
    for (const slot of availability) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return response.error(res, 400, 'Each availability slot must have day, startTime, and endTime');
      }

      // Validate day of week
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(slot.day.toLowerCase())) {
        return response.error(res, 400, `Invalid day: ${slot.day}. Must be one of: ${validDays.join(', ')}`);
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return response.error(res, 400, 'Time must be in format HH:MM (24-hour)');
      }

      // Ensure end time is after start time
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        return response.error(res, 400, `End time must be after start time for ${slot.day}`);
      }
    }

    // Update the profile
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { availability },
      { new: true, runValidators: true }
    ).select('availability');

    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }

    return response.success(
      res, 
      200, 
      profile.availability,
      'Availability updated successfully'
    );
  } catch (error) {
    console.error('Update availability error:', error);
    return response.error(res, 500, 'Failed to update availability');
  }
};

/**
 * Find available workers
 * @route GET /availability/search
 * @access Public
 */
exports.findAvailableWorkers = async (req, res) => {
  try {
    const { day, startTime, endTime, skills, location, distance = 50 } = req.query;
    
    // Validate required params
    if (!day || !startTime || !endTime) {
      return response.error(res, 400, 'Day, start time, and end time are required');
    }
    
    // Validate day of week
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
      return response.error(res, 400, `Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`);
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return response.error(res, 400, 'Time must be in format HH:MM (24-hour)');
    }
    
    // Build the query
    let query = {
      isActive: true,
      'preferences.visibility': { $ne: 'private' },
      availability: {
        $elemMatch: {
          day: new RegExp(day, 'i'),
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
          status: 'available'
        }
      }
    };
    
    // Add skills filter if provided
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query['skills.name'] = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }
    
    // Add location filter if provided
    if (location) {
      // Parse coordinates from query
      const [longitude, latitude] = location.split(',').map(Number);
      
      if (!isNaN(longitude) && !isNaN(latitude)) {
        query['address.location'] = {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: Number(distance) * 1609.34 // Convert miles to meters
          }
        };
      }
    }
    
    // Execute the query
    const workers = await Profile.find(query)
      .select('userId headline bio skills hourlyRate profilePicture availability')
      .limit(20);
    
    return response.success(res, 200, workers);
  } catch (error) {
    console.error('Find available workers error:', error);
    return response.error(res, 500, 'Failed to find available workers');
  }
}; 