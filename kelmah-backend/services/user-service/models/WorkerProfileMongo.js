/**
 * WorkerProfile Model - MongoDB/Mongoose (User Service)
 * Replaces Sequelize version for dashboard functionality
 */

const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: {
        type: String,
        maxlength: [2000, 'Bio cannot exceed 2000 characters'],
        trim: true
    },
    hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative'],
        max: [10000, 'Hourly rate cannot exceed 10000']
    },
    hourlyRateMin: {
        type: Number,
        min: [0, 'Minimum hourly rate cannot be negative']
    },
    hourlyRateMax: {
        type: Number,
        min: [0, 'Maximum hourly rate cannot be negative']
    },
    currency: {
        type: String,
        default: 'GHS',
        maxlength: 3
    },
    location: {
        type: String,
        maxlength: 255,
        trim: true
    },
    latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
    },
    serviceRadius: {
        type: Number,
        min: [1, 'Service radius must be at least 1 km'],
        max: [500, 'Service radius cannot exceed 500 km'],
        comment: 'Service radius in kilometers'
    },
    availabilityStatus: {
        type: String,
        enum: ['available', 'busy', 'unavailable', 'vacation'],
        default: 'available'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    availableHours: {
        type: Map,
        of: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '17:00' },
            available: { type: Boolean, default: true }
        },
        default: () => new Map([
            ['monday', { start: '09:00', end: '17:00', available: true }],
            ['tuesday', { start: '09:00', end: '17:00', available: true }],
            ['wednesday', { start: '09:00', end: '17:00', available: true }],
            ['thursday', { start: '09:00', end: '17:00', available: true }],
            ['friday', { start: '09:00', end: '17:00', available: true }],
            ['saturday', { start: '09:00', end: '13:00', available: false }],
            ['sunday', { start: '09:00', end: '13:00', available: false }]
        ])
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: {
        type: Number,
        min: [0, 'Years of experience cannot be negative'],
        max: [50, 'Years of experience cannot exceed 50']
    },
    skills: [{
        type: String,
        trim: true
    }],
    specializations: [{
        type: String,
        trim: true
    }],
    languages: {
        type: [String],
        default: ['English']
    },
    skillEntries: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId()
            },
            name: {
                type: String,
                trim: true,
                minlength: 1,
                maxlength: 120,
                required: true
            },
            level: {
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                default: 'Intermediate'
            },
            category: {
                type: String,
                trim: true,
                maxlength: 100
            },
            yearsOfExperience: {
                type: Number,
                min: 0,
                max: 50
            },
            verified: {
                type: Boolean,
                default: false
            },
            description: {
                type: String,
                maxlength: 500
            },
            source: {
                type: String,
                default: 'worker-profile'
            },
            lastUsedAt: Date,
            evidenceUrl: {
                type: String,
                trim: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    rating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },
    totalJobs: {
        type: Number,
        default: 0,
        min: 0
    },
    totalJobsCompleted: {
        type: Number,
        default: 0,
        min: 0
    },
    completedJobs: {
        type: Number,
        default: 0,
        min: 0
    },
    totalJobsStarted: {
        type: Number,
        default: 0,
        min: 0
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0,
        min: 0,
        comment: 'Average response time in minutes'
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        comment: 'Completion rate percentage'
    },
    responseRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        comment: 'Response rate percentage'
    },
    profileViews: {
        type: Number,
        default: 0,
        min: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationLevel: {
        type: String,
        enum: ['none', 'basic', 'enhanced', 'premium'],
        default: 'none'
    },
    backgroundCheckStatus: {
        type: String,
        enum: ['not_required', 'pending', 'approved', 'rejected'],
        default: 'not_required'
    },
    profileCompleteness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    onlineStatus: {
        type: String,
        enum: ['online', 'away', 'offline'],
        default: 'offline'
    },
    preferredJobTypes: [{
        type: String,
        trim: true
    }],
    workingHoursPreference: {
        type: String,
        enum: ['flexible', 'business_hours', 'evenings_weekends', 'nights']
    },
    travelWillingness: {
        type: String,
        enum: ['none', 'local', 'regional', 'national']
    },
    emergencyAvailable: {
        type: Boolean,
        default: false
    },
    skillHistory: {
        type: Array,
        default: []
    },
    successStats: {
        jobsCompleted: {
            type: Number,
            default: 0
        },
        jobsInProgress: {
            type: Number,
            default: 0
        },
        rehireRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        averageJobValue: {
            type: Number,
            default: 0
        }
    },
    portfolioItems: [{
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        images: [String],
        completedAt: Date,
        client: String,
        skills: [String]
    }],
    certifications: [{
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        verificationUrl: String
    }],
    workHistoryStats: {
        totalEntries: {
            type: Number,
            default: 0
        },
        industries: {
            type: [String],
            default: []
        },
        averageTenureMonths: {
            type: Number,
            default: 0
        }
    },
    workHistory: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId()
            },
            role: {
                type: String,
                trim: true,
                maxlength: 120,
                required: true
            },
            company: {
                type: String,
                trim: true,
                maxlength: 160
            },
            employmentType: {
                type: String,
                enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary'],
                default: 'contract'
            },
            location: {
                type: String,
                trim: true,
                maxlength: 160
            },
            startDate: Date,
            endDate: Date,
            isCurrent: {
                type: Boolean,
                default: false
            },
            description: {
                type: String,
                maxlength: 2000
            },
            highlights: {
                type: [String],
                default: []
            },
            clientsServed: {
                type: [String],
                default: []
            },
            technologies: {
                type: [String],
                default: []
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    insuranceInfo: {
        hasInsurance: { type: Boolean, default: false },
        provider: String,
        policyNumber: String,
        expiryDate: Date,
        coverage: Number
    },
    businessInfo: {
        businessName: String,
        businessType: {
            type: String,
            enum: ['individual', 'partnership', 'company']
        },
        registrationNumber: String,
        taxId: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
workerProfileSchema.index({ rating: -1, totalJobs: -1 });
workerProfileSchema.index({ isAvailable: 1, rating: -1 });
workerProfileSchema.index({ location: 1, isAvailable: 1 });
workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ lastActiveAt: -1 });

