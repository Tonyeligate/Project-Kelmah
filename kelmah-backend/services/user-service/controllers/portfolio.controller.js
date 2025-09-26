/**
 * Portfolio Controller
 * Handles portfolio management for workers
 */

const { Portfolio, WorkerProfile, Skill, User } = require('../models');
const { validateInput, handleServiceError, generatePagination } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');

class PortfolioController {
  /**
   * Get portfolio items for a worker
   */
  static async getWorkerPortfolio(req, res) {
    try {
      const { workerId } = req.params;
      const { page = 1, limit = 12, status = 'published' } = req.query;
      const offset = (page - 1) * limit;

      // Verify worker exists
      const worker = await WorkerProfile.findOne({
        where: { 
          [Op.or]: [{ id: workerId }, { userId: workerId }],
          isActive: true 
        }
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
      }

      const whereClause = {
        workerProfileId: worker.id,
        isActive: true
      };

      // Filter by status for public viewing
      if (!req.user || req.user.id !== worker.userId) {
        whereClause.status = 'published';
      } else if (status !== 'all') {
        whereClause.status = status;
      }

      const { count, rows: portfolioItems } = await Portfolio.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Skill,
            as: 'primarySkill',
            attributes: ['name', 'category']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [
          ['isFeatured', 'DESC'],
          ['sortOrder', 'ASC'],
          ['createdAt', 'DESC']
        ]
      });

      const formattedItems = portfolioItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        projectType: item.projectType,
        mainImage: item.getMainImageUrl(),
        images: item.getAllImageUrls(),
        projectValue: item.projectValue,
        currency: item.currency,
        duration: item.getDurationText(),
        startDate: item.startDate,
        endDate: item.endDate,
        location: item.location,
        skillsUsed: item.getSkillsUsed(),
        clientRating: item.clientRating,
        status: item.status,
        isFeatured: item.isFeatured,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        complexityScore: item.getComplexityScore(),
        createdAt: item.createdAt
      }));

      res.status(200).json({
        success: true,
        message: 'Portfolio retrieved successfully',
        data: {
          portfolioItems: formattedItems,
          pagination: generatePagination(page, limit, count),
          stats: {
            total: count,
            published: await Portfolio.count({
              where: { workerProfileId: worker.id, status: 'published', isActive: true }
            }),
            featured: await Portfolio.count({
              where: { workerProfileId: worker.id, isFeatured: true, isActive: true }
            })
          }
        }
      });

    } catch (error) {
      console.error('Get portfolio error:', error);
      return handleServiceError(res, error, 'Failed to retrieve portfolio');
    }
  }

  /**
   * Portfolio stats for analytics panels
   */
  static async getPortfolioStats(req, res) {
    try {
      const { workerId } = req.params;
      const worker = await WorkerProfile.findOne({
        where: { [Op.or]: [{ id: workerId }, { userId: workerId }], isActive: true }
      });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Worker not found' });
      }
      const [total, published, featured] = await Promise.all([
        Portfolio.count({ where: { workerProfileId: worker.id, isActive: true } }),
        Portfolio.count({ where: { workerProfileId: worker.id, status: 'published', isActive: true } }),
        Portfolio.count({ where: { workerProfileId: worker.id, isFeatured: true, isActive: true } }),
      ]);
      // simple trend stub
      const monthly = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, items: Math.round((published / 12) * (0.6 + Math.random() * 0.8)) }));
      return res.json({ success: true, data: { total, published, featured, monthly } });
    } catch (error) {
      console.error('Get portfolio stats error:', error);
      return handleServiceError(res, error, 'Failed to get portfolio stats');
    }
  }

  /**
   * Get single portfolio item
   */
  static async getPortfolioItem(req, res) {
    try {
      const { id } = req.params;

      const item = await Portfolio.findOne({
        where: { id, isActive: true },
        include: [
          {
            model: WorkerProfile,
            as: 'workerProfile',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: Skill,
            as: 'primarySkill',
            attributes: ['name', 'category', 'description']
          }
        ]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found'
        });
      }

      // Check if user can view this item
      const canView = item.isVisible() || 
        (req.user && req.user.id === item.workerProfile.userId);

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Portfolio item not available'
        });
      }

      // Increment view count for published items
      if (item.status === 'published') {
        await Portfolio.incrementView(item.id);
      }

      const itemData = {
        id: item.id,
        title: item.title,
        description: item.description,
        projectType: item.projectType,
        primarySkill: item.primarySkill,
        skillsUsed: item.getSkillsUsed(),
        mainImage: item.getMainImageUrl(),
        images: item.getAllImageUrls(),
        videos: item.videos,
        documents: item.documents,
        projectValue: item.projectValue,
        currency: item.currency,
        startDate: item.startDate,
        endDate: item.endDate,
        duration: item.getDurationText(),
        location: item.location,
        client: {
          name: item.clientName,
          company: item.clientCompany,
          rating: item.clientRating,
          testimonial: item.clientTestimonial
        },
        projectDetails: {
          challenges: item.challenges,
          solutions: item.solutions,
          outcomes: item.outcomes,
          lessonsLearned: item.lessonsLearned
        },
        team: {
          size: item.teamSize,
          role: item.role,
          responsibilities: item.responsibilities
        },
        toolsUsed: item.toolsUsed,
        achievements: item.achievements,
        externalLinks: item.externalLinks,
        tags: item.tags,
        status: item.status,
        isFeatured: item.isFeatured,
        stats: {
          viewCount: item.viewCount,
          likeCount: item.likeCount,
          shareCount: item.shareCount
        },
        complexityScore: item.getComplexityScore(),
        worker: {
          id: item.workerProfile.id,
          name: `${item.workerProfile.user.firstName} ${item.workerProfile.user.lastName}`,
          profilePicture: item.workerProfile.profilePicture
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Portfolio item retrieved successfully',
        data: { portfolioItem: itemData }
      });

    } catch (error) {
      console.error('Get portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to retrieve portfolio item');
    }
  }

  /**
   * Create new portfolio item
   */
  static async createPortfolioItem(req, res) {
    try {
      const userId = req.user.id;
      const portfolioData = req.body;

      // Find worker profile
      const worker = await WorkerProfile.findOne({
        where: { userId, isActive: true }
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker profile not found. Please create a worker profile first.'
        });
      }

      // Validate required fields
      const validation = validateInput(portfolioData, ['title', 'description']);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Create portfolio item
      const item = await Portfolio.create({
        workerProfileId: worker.id,
        title: portfolioData.title,
        description: portfolioData.description,
        projectType: portfolioData.projectType || 'professional',
        primarySkillId: portfolioData.primarySkillId,
        skillsUsed: portfolioData.skillsUsed || [],
        mainImage: portfolioData.mainImage,
        images: portfolioData.images || [],
        videos: portfolioData.videos || [],
        documents: portfolioData.documents || [],
        projectValue: portfolioData.projectValue,
        currency: portfolioData.currency || 'GHS',
        startDate: portfolioData.startDate,
        endDate: portfolioData.endDate,
        location: portfolioData.location,
        clientName: portfolioData.clientName,
        clientCompany: portfolioData.clientCompany,
        clientRating: portfolioData.clientRating,
        clientTestimonial: portfolioData.clientTestimonial,
        challenges: portfolioData.challenges,
        solutions: portfolioData.solutions,
        outcomes: portfolioData.outcomes,
        lessonsLearned: portfolioData.lessonsLearned,
        toolsUsed: portfolioData.toolsUsed || [],
        teamSize: portfolioData.teamSize,
        role: portfolioData.role,
        responsibilities: portfolioData.responsibilities || [],
        achievements: portfolioData.achievements || [],
        externalLinks: portfolioData.externalLinks || [],
        status: portfolioData.status || 'draft',
        tags: portfolioData.tags || [],
        keywords: portfolioData.keywords || []
      });

      await auditLogger.log({
        userId,
        action: 'PORTFOLIO_ITEM_CREATED',
        details: { portfolioItemId: item.id, workerId: worker.id }
      });

      res.status(201).json({
        success: true,
        message: 'Portfolio item created successfully',
        data: { portfolioItem: item }
      });

    } catch (error) {
      console.error('Create portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to create portfolio item');
    }
  }

  /**
   * Update portfolio item
   */
  static async updatePortfolioItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Find portfolio item
      const item = await Portfolio.findOne({
        where: { id, isActive: true },
        include: [{
          model: WorkerProfile,
          as: 'workerProfile',
          where: { userId }
        }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found or access denied'
        });
      }

      // Update the item
      await item.update({
        title: updateData.title || item.title,
        description: updateData.description || item.description,
        projectType: updateData.projectType || item.projectType,
        primarySkillId: updateData.primarySkillId || item.primarySkillId,
        skillsUsed: updateData.skillsUsed || item.skillsUsed,
        mainImage: updateData.mainImage || item.mainImage,
        images: updateData.images || item.images,
        videos: updateData.videos || item.videos,
        documents: updateData.documents || item.documents,
        projectValue: updateData.projectValue !== undefined ? updateData.projectValue : item.projectValue,
        currency: updateData.currency || item.currency,
        startDate: updateData.startDate || item.startDate,
        endDate: updateData.endDate || item.endDate,
        location: updateData.location || item.location,
        clientName: updateData.clientName || item.clientName,
        clientCompany: updateData.clientCompany || item.clientCompany,
        clientRating: updateData.clientRating !== undefined ? updateData.clientRating : item.clientRating,
        clientTestimonial: updateData.clientTestimonial || item.clientTestimonial,
        challenges: updateData.challenges || item.challenges,
        solutions: updateData.solutions || item.solutions,
        outcomes: updateData.outcomes || item.outcomes,
        lessonsLearned: updateData.lessonsLearned || item.lessonsLearned,
        toolsUsed: updateData.toolsUsed || item.toolsUsed,
        teamSize: updateData.teamSize !== undefined ? updateData.teamSize : item.teamSize,
        role: updateData.role || item.role,
        responsibilities: updateData.responsibilities || item.responsibilities,
        achievements: updateData.achievements || item.achievements,
        externalLinks: updateData.externalLinks || item.externalLinks,
        status: updateData.status || item.status,
        isFeatured: updateData.isFeatured !== undefined ? updateData.isFeatured : item.isFeatured,
        tags: updateData.tags || item.tags,
        sortOrder: updateData.sortOrder !== undefined ? updateData.sortOrder : item.sortOrder
      });

      await auditLogger.log({
        userId,
        action: 'PORTFOLIO_ITEM_UPDATED',
        details: { portfolioItemId: item.id }
      });

      res.status(200).json({
        success: true,
        message: 'Portfolio item updated successfully',
        data: { portfolioItem: item }
      });

    } catch (error) {
      console.error('Update portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to update portfolio item');
    }
  }

  /**
   * Delete portfolio item
   */
  static async deletePortfolioItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find portfolio item
      const item = await Portfolio.findOne({
        where: { id, isActive: true },
        include: [{
          model: WorkerProfile,
          as: 'workerProfile',
          where: { userId }
        }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found or access denied'
        });
      }

      // Soft delete
      await item.update({ isActive: false });

      await auditLogger.log({
        userId,
        action: 'PORTFOLIO_ITEM_DELETED',
        details: { portfolioItemId: item.id }
      });

      res.status(200).json({
        success: true,
        message: 'Portfolio item deleted successfully'
      });

    } catch (error) {
      console.error('Delete portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to delete portfolio item');
    }
  }

  /**
   * Search portfolio items
   */
  static async searchPortfolio(req, res) {
    try {
      const {
        query = '',
        skills,
        location,
        projectType,
        minValue,
        maxValue,
        clientRating,
        page = 1,
        limit = 12,
        sortBy = 'relevance'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        status: 'published',
        isActive: true
      };

      // Text search
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { keywords: { [Op.contains]: [query.toLowerCase()] } },
          { tags: { [Op.contains]: [query.toLowerCase()] } }
        ];
      }

      // Filters
      if (projectType) {
        whereClause.projectType = projectType;
      }

      if (location) {
        whereClause.location = { [Op.iLike]: `%${location}%` };
      }

      if (minValue) {
        whereClause.projectValue = { [Op.gte]: parseFloat(minValue) };
      }

      if (maxValue) {
        whereClause.projectValue = {
          ...whereClause.projectValue,
          [Op.lte]: parseFloat(maxValue)
        };
      }

      if (clientRating) {
        whereClause.clientRating = { [Op.gte]: parseFloat(clientRating) };
      }

      if (skills) {
        whereClause.skillsUsed = {
          [Op.overlap]: skills.split(',')
        };
      }

      // Sort options
      let orderClause;
      switch (sortBy) {
        case 'newest':
          orderClause = [['createdAt', 'DESC']];
          break;
        case 'oldest':
          orderClause = [['createdAt', 'ASC']];
          break;
        case 'value_high':
          orderClause = [['projectValue', 'DESC']];
          break;
        case 'value_low':
          orderClause = [['projectValue', 'ASC']];
          break;
        case 'rating':
          orderClause = [['clientRating', 'DESC']];
          break;
        case 'popular':
          orderClause = [['viewCount', 'DESC'], ['likeCount', 'DESC']];
          break;
        default: // relevance
          orderClause = [
            ['isFeatured', 'DESC'],
            ['viewCount', 'DESC'],
            ['createdAt', 'DESC']
          ];
      }

      const { count, rows: portfolioItems } = await Portfolio.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: WorkerProfile,
            as: 'workerProfile',
            attributes: ['id', 'profilePicture', 'rating', 'isVerified'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: Skill,
            as: 'primarySkill',
            attributes: ['name', 'category']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: orderClause
      });

      const searchResults = portfolioItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description.substring(0, 150) + '...',
        projectType: item.projectType,
        mainImage: item.getMainImageUrl(),
        projectValue: item.projectValue,
        currency: item.currency,
        duration: item.getDurationText(),
        location: item.location,
        skillsUsed: item.getSkillsUsed(),
        clientRating: item.clientRating,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        complexityScore: item.getComplexityScore(),
        worker: {
          id: item.workerProfile.id,
          name: `${item.workerProfile.user.firstName} ${item.workerProfile.user.lastName}`,
          profilePicture: item.workerProfile.profilePicture,
          rating: item.workerProfile.rating,
          isVerified: item.workerProfile.isVerified
        },
        createdAt: item.createdAt
      }));

      res.status(200).json({
        success: true,
        message: 'Portfolio search completed successfully',
        data: {
          portfolioItems: searchResults,
          pagination: generatePagination(page, limit, count),
          searchParams: {
            query, skills, location, projectType, minValue, maxValue, clientRating, sortBy
          }
        }
      });

    } catch (error) {
      console.error('Search portfolio error:', error);
      return handleServiceError(res, error, 'Portfolio search failed');
    }
  }

  /**
   * Get featured portfolio items
   */
  static async getFeaturedPortfolio(req, res) {
    try {
      const { limit = 12 } = req.query;

      const portfolioItems = await Portfolio.findAll({
        where: {
          isFeatured: true,
          status: 'published',
          isActive: true
        },
        include: [
          {
            model: WorkerProfile,
            as: 'workerProfile',
            attributes: ['id', 'profilePicture', 'rating', 'isVerified'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }
        ],
        limit: parseInt(limit),
        order: [
          ['viewCount', 'DESC'],
          ['likeCount', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      const featuredItems = portfolioItems.map(item => ({
        id: item.id,
        title: item.title,
        mainImage: item.getMainImageUrl(),
        projectValue: item.projectValue,
        currency: item.currency,
        skillsUsed: item.getSkillsUsed().slice(0, 3),
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        worker: {
          name: `${item.workerProfile.user.firstName} ${item.workerProfile.user.lastName}`,
          profilePicture: item.workerProfile.profilePicture,
          rating: item.workerProfile.rating,
          isVerified: item.workerProfile.isVerified
        }
      }));

      res.status(200).json({
        success: true,
        message: 'Featured portfolio items retrieved successfully',
        data: { portfolioItems: featuredItems }
      });

    } catch (error) {
      console.error('Get featured portfolio error:', error);
      return handleServiceError(res, error, 'Failed to retrieve featured portfolio');
    }
  }

  /**
   * Like/unlike portfolio item
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Portfolio.findOne({
        where: { id, status: 'published', isActive: true }
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found'
        });
      }

      // This would typically involve a likes table to track who liked what
      // For now, just increment the counter
      await Portfolio.incrementLike(item.id);

      res.status(200).json({
        success: true,
        message: 'Portfolio item liked successfully',
        data: { likeCount: item.likeCount + 1 }
      });

    } catch (error) {
      console.error('Toggle like error:', error);
      return handleServiceError(res, error, 'Failed to update like status');
    }
  }

  /**
   * Share portfolio item (increments share count and returns a shareable link)
   */
  static async sharePortfolioItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await Portfolio.findOne({
        where: { id, isActive: true },
        include: [{
          model: WorkerProfile,
          as: 'workerProfile',
          where: { userId }
        }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio item not found or access denied'
        });
      }

      await Portfolio.incrementShare(item.id);
      const baseUrl = process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app';
      const shareUrl = `${baseUrl}/portfolio/${item.id}`;

      await auditLogger.log({
        userId,
        action: 'PORTFOLIO_ITEM_SHARED',
        details: { portfolioItemId: item.id }
      });

      return res.status(200).json({ success: true, data: { shareUrl } });
    } catch (error) {
      console.error('Share portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to share portfolio item');
    }
  }
}

module.exports = PortfolioController;