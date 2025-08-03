# Database Migration Guide: PostgreSQL to MongoDB

## Overview
This guide provides step-by-step instructions for migrating from the current mixed database setup (PostgreSQL + MongoDB) to a unified MongoDB architecture.

## Current State Analysis

### Services Using PostgreSQL (via Sequelize):
1. **auth-service**
   - User authentication data
   - Session management
   - Dependencies: `sequelize`, `pg`, `pg-hstore`

2. **user-service**
   - User profiles
   - Worker/Hirer specific data
   - Dependencies: `sequelize`, `pg`, `pg-hstore`

3. **job-service**
   - Job listings
   - Applications
   - Contracts
   - Dependencies: `sequelize`, `pg`, `pg-hstore`

### Services Already Using MongoDB:
1. **payment-service** - Payment transactions, wallets
2. **messaging-service** - Conversations, messages
3. **review-service** - Reviews, ratings

## Migration Steps

### Step 1: Backup Existing Data (Day 1 Morning)
```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres -d kelmah_auth > auth_backup.sql
pg_dump -h localhost -U postgres -d kelmah_users > users_backup.sql
pg_dump -h localhost -U postgres -d kelmah_jobs > jobs_backup.sql

# MongoDB backup (existing data)
mongodump --db kelmah --out ./mongodb_backup
```

### Step 2: Create MongoDB Schemas (Day 1 Afternoon)

#### Auth Service Schemas
```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['worker', 'hirer', 'admin'],
    default: 'worker'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

#### User Service Schemas
```javascript
// models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  profileImage: String,
  bio: String,
  // Worker specific fields
  workerProfile: {
    skills: [String],
    experience: Number,
    hourlyRate: Number,
    availability: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available'
    },
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      verificationUrl: String
    }],
    portfolio: [{
      title: String,
      description: String,
      images: [String],
      completedDate: Date
    }]
  },
  // Hirer specific fields
  hirerProfile: {
    companyName: String,
    companySize: String,
    industry: String,
    website: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', profileSchema);
```

#### Job Service Schemas
```javascript
// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  hirerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  skills: [String],
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'GHS'
    }
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  duration: {
    type: String,
    enum: ['one-time', 'recurring', 'contract']
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  deadline: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// models/Application.js
const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: String,
  proposedRate: Number,
  estimatedDuration: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// models/Contract.js
const contractSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  hirerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  terms: {
    rate: Number,
    paymentSchedule: String,
    startDate: Date,
    endDate: Date,
    deliverables: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'terminated', 'disputed'],
    default: 'draft'
  },
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'paid'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### Step 3: Create Migration Scripts (Day 2 Morning)

Create a migration script for each service:

```javascript
// migrate-auth-service.js
const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateAuthData() {
  // Connect to PostgreSQL
  const sequelize = new Sequelize('postgres://user:pass@localhost:5432/kelmah_auth');
  
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/kelmah');
  
  try {
    // Fetch all users from PostgreSQL
    const [users] = await sequelize.query('SELECT * FROM users');
    
    // Migrate each user
    for (const pgUser of users) {
      const mongoUser = new User({
        _id: pgUser.id, // Preserve IDs if possible
        email: pgUser.email,
        password: pgUser.password, // Already hashed
        role: pgUser.role,
        isEmailVerified: pgUser.email_verified,
        emailVerificationToken: pgUser.email_verification_token,
        passwordResetToken: pgUser.password_reset_token,
        passwordResetExpires: pgUser.password_reset_expires,
        lastLogin: pgUser.last_login,
        createdAt: pgUser.created_at,
        updatedAt: pgUser.updated_at
      });
      
      await mongoUser.save();
      console.log(`Migrated user: ${mongoUser.email}`);
    }
    
    console.log('Auth service migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sequelize.close();
    await mongoose.connection.close();
  }
}

migrateAuthData();
```

### Step 4: Update Service Code (Day 2 Afternoon)

#### Remove Sequelize Dependencies
```bash
# For each service using PostgreSQL
cd kelmah-backend/services/auth-service
npm uninstall sequelize pg pg-hstore
npm install mongoose

cd ../user-service
npm uninstall sequelize pg pg-hstore
npm install mongoose

cd ../job-service
npm uninstall sequelize pg pg-hstore
npm install mongoose
```

#### Update Database Connection
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Step 5: Update Controllers (Day 3)

Update all controllers to use Mongoose instead of Sequelize. Example:

```javascript
// Before (Sequelize)
const User = require('../models').User;

const createUser = async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
};

// After (Mongoose)
const User = require('../models/User');

const createUser = async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
};
```

### Step 6: Testing & Validation (Day 3)

1. **Unit Tests**: Update all tests to use MongoDB
2. **Integration Tests**: Test service-to-service communication
3. **Data Validation**: Ensure all migrated data is correct
4. **Performance Tests**: Compare query performance

### Step 7: Deployment Strategy

1. **Staging Environment**:
   - Deploy MongoDB version to staging
   - Run parallel with PostgreSQL version
   - Compare outputs

2. **Production Migration**:
   - Schedule maintenance window
   - Backup all data
   - Run migration scripts
   - Deploy new code
   - Verify functionality
   - Keep PostgreSQL backup for 30 days

## Rollback Plan

If issues arise:
1. Revert code to PostgreSQL version
2. Restore PostgreSQL from backup
3. Update environment variables
4. Restart services

## Success Criteria

- [ ] All services using MongoDB exclusively
- [ ] No data loss during migration
- [ ] All tests passing
- [ ] Performance metrics maintained or improved
- [ ] Zero downtime during migration

## Timeline Summary

- **Day 1**: Backup data, create MongoDB schemas
- **Day 2**: Run migration scripts, update service code
- **Day 3**: Update controllers, test, and validate

## Notes

- Keep detailed logs of migration process
- Monitor error rates closely after migration
- Have PostgreSQL expert on standby during migration
- Consider using MongoDB transactions for data consistency