// Virtual for user relationship
workerProfileSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Methods
workerProfileSchema.methods.getAverageRating = function () {
    return this.rating || 0;
};

workerProfileSchema.methods.getCompletionRate = function () {
    if (this.totalJobsStarted === 0) return 0;
    return Math.round((this.totalJobsCompleted / this.totalJobsStarted) * 100);
};

workerProfileSchema.methods.getResponseRate = function () {
    if (this.totalMessagesReceived === 0) return 0;
    return Math.round((this.totalMessagesResponded / this.totalMessagesReceived) * 100);
};

workerProfileSchema.methods.isAvailableForWork = function () {
    return this.isAvailable &&
        this.availabilityStatus === 'available' &&
        !this.suspendedUntil ||
        this.suspendedUntil < new Date();
};

workerProfileSchema.methods.calculateProfileCompleteness = function () {
    const requiredFields = ['bio', 'hourlyRate', 'location', 'skills', 'experienceLevel'];
    let completedFields = 0;

    if (this.bio && this.bio.trim().length > 0) completedFields++;
    if (this.hourlyRate > 0) completedFields++;
    if (this.location && this.location.trim().length > 0) completedFields++;
    if (this.skills && this.skills.length > 0) completedFields++;
    if (this.experienceLevel) completedFields++;

    return Math.round((completedFields / requiredFields.length) * 100);
};

// Update profile completeness before saving
workerProfileSchema.pre('save', function (next) {
    this.profileCompleteness = this.calculateProfileCompleteness();
    next();
});

// Static methods for dashboard queries
workerProfileSchema.statics.getDashboardStats = async function () {
    const [totalWorkers, availableWorkers, activeWorkers] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ isAvailable: true }),
        this.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    return {
        totalWorkers,
        availableWorkers,
        activeWorkers,
        utilizationRate: totalWorkers > 0 ? Math.round((availableWorkers / totalWorkers) * 100) : 0
    };
};

workerProfileSchema.statics.getTopWorkers = async function (limit = 10) {
    return this.find({ isAvailable: true })
        .populate('userId', 'firstName lastName profilePicture')
        .select('skills hourlyRate rating totalJobs completedJobs')
        .sort({ rating: -1, totalJobs: -1 })
        .limit(limit)
        .lean();
};

// Use mongoose.connection.model() to ensure model uses the active connection
module.exports = mongoose.connection.models.WorkerProfile || mongoose.connection.model('WorkerProfile', workerProfileSchema);
