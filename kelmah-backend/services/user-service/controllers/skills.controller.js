const Skill = require('../models/skill.model');
const { Profile, ProfileSkill } = require('../models/profile.model');
const { response } = require('../../../shared');
const db = require('../config/database');

/**
 * Get all skills in the system
 * @route GET /skills
 * @access Public
 */
exports.getAllSkills = async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;
    let skills;

    if (search) {
      // Search for skills
      skills = await Skill.searchSkills(search);
    } else if (category) {
      // Get skills by category
      skills = await Skill.getSkillsByCategory(category);
    } else {
      // Get all skills
      skills = await Skill.findAll({
        where: { isActive: true },
        limit: parseInt(limit)
      });
    }

    return response.success(res, 200, skills);
  } catch (error) {
    console.error('Get skills error:', error);
    return response.error(res, 500, 'Failed to retrieve skills');
  }
};

/**
 * Get skills by category
 * @route GET /skills/categories/:category
 * @access Public
 */
exports.getSkillsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const skills = await Skill.getSkillsByCategory(category);
    return response.success(res, 200, skills);
  } catch (error) {
    console.error('Get skills by category error:', error);
    return response.error(res, 500, 'Failed to retrieve skills by category');
  }
};

/**
 * Get popular skills
 * @route GET /skills/popular
 * @access Public
 */
exports.getPopularSkills = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const skills = await Skill.getPopularSkills(parseInt(limit));
    return response.success(res, 200, skills);
  } catch (error) {
    console.error('Get popular skills error:', error);
    return response.error(res, 500, 'Failed to retrieve popular skills');
  }
};

/**
 * Create a new skill (admin only)
 * @route POST /skills
 * @access Private (Admin)
 */
exports.createSkill = async (req, res) => {
  try {
    const { name, category, description, aliases, relatedSkills } = req.body;
    
    // Validate required fields
    if (!name || !category) {
      return response.error(res, 400, 'Skill name and category are required');
    }
    
    // Check if skill already exists
    const existingSkill = await Skill.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingSkill) {
      return response.error(res, 400, 'Skill already exists');
    }
    
    // Create new skill
    const skill = new Skill({
      name,
      category,
      description,
      aliases,
      relatedSkills
    });
    
    await skill.save();
    
    return response.success(res, 201, skill, 'Skill created successfully');
  } catch (error) {
    console.error('Create skill error:', error);
    return response.error(res, 500, 'Failed to create skill');
  }
};

/**
 * Get a skill by ID
 * @route GET /skills/:skillId
 * @access Public
 */
exports.getSkillById = async (req, res) => {
  try {
    const { skillId } = req.params;
    
    // Validate skillId format
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return response.error(res, 400, 'Invalid skill ID format');
    }
    
    const skill = await Skill.findById(skillId)
      .populate('relatedSkills', 'name category');
    
    if (!skill) {
      return response.error(res, 404, 'Skill not found');
    }
    
    return response.success(res, 200, skill);
  } catch (error) {
    console.error('Get skill error:', error);
    return response.error(res, 500, 'Failed to get skill');
  }
};

/**
 * Update a skill (admin only)
 * @route PUT /skills/:skillId
 * @access Private (Admin)
 */
exports.updateSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const updates = req.body;
    
    // Validate skillId format
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return response.error(res, 400, 'Invalid skill ID format');
    }
    
    // Check for authorization
    if (req.user.role !== 'admin') {
      return response.error(res, 403, 'Unauthorized to update skills');
    }
    
    const skill = await Skill.findByIdAndUpdate(
      skillId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!skill) {
      return response.error(res, 404, 'Skill not found');
    }
    
    return response.success(res, 200, skill, 'Skill updated successfully');
  } catch (error) {
    console.error('Update skill error:', error);
    return response.error(res, 500, 'Failed to update skill');
  }
};

/**
 * Delete a skill (admin only)
 * @route DELETE /skills/:skillId
 * @access Private (Admin)
 */
exports.deleteSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    
    // Validate skillId format
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return response.error(res, 400, 'Invalid skill ID format');
    }
    
    // Check for authorization
    if (req.user.role !== 'admin') {
      return response.error(res, 403, 'Unauthorized to delete skills');
    }
    
    const skill = await Skill.findByIdAndDelete(skillId);
    
    if (!skill) {
      return response.error(res, 404, 'Skill not found');
    }
    
    // Also remove this skill from related skills in other skill documents
    await Skill.updateMany(
      { relatedSkills: skillId },
      { $pull: { relatedSkills: skillId } }
    );
    
    // Also update user profiles that have this skill
    await Profile.updateMany(
      { 'skills.name': skill.name },
      { $pull: { skills: { name: skill.name } } }
    );
    
    return response.success(res, 200, null, 'Skill deleted successfully');
  } catch (error) {
    console.error('Delete skill error:', error);
    return response.error(res, 500, 'Failed to delete skill');
  }
};

