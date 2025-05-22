const { User, Profile } = require('../models');
const { logger } = require('../utils/logger');

const workerController = {
    // Get worker profile
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await Profile.findOne({
                where: { userId },
                include: [{
                    model: User,
                    attributes: ['username', 'email']
                }]
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            logger.error('Error fetching worker profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    },

    // Update worker profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                bio,
                skills,
                experience,
                education,
                certifications,
                hourlyRate,
                availability,
                location,
                languages,
                portfolio
            } = req.body;

            // Validate required fields
            if (!hourlyRate || !location) {
                return res.status(400).json({
                    success: false,
                    message: 'Hourly rate and location are required'
                });
            }

            // Update or create profile
            const [profile, created] = await Profile.findOrCreate({
                where: { userId },
                defaults: {
                    bio,
                    skills,
                    experience,
                    education,
                    certifications,
                    hourlyRate,
                    availability,
                    location,
                    languages,
                    portfolio
                }
            });

            if (!created) {
                await profile.update({
                    bio,
                    skills,
                    experience,
                    education,
                    certifications,
                    hourlyRate,
                    availability,
                    location,
                    languages,
                    portfolio
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: profile
            });
        } catch (error) {
            logger.error('Error updating worker profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    },

    // Get worker availability
    getAvailability: async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await Profile.findOne({
                where: { userId },
                attributes: ['availability']
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            res.json({
                success: true,
                data: profile.availability
            });
        } catch (error) {
            logger.error('Error fetching worker availability:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch availability'
            });
        }
    },

    // Update worker availability
    updateAvailability: async (req, res) => {
        try {
            const userId = req.user.id;
            const { availability } = req.body;

            // Validate availability format
            const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const isValidFormat = requiredDays.every(day => 
                availability[day] && 
                typeof availability[day].start === 'string' && 
                typeof availability[day].end === 'string'
            );

            if (!isValidFormat) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid availability format'
                });
            }

            const profile = await Profile.findOne({
                where: { userId }
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            await profile.update({ availability });

            res.json({
                success: true,
                message: 'Availability updated successfully',
                data: profile.availability
            });
        } catch (error) {
            logger.error('Error updating worker availability:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update availability'
            });
        }
    },

    // Get worker skills
    getSkills: async (req, res) => {
        try {
            const userId = req.user.id;
            const profile = await Profile.findOne({
                where: { userId },
                attributes: ['skills']
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            res.json({
                success: true,
                data: profile.skills
            });
        } catch (error) {
            logger.error('Error fetching worker skills:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch skills'
            });
        }
    },

    // Update worker skills
    updateSkills: async (req, res) => {
        try {
            const userId = req.user.id;
            const { skills } = req.body;

            if (!Array.isArray(skills)) {
                return res.status(400).json({
                    success: false,
                    message: 'Skills must be an array'
                });
            }

            const profile = await Profile.findOne({
                where: { userId }
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            await profile.update({ skills });

            res.json({
                success: true,
                message: 'Skills updated successfully',
                data: profile.skills
            });
        } catch (error) {
            logger.error('Error updating worker skills:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update skills'
            });
        }
    }
};

module.exports = workerController;