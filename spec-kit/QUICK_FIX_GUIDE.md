# Quick Fix Guide - Mongoose Disconnected Models

**Use this guide to quickly fix any service experiencing Mongoose buffering timeouts**

---

## 🎯 Problem Signature

```
MongooseError: Operation `[collection].find()` buffering timed out after 10000ms
```

✅ Connection logs show "connected to MongoDB"  
❌ All Mongoose queries timeout after exactly 10 seconds

---

## ⚡ Quick Fix Steps

### 1. Locate the Failing Query

Find the controller function with the failing Mongoose query:
```javascript
const result = await Model.find(query);
```

### 2. Add Direct Driver Code

Replace with this pattern:

```javascript
// Get the connected MongoDB client
const mongoose = require('mongoose');
const client = mongoose.connection.getClient();
const db = client.db();
const collection = db.collection('collection_name'); // Change this!

// Execute query with native driver
const results = await collection.find(query).toArray();

// Transform ObjectIds to strings
const transformed = results.map(doc => ({
  ...doc,
  _id: doc._id.toString()
}));
```

### 3. Common Query Patterns

**find() → find().toArray()**
```javascript
// Before
const jobs = await Job.find({ status: 'open' })
  .skip(10)
  .limit(20)
  .sort('-createdAt');

// After
const jobsCollection = db.collection('jobs');
const jobs = await jobsCollection
  .find({ status: 'open' })
  .sort({ createdAt: -1 })
  .skip(10)
  .limit(20)
  .toArray();
```

**findOne() → findOne()**
```javascript
// Before
const user = await User.findOne({ email: 'test@test.com' });

// After
const usersCollection = db.collection('users');
const user = await usersCollection.findOne({ email: 'test@test.com' });
```

**findById() → findOne({ _id })**
```javascript
// Before
const job = await Job.findById(jobId);

// After
const { ObjectId } = require('mongodb');
const jobsCollection = db.collection('jobs');
const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
```

**countDocuments() → countDocuments()**
```javascript
// Before
const total = await Job.countDocuments({ status: 'open' });

// After
const jobsCollection = db.collection('jobs');
const total = await jobsCollection.countDocuments({ status: 'open' });
```

### 4. Handle Populate

**Before (Mongoose populate):**
```javascript
const jobs = await Job.find(query)
  .populate('hirer', 'firstName lastName profileImage');
```

**After (Manual populate):**
```javascript
const jobsCollection = db.collection('jobs');
const usersCollection = db.collection('users');

// Get jobs
const jobs = await jobsCollection.find(query).toArray();

// Get unique hirer IDs
const hirerIds = [...new Set(jobs.map(j => j.hirer).filter(Boolean))];

// Fetch hirers
const hirers = await usersCollection
  .find({ _id: { $in: hirerIds } })
  .project({ firstName: 1, lastName: 1, profileImage: 1 })
  .toArray();

// Create lookup map
const hirerMap = new Map(hirers.map(h => [h._id.toString(), h]));

// Attach to jobs
jobs.forEach(job => {
  if (job.hirer) {
    job.hirer = hirerMap.get(job.hirer.toString());
  }
});
```

### 5. Transform Response

```javascript
// Convert ObjectIds to strings for JSON
const transformed = results.map(doc => ({
  ...doc,
  _id: doc._id.toString(),
  // Also convert any embedded ObjectIds
  userId: doc.userId?.toString(),
  createdBy: doc.createdBy?.toString()
}));

return res.json({ data: transformed });
```

---

## 📋 Collection Name Reference

| Model Name | Collection Name |
|------------|----------------|
| User | users |
| Job | jobs |
| Application | applications |
| Bid | bids |
| Message | messages |
| Contract | contracts |
| Review | reviews |
| SavedJob | savedjobs |
| WorkerProfile | workerprofiles |
| Category | categories |
| UserPerformance | userperformances |

---

## 🔍 Verification Template

Add this BEFORE your fix to confirm the issue:

```javascript
// Diagnostic logging
const mongoose = require('mongoose');
console.log('[DEBUG] Model connection state:', YourModel.db?.readyState);
console.log('[DEBUG] Service connection state:', mongoose.connection.readyState);

// Test direct driver
const client = mongoose.connection.getClient();
const db = client.db();
const collection = db.collection('your_collection');
const testCount = await collection.countDocuments({});
console.log('[DEBUG] Documents via direct driver:', testCount);
```

Expected output:
```
[DEBUG] Model connection state: 0    ← DISCONNECTED (the problem!)
[DEBUG] Service connection state: 1  ← CONNECTED
[DEBUG] Documents via direct driver: 42  ← WORKS!
```

---

## ⚠️ Common Gotchas

1. **Collection Names:** Mongoose pluralizes - `User` → `users`, `Job` → `jobs`
2. **ObjectId:** Import from `mongodb` package, not mongoose
3. **Sort Syntax:** Mongoose uses string `'-createdAt'`, native uses object `{ createdAt: -1 }`
4. **toArray():** Required for `find()`, NOT needed for `findOne()`
5. **Select → Project:** Mongoose `.select('field1 field2')` → Native `.project({ field1: 1, field2: 1 })`

---

## 🚀 Example: Complete Fix

**Before:**
```javascript
const getJobs = async (req, res) => {
  const { Job } = require('../models');
  
  const jobs = await Job.find({ status: 'open' })
    .populate('hirer', 'firstName lastName')
    .skip(0)
    .limit(10)
    .sort('-createdAt');
    
  const total = await Job.countDocuments({ status: 'open' });
  
  res.json({ jobs, total });
};
```

**After:**
```javascript
const getJobs = async (req, res) => {
  const mongoose = require('mongoose');
  const client = mongoose.connection.getClient();
  const db = client.db();
  
  // Get collections
  const jobsCollection = db.collection('jobs');
  const usersCollection = db.collection('users');
  
  // Query jobs
  const jobs = await jobsCollection
    .find({ status: 'open' })
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(10)
    .toArray();
  
  // Manual populate
  const hirerIds = [...new Set(jobs.map(j => j.hirer).filter(Boolean))];
  const hirers = await usersCollection
    .find({ _id: { $in: hirerIds } })
    .project({ firstName: 1, lastName: 1 })
    .toArray();
  
  const hirerMap = new Map(hirers.map(h => [h._id.toString(), h]));
  jobs.forEach(job => {
    if (job.hirer) {
      job.hirer = hirerMap.get(job.hirer.toString());
    }
  });
  
  // Transform ObjectIds
  const transformed = jobs.map(job => ({
    ...job,
    _id: job._id.toString()
  }));
  
  // Get total
  const total = await jobsCollection.countDocuments({ status: 'open' });
  
  res.json({ jobs: transformed, total });
};
```

---

## 📝 Commit Message

```
fix: use direct MongoDB driver in [SERVICE] [ENDPOINT]

Replaces disconnected Mongoose model queries with native MongoDB driver.

Root cause: Mongoose models bound to disconnected instance (readyState=0)
while service connection is healthy (readyState=1).

Changes:
- Replace Model.find() with collection.find().toArray()
- Manual populate for relationships
- ObjectId string conversion for JSON response

Verified: [X] documents returned successfully
```

---

**Last Updated:** October 2, 2025  
**Quick Reference:** Always available in `spec-kit/`
