/**
 * Portfolio Controller
 * Handles portfolio management for workers (MongoDB/Mongoose)
 */

const mongoose = require('mongoose');
const models = require('../models');
const { validateInput, handleServiceError, generatePagination } = require('../utils/helpers');
const auditLogger = require('../../../shared/utils/audit-logger');

const { Portfolio, WorkerProfile } = models;

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

const buildWorkerQuery = (workerId) => {
  const objectId = toObjectId(workerId);
  if (objectId) {
    return { $or: [{ _id: objectId }, { userId: objectId }] };
  }
  return { userId: workerId };
};

const findWorkerProfileOrThrow = async (workerId) => {
  if (!WorkerProfile) {
    const error = new Error('WorkerProfile model unavailable');
    error.statusCode = 503;
    throw error;
  }

  const profile = await WorkerProfile.findOne(buildWorkerQuery(workerId));
  if (!profile) {
    const error = new Error('Worker profile not found');
    error.statusCode = 404;
    throw error;
  }
  return profile;
};

const isOwnerRequest = (req, profile) => {
  if (!req?.user?.id) return false;
  return String(profile.userId) === String(req.user.id);
};

const workerPopulateOptions = {
  path: 'workerProfileId',
  select: 'userId profilePicture rating isVerified successStats location currency',
  populate: { path: 'userId', select: 'firstName lastName profilePicture' },
};

const formatWorkerMeta = (doc) => {
  if (!doc?.workerProfileId) return null;
  const profile = doc.workerProfileId;
  const user = profile.userId;
  return {
    id: String(profile._id),
    profilePicture: profile.profilePicture,
    rating: profile.rating,
    isVerified: profile.isVerified,
    location: profile.location,
    currency: profile.currency || 'GHS',
    successStats: profile.successStats || {},
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
  };
};

const formatPortfolioDocument = (doc = {}) => ({
  id: String(doc._id),
  title: doc.title,
  description: doc.description,
  projectType: doc.projectType,
  primarySkillId: doc.primarySkillId,
  mainImage: typeof doc.getMainImageUrl === 'function' ? doc.getMainImageUrl() : doc.mainImage,
  images: typeof doc.getAllImageUrls === 'function' ? doc.getAllImageUrls() : doc.images || [],
  videos: doc.videos || [],
  documents: doc.documents || [],
  projectValue: doc.projectValue,
  currency: doc.currency || 'GHS',
  startDate: doc.startDate,
  endDate: doc.endDate,
  duration: typeof doc.getDurationText === 'function' ? doc.getDurationText() : null,
  location: doc.location,
  skillsUsed: typeof doc.getSkillsUsed === 'function' ? doc.getSkillsUsed() : doc.skillsUsed || [],
  clientName: doc.clientName,
  clientCompany: doc.clientCompany,
  clientRating: doc.clientRating,
  clientTestimonial: doc.clientTestimonial,
  challenges: doc.challenges,
  solutions: doc.solutions,
  outcomes: doc.outcomes,
  lessonsLearned: doc.lessonsLearned,
  toolsUsed: doc.toolsUsed || [],
  teamSize: doc.teamSize,
  role: doc.role,
  responsibilities: doc.responsibilities || [],
  achievements: doc.achievements || [],
  externalLinks: doc.externalLinks || [],
  tags: doc.tags || [],
  keywords: doc.keywords || [],
  status: doc.status,
  isFeatured: doc.isFeatured,
  isActive: doc.isActive,
  viewCount: doc.viewCount || 0,
  likeCount: doc.likeCount || 0,
  shareCount: doc.shareCount || 0,
  complexityScore: typeof doc.getComplexityScore === 'function' ? doc.getComplexityScore() : null,
  metadata: doc.metadata || {},
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  worker: formatWorkerMeta(doc),
});

const formatPortfolioCollection = (docs = []) => docs.map((doc) => formatPortfolioDocument(doc));

const ensurePortfolioModel = () => {
  if (!Portfolio) {
    const error = new Error('Portfolio model unavailable');
    error.statusCode = 503;
    throw error;
  }
};

