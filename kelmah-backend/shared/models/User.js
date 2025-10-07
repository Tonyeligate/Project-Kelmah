/**
 * User Model - MongoDB/Mongoose (User Service)
 * Updated for MongoDB migration - preserves all functionality from Sequelize version
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    sparse: true, // Allows multiple null values
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Allow empty/null values
        // Ghana phone number validation (supports international format)
        const phoneRegex = /^(\+233|0)[2-9][0-9]{8}$/;
        return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid Ghana phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [100, 'Password cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'hirer', 'worker', 'staff'],
      message: 'Role must be one of: admin, hirer, worker, staff'
    },
    default: 'worker'
  },
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Phone Verification
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationToken: String,
  phoneVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Two-Factor Authentication
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  
  // Account Management
  tokenVersion: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // OAuth Integration
  googleId: {
    type: String,
    sparse: true
  },
  facebookId: {
    type: String,
    sparse: true
  },
  linkedinId: {
    type: String,
    sparse: true
  },
  
  // Personal Information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  
  // Address Information (Ghana-specific)
  address: String,
  city: String,
  state: String, // Ghana regions
  country: {
    type: String,
    default: 'Ghana'
  },
  countryCode: {
    type: String,
    default: 'GH'
  },
  postalCode: String,

  // Geo location for user (worker/hirer). Stored as GeoJSON Point [lng, lat]
  locationCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  
  // Profile
  profilePicture: String,
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Worker-specific fields
  profession: {
    type: String,
    default: 'General Worker'
  },
  skills: {
    type: [String],
    default: []
  },
  hourlyRate: {
    type: Number,
    default: 25
  },
  currency: {
    type: String,
    default: 'GHS'
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalJobsCompleted: {
    type: Number,
    default: 0
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'unavailable', 'vacation'],
    default: 'available'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  yearsOfExperience: {
    type: Number,
    default: 1
  },
  location: {
    type: String,
    default: 'Ghana'
  },
  specializations: {
    type: [String],
    default: []
  },
  
  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  
  // Soft delete
  deletedAt: Date
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users',
  bufferCommands: false, // Disable buffering to prevent 10s timeout when DB not connected
  autoCreate: true // Ensure collection is created
});

// ✅ FIXED: Clean indexes without duplicates (removed unique: true from explicit indexes)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { sparse: true }); // Removed duplicate unique: true 
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ googleId: 1 }, { sparse: true }); // Already no unique: true
userSchema.index({ facebookId: 1 }, { sparse: true }); // Already no unique: true  
userSchema.index({ linkedinId: 1 }, { sparse: true }); // Already no unique: true
// Optional geo index for location if coordinates included elsewhere
userSchema.index({ locationCoordinates: '2dsphere' });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.emailVerificationToken;
    delete ret.phoneVerificationToken;
    delete ret.twoFactorSecret;
    return ret;
  }
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance Methods
userSchema.methods.validatePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

userSchema.methods.generatePhoneVerificationToken = function() {
  const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.phoneVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return token;
};

userSchema.methods.incrementFailedLogins = function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetFailedLogins = function() {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.accountLockedUntil = undefined;
  return this.save();
};

userSchema.methods.incrementTokenVersion = async function() {
  this.tokenVersion += 1;
  return this.save();
};

// Static Methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });
};

userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });
};

userSchema.statics.findByPhoneVerificationToken = function(token, phone) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    phone: phone,
    phoneVerificationToken: hashedToken,
    phoneVerificationExpires: { $gt: new Date() }
  });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, deletedAt: { $exists: false } });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true, deletedAt: { $exists: false } });
};

// Export model - check if already registered to prevent "Cannot overwrite model" errors
module.exports = mongoose.models.User || mongoose.model('User', userSchema);