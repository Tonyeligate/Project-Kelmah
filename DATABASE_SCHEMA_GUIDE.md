# Kelmah Platform - MongoDB Database Schema & Storage Guide

## Database Connection
- **Database Name**: `kelmah_platform`
- **MongoDB Atlas Cluster**: `kelmah-messaging.xyqcurn.mongodb.net`
- **Connection String**: `mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority`
- **Total Collections**: 36
- **Active Collections with Data**: 5 (users, jobs, workerprofiles, refreshtokens, categories)

---

## Main Data Collections (What you store)

### 1. **USERS** (43 documents)
This collection stores all user accounts in the platform.

**REQUIRED fields to create a user:**
```javascript
{
  firstName: "String",           // User first name (max 50 chars)
  lastName: "String",            // User last name (max 50 chars)
  email: "String",               // Email address (must be valid format)
  password: "String",            // Min 8 chars (auto-hashed with bcrypt)
  role: "admin|hirer|worker|staff" // User role (default: "worker")
}
```

**OPTIONAL/AUTO fields:**
```javascript
{
  phone: "String",               // Ghana phone number (+233 or 0 format)
  isEmailVerified: Boolean,      // true/false (auto: false)
  isPhoneVerified: Boolean,      // true/false (auto: false)
  isTwoFactorEnabled: Boolean,   // true/false (auto: false)
  tokenVersion: Number,          // JWT token version (auto: 0)
  isActive: Boolean,             // Account active? (auto: true)
  
  // Additional profile fields:
  country: "String",             // e.g., "Ghana"
  countryCode: "String",         // e.g., "GH"
  city: "String",                // e.g., "Accra"
  state: "String",               // e.g., "Greater Accra"
  
  // For workers/hirers:
  bio: "String",                 // Profile biography
  profession: "String",          // Job profession
  hourlyRate: Number,            // Hourly rate
  currency: "String",            // e.g., "GHS"
  rating: Number,                // Profile rating
  skills: [String],              // Array of skills
  
  // Timestamps (auto-generated)
  createdAt: Date,               // Document creation date
  updatedAt: Date,               // Last update date
  lastLogin: Date,               // Last login timestamp
}
```

**Example user document in database:**
```javascript
{
  _id: ObjectId("6768306f7e675b001fc36931"),
  firstName: "Gifty",
  lastName: "Afisa",
  email: "giftyafisa@gmail.com",
  phone: "0553366244",
  password: "$2a$12$nWSBLnm..." // bcrypt hashed
  role: "hirer",
  isEmailVerified: true,
  isPhoneVerified: false,
  isActive: true,
  country: "Ghana",
  countryCode: "GH",
  city: "Accra",
  createdAt: ISODate("2025-08-05T01:07:35.290Z"),
  updatedAt: ISODate("2025-11-11T01:39:30.466Z"),
  __v: 0 // Mongoose version field
}
```

---

### 2. **JOBS** (6 documents)
This collection stores job postings created by hirers.

**REQUIRED fields to create a job:**
```javascript
{
  title: "String",               // Job title (max 100 chars)
  description: "String",         // Job description (max 5000 chars)
  category: "String",            // Job category (e.g., "Electrical Work")
  skills: [String],              // Array of required skills (at least 1)
  budget: Number,                // Budget amount (must be > 0)
  
  duration: {
    value: Number,               // Duration value (e.g., 3)
    unit: "hour|day|week|month"  // Duration unit
  },
  
  paymentType: "fixed|hourly",   // Payment structure
  
  location: {
    type: "remote|onsite|hybrid", // Location type
    country: "String",            // Country
    city: "String"                // City
  },
  
  hirer: ObjectId                // Reference to User._id
}
```

