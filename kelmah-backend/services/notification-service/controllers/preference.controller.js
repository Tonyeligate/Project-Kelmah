/**
 * Notification Preferences Controller
 * Handles API requests for managing notification preferences
 */

const NotificationPreference = require('../models/notification-preference.model');
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } = require('../constants');
const logger = require('../../../utils/logger');

/**
 * Get user's notification preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create preferences for user
    const preferences = await NotificationPreference.getForUser(userId);
    
    return res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error(`Error getting notification preferences: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
};

/**
 * Update user's notification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { channels, types, quietHours, weeklyDigest } = req.body;
    
    // Get existing preferences
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    // Create if doesn't exist
    if (!preferences) {
      preferences = new NotificationPreference({ user: userId });
    }
    
    // Update channel preferences
    if (channels) {
      // Validate channels
      for (const channel in channels) {
        if (!Object.values(NOTIFICATION_CHANNELS).includes(channel)) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification channel: ${channel}`
          });
        }
        
        if (typeof channels[channel] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `Channel preference must be a boolean value`
          });
        }
      }
      
      // Update channels
      for (const channel in channels) {
        preferences.channels.set(channel, channels[channel]);
      }
    }
    
    // Update type preferences
    if (types) {
      // Validate types
      for (const type in types) {
        if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid notification type: ${type}`
          });
        }
        
        if (typeof types[type] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `Type preference must be a boolean value`
          });
        }
      }
      
      // Update types
      for (const type in types) {
        preferences.types.set(type, types[type]);
      }
    }
    
    // Update quiet hours settings
    if (quietHours) {
      if (quietHours.enabled !== undefined) {
        preferences.quietHours.enabled = !!quietHours.enabled;
      }
      
      if (quietHours.start) {
        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHours.start)) {
          return res.status(400).json({
            success: false,
            message: `Invalid start time format. Use HH:MM (24-hour format)`
          });
        }
        preferences.quietHours.start = quietHours.start;
      }
      
      if (quietHours.end) {
        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHours.end)) {
          return res.status(400).json({
            success: false,
            message: `Invalid end time format. Use HH:MM (24-hour format)`
          });
        }
        preferences.quietHours.end = quietHours.end;
      }
      
      if (quietHours.timezone) {
        // Validate timezone
        try {
          Intl.DateTimeFormat('en-US', { timeZone: quietHours.timezone });
          preferences.quietHours.timezone = quietHours.timezone;
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: `Invalid timezone: ${quietHours.timezone}`
          });
        }
      }
      
      if (quietHours.excludeUrgent !== undefined) {
        preferences.quietHours.excludeUrgent = !!quietHours.excludeUrgent;
      }
    }
    
    // Update weekly digest settings
    if (weeklyDigest) {
      if (weeklyDigest.enabled !== undefined) {
        preferences.weeklyDigest.enabled = !!weeklyDigest.enabled;
      }
      
      if (weeklyDigest.day) {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(weeklyDigest.day)) {
          return res.status(400).json({
            success: false,
            message: `Invalid day for weekly digest. Must be one of: ${validDays.join(', ')}`
          });
        }
        preferences.weeklyDigest.day = weeklyDigest.day;
      }
      
      if (weeklyDigest.time) {
        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(weeklyDigest.time)) {
          return res.status(400).json({
            success: false,
            message: `Invalid time format for weekly digest. Use HH:MM (24-hour format)`
          });
        }
        preferences.weeklyDigest.time = weeklyDigest.time;
      }
    }
    
    // Save updated preferences
    await preferences.save();
    
    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error(`Error updating notification preferences: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * Reset user's notification preferences to default
 */
exports.resetPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find and delete existing preferences
    await NotificationPreference.findOneAndDelete({ user: userId });
    
    // Create new preferences with defaults
    const preferences = await NotificationPreference.create({ user: userId });
    
    return res.status(200).json({
      success: true,
      message: 'Notification preferences reset to defaults',
      data: preferences
    });
  } catch (error) {
    logger.error(`Error resetting notification preferences: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      error: error.message
    });
  }
};

/**
 * Disable all notifications for a user
 */
exports.disableAll = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get existing preferences
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    // Create if doesn't exist
    if (!preferences) {
      preferences = new NotificationPreference({ user: userId });
    }
    
    // Disable all channels except IN_APP
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      preferences.channels.set(channel, channel === NOTIFICATION_CHANNELS.IN_APP);
    }
    
    // Save updated preferences
    await preferences.save();
    
    return res.status(200).json({
      success: true,
      message: 'All notifications disabled except in-app notifications',
      data: preferences
    });
  } catch (error) {
    logger.error(`Error disabling all notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable notifications',
      error: error.message
    });
  }
};

/**
 * Enable all notifications for a user
 */
exports.enableAll = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get existing preferences
    let preferences = await NotificationPreference.findOne({ user: userId });
    
    // Create if doesn't exist
    if (!preferences) {
      preferences = new NotificationPreference({ user: userId });
    }
    
    // Enable all channels
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      preferences.channels.set(channel, true);
    }
    
    // Enable all types
    for (const type of Object.values(NOTIFICATION_TYPES)) {
      preferences.types.set(type, true);
    }
    
    // Save updated preferences
    await preferences.save();
    
    return res.status(200).json({
      success: true,
      message: 'All notifications enabled',
      data: preferences
    });
  } catch (error) {
    logger.error(`Error enabling all notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to enable notifications',
      error: error.message
    });
  }
};