/**
 * Add skills to a user profile
 * @route POST /profiles/:userId/skills
 * @access Private
 */
exports.addUserSkills = async (req, res) => {
  try {
    const { userId } = req.params;
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
      return response.error(res, 400, 'Skills must be provided as an array');
    }

    // Find the profile
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }

    // Check if the authenticated user matches the profile user
    if (req.user.id !== userId) {
      return response.error(res, 403, 'Not authorized to modify this profile');
    }

    // Process skills
    const addedSkills = [];
    const transaction = await db.sequelize.transaction();

    try {
      for (const skillData of skills) {
        // Find or create the skill
        let skill;
        if (typeof skillData === 'string') {
          // If just a string, search by name
          skill = await Skill.findOne({ 
            where: db.sequelize.where(
              db.sequelize.fn('LOWER', db.sequelize.col('name')), 
              db.sequelize.fn('LOWER', skillData)
            ),
            transaction
          });
          
          if (!skill) {
            // Create a basic skill if it doesn't exist
            skill = await Skill.create({
              name: skillData,
              category: 'Other'
            }, { transaction });
          }
        } else {
          // If an object with more data
          skill = await Skill.findOrCreate({
            where: db.sequelize.where(
              db.sequelize.fn('LOWER', db.sequelize.col('name')), 
              db.sequelize.fn('LOWER', skillData.name)
            ),
            defaults: {
              name: skillData.name,
              category: skillData.category || 'Other',
              description: skillData.description || ''
            },
            transaction
          });
          
          // .findOrCreate returns an array [instance, created]
          skill = skill[0];
        }

        // Add association if it doesn't already exist
        const [profileSkill, created] = await ProfileSkill.findOrCreate({
          where: {
            profileId: profile.id,
            skillId: skill.id
          },
          defaults: {
            level: skillData.level || 'Intermediate',
            yearsOfExperience: skillData.yearsOfExperience || 1
          },
          transaction
        });

        // If it exists, update it
        if (!created && typeof skillData === 'object') {
          await profileSkill.update({
            level: skillData.level || profileSkill.level,
            yearsOfExperience: skillData.yearsOfExperience || profileSkill.yearsOfExperience
          }, { transaction });
        }

        // Increment skill popularity
        await skill.increment('popularity', { transaction });
        
        addedSkills.push(skill);
      }

      await transaction.commit();
      return response.success(res, 200, addedSkills);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Add skills error:', error);
    return response.error(res, 500, 'Failed to add skills to profile');
  }
};

/**
 * Remove a skill from user profile
 * @route DELETE /profiles/:userId/skills/:skillName
 * @access Private
 */
exports.removeUserSkill = async (req, res) => {
  try {
    const { userId, skillName } = req.params;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.error(res, 400, 'Invalid user ID format');
    }
    
    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return response.error(res, 403, 'Unauthorized to update this profile');
    }
    
    // Update the profile
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $pull: { skills: { name: skillName } } },
      { new: true }
    ).select('skills');
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    return response.success(
      res, 
      200, 
      profile.skills,
      'Skill removed successfully'
    );
  } catch (error) {
    console.error('Remove skill error:', error);
    return response.error(res, 500, 'Failed to remove skill');
  }
};

/**
 * Update a user skill
 * @route PUT /profiles/:userId/skills/:skillName
 * @access Private
 */
exports.updateUserSkill = async (req, res) => {
  try {
    const { userId, skillName } = req.params;
    const { level, yearsOfExperience } = req.body;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.error(res, 400, 'Invalid user ID format');
    }
    
    // Check authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return response.error(res, 403, 'Unauthorized to update this profile');
    }
    
    // Find the profile
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return response.error(res, 404, 'Profile not found');
    }
    
    // Find the skill to update
    const skillIndex = profile.skills.findIndex(
      skill => skill.name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (skillIndex === -1) {
      return response.error(res, 404, `Skill "${skillName}" not found in profile`);
    }
    
    // Update the skill
    if (level) profile.skills[skillIndex].level = level;
    if (yearsOfExperience !== undefined) profile.skills[skillIndex].yearsOfExperience = yearsOfExperience;
    
    await profile.save();
    
    return response.success(
      res, 
      200, 
      profile.skills,
      'Skill updated successfully'
    );
  } catch (error) {
    console.error('Update skill error:', error);
    return response.error(res, 500, 'Failed to update skill');
  }
}; 