**OPTIONAL/AUTO fields:**
```javascript
{
  currency: "String",            // Default: "GHS"
  status: "draft|open|in-progress|completed|cancelled", // Default: "open"
  visibility: "public|private|invite-only", // Default: "public"
  
  worker: ObjectId,              // Reference to assigned worker (optional)
  proposalCount: Number,         // Number of proposals
  viewCount: Number,             // Job view count
  applicationCount: Number,      // Number of applications
  
  attachments: [                 // Files attached to job
    {
      name: "String",
      url: "String",
      type: "String",
      size: Number
    }
  ],
  
  // Timestamps
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example job document:**
```javascript
{
  _id: ObjectId("6768306f7e675b001fc36932"),
  title: "Senior Electrical Engineer - Commercial Projects",
  description: "Seeking certified electrician for high-rise...",
  category: "Electrical Work",
  skills: ["Electrical Installation", "Industrial Wiring"],
  budget: 4500,
  currency: "GHS",
  duration: {
    value: 3,
    unit: "month"
  },
  paymentType: "fixed",
  location: {
    type: "onsite",
    country: "Ghana",
    city: "Accra"
  },
  status: "Open",
  visibility: "public",
  hirer: ObjectId("6891595768c3cdade00f564f"),
  proposalCount: 12,
  viewCount: 45,
  applicationCount: 0,
  createdAt: ISODate("2025-09-04T23:47:29.197Z"),
  updatedAt: ISODate("2025-09-04T23:47:29.197Z"),
  __v: 0
}
```

---

### 3. **APPLICATIONS** (0 documents)
This collection stores job applications from workers to jobs.

**REQUIRED fields to create an application:**
```javascript
{
  job: ObjectId,                 // Reference to Job._id
  worker: ObjectId,              // Reference to User._id
  proposedRate: Number,          // Worker's proposed rate
  coverLetter: "String"          // Application cover letter
}
```

**OPTIONAL fields:**
```javascript
{
  estimatedDuration: {
    value: Number,
    unit: "hour|day|week|month"
  },
  
  attachments: [                 // Attached files
    {
      name: "String",
      fileUrl: "String",
      fileType: "String",
      uploadDate: Date
    }
  ],
  
  status: "pending|under_review|accepted|rejected|withdrawn", // Default: "pending"
  notes: "String",
  availabilityStartDate: Date,
  
  questionResponses: [           // Answers to employer questions
    {
      question: "String",
      answer: "String"
    }
  ],
  
  isInvited: Boolean,            // Default: false
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Uniqueness Constraint:**
- A worker can only apply to the same job ONCE (index on `job + worker`)

---

### 4. **WORKERPROFILES** (22 documents)
This collection stores detailed profiles for workers.

**Fields:**
```javascript
{
  userId: ObjectId,              // Reference to User._id
  bio: "String",                 // Worker bio
  hourlyRate: Number,            // Hourly rate
  currency: "String",            // Currency code
  location: "String",            // Location string
  availabilityStatus: "String",  // e.g., "available"
  
  // Experience
  experienceLevel: "String",     // beginner|intermediate|advanced|expert
  yearsOfExperience: Number,
  skills: [String],              // Array of skills
  specializations: [String],     // Specializations
  languages: [String],           // Languages spoken
  
  // Performance metrics
  rating: Number,                // Average rating
  totalReviews: Number,          // Number of reviews
  totalJobs: Number,             // Jobs completed
  totalJobsCompleted: Number,
  completionRate: Number,        // %
  responseRate: Number,          // %
  
  // Availability schedule
  availableHours: {
    monday: { start: "HH:MM", end: "HH:MM", available: Boolean },
    tuesday: { ... },
    // ... etc for all days
  },
  
  // Documents
  portfolioItems: [
    { title: String, description: String, imageUrl: String, link: String }
  ],
  certifications: [
    { name: String, issuedBy: String, expirationDate: Date }
  ],
  
  // Verification
  isVerified: Boolean,
  verificationLevel: "String",
  backgroundCheckStatus: "String",
  
  // Other
  profileCompleteness: Number,   // % complete
  onlineStatus: "String",        // online|offline
  lastActiveAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. **MESSAGES** (0 documents)
Direct messages between users.

**Fields:**
```javascript
{
  sender: ObjectId,              // Reference to User._id
  recipient: ObjectId,           // Reference to User._id
  content: "String",             // Message content
  
  attachments: [
    {
      fileUrl: "String",
      fileName: "String",
      fileType: "String"
    }
  ],
  
  isRead: Boolean,               // Default: false
  readAt: Date,                  // When message was read
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

### 6. **CONVERSATIONS** (0 documents)
Conversation threads between users.

**Fields:**
```javascript
{
  participants: [ObjectId],      // Array of User._ids
  lastMessage: "String",         // Latest message preview
  
  // Metadata
  messageCount: Number,
  isArchived: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastMessageAt: Date
}
```

---

### 7. **REVIEWS** (0 documents)
Reviews left by users about their work with other users.

**Fields:**
```javascript
{
  reviewer: ObjectId,            // User who left the review (Reference to User)
  reviewee: ObjectId,            // User being reviewed (Reference to User)
  
  job: ObjectId,                 // Reference to Job (optional)
  
  rating: Number,                // 1-5 star rating
  title: "String",               // Review title
  content: "String",             // Review content
  
  categories: {
    quality: Number,             // 1-5
    communication: Number,       // 1-5
    timeliness: Number,          // 1-5
    professionalism: Number      // 1-5
  },
  
  // Moderation
  isVerified: Boolean,
  isFlagged: Boolean,
  flagReason: "String",
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8. **CONTRACTS** (0 documents)
Work contracts between hirer and worker.

**Fields:**
```javascript
{
  job: ObjectId,                 // Reference to Job._id
  hirer: ObjectId,               // Reference to User._id
  worker: ObjectId,              // Reference to User._id
  
  startDate: Date,
  endDate: Date,
  
  terms: "String",               // Contract terms
  status: "String",              // pending|active|completed|cancelled
  
  paymentTerms: {
    amount: Number,
    currency: "String",
    paymentSchedule: "String"
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Other Collections in Database

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| **categories** | 8 | Job categories reference data |
| **reference_locations** | 8 | Location reference data |
| **refreshtokens** | 64 | JWT refresh token storage |
| **notificationpreferences** | 1 | User notification settings |
| **portfolios** | 0 | Worker portfolio items |
| **certifications** | 0 | Worker certifications |
| **bids** | 0 | Job bids from workers |
| **transactions** | 0 | Payment transactions |
| **wallets** | 0 | User wallet balances |
| **escrows** | 0 | Escrow payments |
| **bills** | 0 | Billing records |
| **notifications** | 0 | Notifications sent to users |

---

## Data Storage Rules

### What data is REQUIRED?
- All fields marked `required: [true, ...]` in the schema MUST be provided when creating a document
- If a required field is missing, the document creation will FAIL with an error

### What data is OPTIONAL?
- All fields without `required: true` are optional
- They can be omitted when creating a document
- They will be added later if needed

### Data Validation Rules
- **Email**: Must match format `user@example.com`
- **Phone**: Must be valid Ghana format (starts with +233 or 0)
- **Budget**: Must be a number greater than 0
- **Skills array**: Must have at least 1 skill (for jobs)
- **Rating**: Number from 1-5
- **Enum fields**: Must match allowed values (e.g., "hirer" for role, not "employer")

### How data is stored in MongoDB?
- All data stored as **JSON-like BSON documents** (MongoDB's binary JSON format)
- No fixed "table columns" - fields can vary between documents
- Documents reference each other using **ObjectId** pointers (like foreign keys)
- Timestamps automatically added: `createdAt`, `updatedAt`
- Each document gets an auto-generated `_id` field as primary key
- **`__v` field**: Mongoose version control (auto-managed)

---

## Example: Creating a Complete Workflow

### Step 1: Create User (Hirer)
```javascript
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "hirer",
  "phone": "+233553366244",
  "country": "Ghana"
}
// Returns: User document with _id, tokens, etc.
```

### Step 2: Create Job
```javascript
POST /api/jobs
Authorization: Bearer <token>
{
  "title": "Plumbing Repair",
  "description": "Need a plumber to fix kitchen sink",
  "category": "Plumbing",
  "skills": ["plumbing", "fixtures"],
  "budget": 250,
  "paymentType": "fixed",
  "duration": { "value": 1, "unit": "day" },
  "location": { "type": "onsite", "country": "Ghana", "city": "Accra" }
}
// Returns: Job document stored in jobs collection
```

### Step 3: Worker Applies
```javascript
POST /api/jobs/:jobId/apply
Authorization: Bearer <worker-token>
{
  "proposedRate": 200,
  "coverLetter": "I have 5 years of experience in plumbing..."
}
// Returns: Application document stored in applications collection
```

### Step 4: Data is Retrieved
- Hirer gets job with applications
- Worker sees job in list
- System matches workers to jobs based on skills
- Reviews and ratings accumulate over time

---

## Key Points for Developers

✅ **DO:**
- Use the schema to understand what fields are required
- Check field types and allowed values (enums)
- Validate data BEFORE sending to API
- Handle errors from validation failures
- Store user IDs as references (ObjectId), not duplicating data

❌ **DON'T:**
- Send fields that aren't in the schema
- Use wrong data types (number vs string)
- Omit required fields
- Use enum values that aren't allowed
- Duplicate data across collections (use references instead)

---

## MongoDB Data Types Used

| Type | Example | Usage |
|------|---------|-------|
| **String** | `"Gifty"` | Text data |
| **Number** | `250`, `45.5` | Quantities, rates |
| **Boolean** | `true`, `false` | Flags, status |
| **Date** | `2025-11-29T12:30:00Z` | Timestamps |
| **Array** | `["plumbing", "fixtures"]` | Lists of items |
| **Object** | `{ start: "09:00", end: "17:00" }` | Nested data |
| **ObjectId** | `ObjectId("68c944406c17324aeb39a910")` | References to other documents |
| **Null** | `null` | Empty/missing value |

