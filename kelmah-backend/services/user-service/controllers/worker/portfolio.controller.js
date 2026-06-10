const models = require('../../models');
const Portfolio = models.Portfolio;
const WorkerProfile = models.WorkerProfile;
const { handleServiceError } = require('../../utils/helpers');

module.exports = {
  list: async (req, res) => {
    try {
      const { workerId } = req.params;
      if (!Portfolio) {
        return res.status(503).json({ success: false, message: 'Portfolio model unavailable' });
      }

      const profile = await WorkerProfile.findOne({ userId: workerId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const filter = {
        workerProfileId: profile._id,
        isActive: true,
      };

      if (!req.isGatewayAuthenticated) {
        filter.status = 'published';
      }

      const items = await Portfolio.find(filter).sort({ isFeatured: -1, createdAt: -1 });
      return res.json({
        success: true,
        data: {
          portfolioItems: items.map((item) => ({
            id: item._id,
            title: item.title,
            description: item.description,
            projectType: item.projectType,
            mainImage: item.getMainImageUrl(),
            images: item.getAllImageUrls(),
            projectValue: item.projectValue,
            currency: item.currency,
            duration: item.getDurationText(),
            location: item.location,
            clientRating: item.clientRating,
            status: item.status,
            isFeatured: item.isFeatured,
            viewCount: item.viewCount,
            likeCount: item.likeCount,
            complexityScore: item.getComplexityScore(),
            createdAt: item.createdAt,
          })),
          stats: {
            total: items.length,
            published: items.filter((item) => item.status === 'published').length,
            featured: items.filter((item) => item.isFeatured).length,
          },
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load portfolio');
    }
  },
};
