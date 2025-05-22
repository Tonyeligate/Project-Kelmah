/**
 * Review Model
 * Defines the structure and behavior of reviews in the Kelmah platform
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Jobs',
      key: 'id'
    }
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewerType: {
    type: DataTypes.ENUM('worker', 'hirer'),
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Rating must be at most 5'
      }
    }
  },
  communication: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Communication rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Communication rating must be at most 5'
      }
    }
  },
  skillMatch: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Skill match rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Skill match rating must be at most 5'
      }
    }
  },
  timeliness: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Timeliness rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Timeliness rating must be at most 5'
      }
    }
  },
  quality: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Quality rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Quality rating must be at most 5'
      }
    }
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Value rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Value rating must be at most 5'
      }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Review comment is required'
      },
      len: {
        args: [10, 1000],
        msg: 'Review comment must be between 10 and 1000 characters'
      }
    }
  },
  privateComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'published', 'flagged', 'removed'),
    defaultValue: 'published',
    allowNull: false
  },
  responseComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flagReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reviews',
  timestamps: true, // createdAt and updatedAt
  paranoid: true, // Soft deletes (deletedAt)
  indexes: [
    {
      name: 'reviews_job_id_idx',
      fields: ['jobId']
    },
    {
      name: 'reviews_reviewer_id_idx',
      fields: ['reviewerId']
    },
    {
      name: 'reviews_recipient_id_idx',
      fields: ['recipientId']
    },
    {
      name: 'reviews_rating_idx',
      fields: ['rating']
    }
  ]
});

/**
 * Class methods
 */

// Find reviews by job ID
Review.findByJobId = async (jobId) => {
  return await Review.findAll({
    where: { jobId, status: 'published' },
    order: [['createdAt', 'DESC']]
  });
};

// Find reviews for a recipient
Review.findByRecipientId = async (recipientId) => {
  return await Review.findAll({
    where: { recipientId, status: 'published' },
    order: [['createdAt', 'DESC']]
  });
};

// Calculate average rating for a user
Review.calculateAverageRating = async (userId) => {
  const result = await Review.findAll({
    where: { recipientId: userId, status: 'published' },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    raw: true
  });

  return {
    averageRating: parseFloat(result[0].averageRating) || 0,
    count: parseInt(result[0].count) || 0
  };
};

// Calculate detailed ratings for a user
Review.calculateDetailedRatings = async (userId) => {
  const reviews = await Review.findAll({
    where: { recipientId: userId, status: 'published' },
    attributes: ['communication', 'skillMatch', 'timeliness', 'quality', 'value'],
    raw: true
  });

  // Initial values
  const ratings = {
    communication: 0,
    skillMatch: 0,
    timeliness: 0,
    quality: 0,
    value: 0
  };

  if (reviews.length === 0) {
    return ratings;
  }

  // Calculate sum of each category
  reviews.forEach(review => {
    if (review.communication) ratings.communication += review.communication;
    if (review.skillMatch) ratings.skillMatch += review.skillMatch;
    if (review.timeliness) ratings.timeliness += review.timeliness;
    if (review.quality) ratings.quality += review.quality;
    if (review.value) ratings.value += review.value;
  });

  // Calculate averages
  Object.keys(ratings).forEach(key => {
    const validReviews = reviews.filter(r => r[key] !== null && r[key] !== undefined).length;
    ratings[key] = validReviews > 0 ? parseFloat((ratings[key] / validReviews).toFixed(1)) : 0;
  });

  return ratings;
};

/**
 * Instance methods
 */

// Update review status
Review.prototype.updateStatus = async function(status, reason = null) {
  this.status = status;
  if (status === 'flagged' && reason) {
    this.flagReason = reason;
  }
  return await this.save();
};

// Add response to review
Review.prototype.addResponse = async function(responseComment) {
  this.responseComment = responseComment;
  this.responseDate = new Date();
  return await this.save();
};

// Increment helpful count
Review.prototype.incrementHelpfulCount = async function() {
  this.helpfulCount += 1;
  return await this.save();
};

module.exports = Review; 