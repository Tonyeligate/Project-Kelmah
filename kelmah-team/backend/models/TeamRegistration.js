const mongoose = require('mongoose');

const TeamRegistrationSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },

  // Technical Background
  currentStatus: {
    type: String,
    required: true,
    enum: [
      'student',
      'recent-graduate', 
      'employed-tech',
      'employed-non-tech',
      'unemployed',
      'freelancer',
      'entrepreneur',
      'career-changer'
    ]
  },
  experience: {
    type: String,
    required: true,
    enum: ['beginner', 'basic', 'intermediate', 'advanced']
  },
  skills: [{
    type: String,
    required: true
  }],
  goals: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },

  // Commitment & Motivation
  availability: {
    type: String,
    required: true,
    enum: ['10-15', '15-20', '20-25', '25+']
  },
  commitment: {
    type: String,
    required: true,
    enum: ['full', 'high', 'moderate']
  },
  hearAbout: {
    type: String,
    required: true
  },
  motivation: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 1000
  },

  // Agreements
  agreement: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Agreement to terms is required'
    }
  },
  marketingConsent: {
    type: Boolean,
    default: false
  },
  portfolioConsent: {
    type: Boolean,
    default: false
  },

  // System Fields
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'payment-required', 'confirmed', 'rejected', 'waitlist'],
    default: 'payment-required'
  },
  cohortNumber: {
    type: Number,
    default: 1
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  selectionRank: {
    type: Number,
    min: 1,
    max: 10
  },

  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date
  },

  // Metadata
  source: {
    type: String,
    default: 'kelmah-team-portal'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referralCode: {
    type: String
  },
  notes: [{
    content: String,
    author: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TeamRegistrationSchema.index({ email: 1 });
TeamRegistrationSchema.index({ registrationDate: -1 });
TeamRegistrationSchema.index({ status: 1 });
TeamRegistrationSchema.index({ isSelected: 1, selectionRank: 1 });
TeamRegistrationSchema.index({ cohortNumber: 1 });

// Virtual for full applicant info
TeamRegistrationSchema.virtual('applicantInfo').get(function() {
  return {
    name: this.fullName,
    email: this.email,
    phone: this.phone,
    country: this.country,
    experience: this.experience,
    commitment: this.commitment
  };
});

// Virtual for application score (basic scoring algorithm)
TeamRegistrationSchema.virtual('applicationScore').get(function() {
  let score = 0;
  
  // Experience weight
  const experienceWeight = { 
    'beginner': 1, 
    'basic': 2, 
    'intermediate': 3, 
    'advanced': 4 
  };
  score += (experienceWeight[this.experience] || 1) * 20;
  
  // Commitment weight
  const commitmentWeight = { 
    'moderate': 1, 
    'high': 2, 
    'full': 3 
  };
  score += (commitmentWeight[this.commitment] || 1) * 25;
  
  // Availability weight
  const availabilityWeight = { 
    '10-15': 1, 
    '15-20': 2, 
    '20-25': 3, 
    '25+': 4 
  };
  score += (availabilityWeight[this.availability] || 1) * 15;
  
  // Motivation length bonus (longer = more detailed)
  score += Math.min(this.motivation.length / 10, 20);
  
  // Goals length bonus
  score += Math.min(this.goals.length / 10, 15);
  
  // Early registration bonus
  const daysSinceOpen = Math.floor((Date.now() - new Date('2025-01-01')) / (1000 * 60 * 60 * 24));
  score += Math.max(10 - daysSinceOpen, 0);
  
  return Math.round(score);
});

// Pre-save middleware
TeamRegistrationSchema.pre('save', function(next) {
  // Auto-generate referral code if not provided
  if (!this.referralCode) {
    this.referralCode = `KLM_${this.fullName.replace(/\s+/g, '').substring(0, 3).toUpperCase()}_${Date.now().toString().slice(-4)}`;
  }
  
  next();
});

// Static methods
TeamRegistrationSchema.statics.getSelectedApplicants = function() {
  return this.find({ isSelected: true })
    .sort({ selectionRank: 1 })
    .limit(10);
};

TeamRegistrationSchema.statics.getRankedApplicants = function() {
  return this.aggregate([
    { $match: { status: { $in: ['confirmed', 'payment-required'] } } },
    { $addFields: { 
      score: {
        // Add scoring logic here if needed for complex queries
        $add: [
          { $multiply: [
            { $switch: {
              branches: [
                { case: { $eq: ['$experience', 'advanced'] }, then: 4 },
                { case: { $eq: ['$experience', 'intermediate'] }, then: 3 },
                { case: { $eq: ['$experience', 'basic'] }, then: 2 },
                { case: { $eq: ['$experience', 'beginner'] }, then: 1 }
              ],
              default: 1
            }}, 20
          ]},
          { $multiply: [
            { $switch: {
              branches: [
                { case: { $eq: ['$commitment', 'full'] }, then: 3 },
                { case: { $eq: ['$commitment', 'high'] }, then: 2 },
                { case: { $eq: ['$commitment', 'moderate'] }, then: 1 }
              ],
              default: 1
            }}, 25
          ]}
        ]
      }
    }},
    { $sort: { score: -1, registrationDate: 1 } }
  ]);
};

module.exports = mongoose.model('TeamRegistration', TeamRegistrationSchema);