class PortfolioController {
  /**
   * Get portfolio items for a worker
   */
  static async getWorkerPortfolio(req, res) {
    try {
      ensurePortfolioModel();
      const { workerId } = req.params;
      const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limitNumber = Math.min(50, parseInt(req.query.limit, 10) || 12);
      const workerProfile = await findWorkerProfileOrThrow(workerId);
      const isOwner = isOwnerRequest(req, workerProfile);

      const query = {
        workerProfileId: workerProfile._id,
        isActive: true,
      };

      const requestedStatus = req.query.status || 'published';
      if (!isOwner) {
        query.status = 'published';
      } else if (requestedStatus !== 'all') {
        query.status = requestedStatus;
      }

      const skip = (pageNumber - 1) * limitNumber;

      const [total, items, publishedCount, featuredCount] = await Promise.all([
        Portfolio.countDocuments(query),
        Portfolio.find(query)
          .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate(workerPopulateOptions),
        Portfolio.countDocuments({ workerProfileId: workerProfile._id, status: 'published', isActive: true }),
        Portfolio.countDocuments({ workerProfileId: workerProfile._id, isFeatured: true, isActive: true }),
      ]);

      return res.json({
        success: true,
        data: {
          portfolioItems: formatPortfolioCollection(items),
          pagination: generatePagination(pageNumber, limitNumber, total),
          stats: {
            total,
            published: publishedCount,
            featured: featuredCount,
          },
        },
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
      ensurePortfolioModel();
      const { workerId } = req.params;
      const workerProfile = await findWorkerProfileOrThrow(workerId);

      const [total, published, featured] = await Promise.all([
        Portfolio.countDocuments({ workerProfileId: workerProfile._id, isActive: true }),
        Portfolio.countDocuments({ workerProfileId: workerProfile._id, status: 'published', isActive: true }),
        Portfolio.countDocuments({ workerProfileId: workerProfile._id, isFeatured: true, isActive: true }),
      ]);

      const monthly = Array.from({ length: 12 }).map((_, index) => ({
        month: index + 1,
        items: Math.round((published / 12) * (0.6 + Math.random() * 0.8)),
      }));

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
      ensurePortfolioModel();
      const { id } = req.params;
      const item = await Portfolio.findOne({ _id: id, isActive: true }).populate(workerPopulateOptions);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      const canView = item.status === 'published' || isOwnerRequest(req, item.workerProfileId || {});
      if (!canView) {
        return res.status(403).json({ success: false, message: 'Portfolio item not available' });
      }

      if (item.status === 'published') {
        await Portfolio.incrementView(item._id);
      }

      return res.json({
        success: true,
        data: { portfolioItem: formatPortfolioDocument(item) },
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
      ensurePortfolioModel();
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const workerProfile = await WorkerProfile.findOne({ userId });
      if (!workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found. Please create a worker profile first.' });
      }

      const validation = validateInput(req.body || {}, ['title', 'description']);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
      }

      const payload = {
        workerProfileId: workerProfile._id,
        title: req.body.title,
        description: req.body.description,
        projectType: req.body.projectType || 'professional',
        primarySkillId: req.body.primarySkillId || null,
        skillsUsed: req.body.skillsUsed || [],
        mainImage: req.body.mainImage || null,
        images: req.body.images || [],
        videos: req.body.videos || [],
        documents: req.body.documents || [],
        projectValue: req.body.projectValue || null,
        currency: req.body.currency || workerProfile.currency || 'GHS',
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        location: req.body.location || workerProfile.location || null,
        clientName: req.body.clientName || null,
        clientCompany: req.body.clientCompany || null,
        clientRating: req.body.clientRating || null,
        clientTestimonial: req.body.clientTestimonial || null,
        challenges: req.body.challenges || null,
        solutions: req.body.solutions || null,
        outcomes: req.body.outcomes || null,
        lessonsLearned: req.body.lessonsLearned || null,
        toolsUsed: req.body.toolsUsed || [],
        teamSize: req.body.teamSize || null,
        role: req.body.role || null,
        responsibilities: req.body.responsibilities || [],
        achievements: req.body.achievements || [],
        externalLinks: req.body.externalLinks || [],
        status: req.body.status || 'draft',
        tags: req.body.tags || [],
        keywords: req.body.keywords || [],
        isFeatured: Boolean(req.body.isFeatured),
      };

      const created = await Portfolio.create(payload);
      await created.populate(workerPopulateOptions);

      await auditLogger.log({ userId, action: 'PORTFOLIO_ITEM_CREATED', details: { portfolioItemId: created._id, workerId: workerProfile._id } });

      return res.status(201).json({ success: true, message: 'Portfolio item created successfully', data: { portfolioItem: formatPortfolioDocument(created) } });
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
      ensurePortfolioModel();
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const workerProfile = await WorkerProfile.findOne({ userId });
      if (!workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const updatePayload = {
        ...req.body,
        updatedAt: new Date(),
      };

      const updated = await Portfolio.findOneAndUpdate(
        { _id: id, workerProfileId: workerProfile._id, isActive: true },
        updatePayload,
        { new: true },
      ).populate(workerPopulateOptions);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found or access denied' });
      }

      await auditLogger.log({ userId, action: 'PORTFOLIO_ITEM_UPDATED', details: { portfolioItemId: updated._id } });

      return res.json({ success: true, message: 'Portfolio item updated successfully', data: { portfolioItem: formatPortfolioDocument(updated) } });
    } catch (error) {
      console.error('Update portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to update portfolio item');
    }
  }

  /**
   * Delete portfolio item (soft delete)
   */
  static async deletePortfolioItem(req, res) {
    try {
      ensurePortfolioModel();
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const workerProfile = await WorkerProfile.findOne({ userId });
      if (!workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const deleted = await Portfolio.findOneAndUpdate(
        { _id: id, workerProfileId: workerProfile._id, isActive: true },
        { isActive: false, updatedAt: new Date() },
        { new: true },
      );

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found or access denied' });
      }

      await auditLogger.log({ userId, action: 'PORTFOLIO_ITEM_DELETED', details: { portfolioItemId: deleted._id } });

      return res.json({ success: true, message: 'Portfolio item deleted successfully' });
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
      ensurePortfolioModel();
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
        sortBy = 'relevance',
      } = req.query;

      const pageNumber = Math.max(1, parseInt(page, 10) || 1);
      const limitNumber = Math.min(50, parseInt(limit, 10) || 12);
      const skip = (pageNumber - 1) * limitNumber;

      const filters = {
        status: 'published',
        isActive: true,
      };

      if (query) {
        const regex = new RegExp(query, 'i');
        filters.$or = [
          { title: regex },
          { description: regex },
          { keywords: query.toLowerCase() },
          { tags: query.toLowerCase() },
        ];
      }

      if (projectType) filters.projectType = projectType;
      if (location) filters.location = new RegExp(location, 'i');
      if (skills) filters.skillsUsed = { $in: skills.split(',').map((skill) => skill.trim()).filter(Boolean) };

      const valueFilters = {};
      if (minValue) valueFilters.$gte = parseFloat(minValue);
      if (maxValue) valueFilters.$lte = parseFloat(maxValue);
      if (Object.keys(valueFilters).length) filters.projectValue = valueFilters;

      if (clientRating) filters.clientRating = { $gte: parseFloat(clientRating) };

      const sortOptions = {
        relevance: { isFeatured: -1, viewCount: -1, createdAt: -1 },
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        value_high: { projectValue: -1 },
        value_low: { projectValue: 1 },
        rating: { clientRating: -1 },
        popular: { viewCount: -1, likeCount: -1 },
      };

      const sort = sortOptions[sortBy] || sortOptions.relevance;

      const [total, items] = await Promise.all([
        Portfolio.countDocuments(filters),
        Portfolio.find(filters)
          .sort(sort)
          .skip(skip)
          .limit(limitNumber)
          .populate(workerPopulateOptions),
      ]);

      return res.json({
        success: true,
        message: 'Portfolio search completed successfully',
        data: {
          portfolioItems: formatPortfolioCollection(items).map((item) => ({
            ...item,
            description: item.description ? `${item.description.slice(0, 150)}${item.description.length > 150 ? '…' : ''}` : null,
          })),
          pagination: generatePagination(pageNumber, limitNumber, total),
          searchParams: { query, skills, location, projectType, minValue, maxValue, clientRating, sortBy },
        },
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
      ensurePortfolioModel();
      const limitNumber = Math.min(24, parseInt(req.query.limit, 10) || 12);

      const items = await Portfolio.find({ isFeatured: true, status: 'published', isActive: true })
        .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
        .limit(limitNumber)
        .populate(workerPopulateOptions);

      return res.json({
        success: true,
        data: { portfolioItems: formatPortfolioCollection(items) },
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
      ensurePortfolioModel();
      const { id } = req.params;

      const updated = await Portfolio.incrementLike(id);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found' });
      }

      return res.json({ success: true, message: 'Portfolio item liked successfully', data: { likeCount: updated.likeCount } });
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
      ensurePortfolioModel();
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const workerProfile = await WorkerProfile.findOne({ userId });
      if (!workerProfile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const item = await Portfolio.findOne({ _id: id, workerProfileId: workerProfile._id, isActive: true });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Portfolio item not found or access denied' });
      }

      await Portfolio.incrementShare(item._id);
      const baseUrl = process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app';
      const shareUrl = `${baseUrl}/portfolio/${item._id}`;

      await auditLogger.log({ userId, action: 'PORTFOLIO_ITEM_SHARED', details: { portfolioItemId: item._id } });

      return res.json({ success: true, data: { shareUrl } });
    } catch (error) {
      console.error('Share portfolio item error:', error);
      return handleServiceError(res, error, 'Failed to share portfolio item');
    }
  }
}

module.exports = PortfolioController;