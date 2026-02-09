# Kelmah Hybrid Model Specification

**Version**: 1.0  
**Date**: January 31, 2026  
**Status**: ✅ IMPLEMENTATION COMPLETE  
**Author**: AI Development Agent + Project Owner

---

## Implementation Status

| Component | Status | Files |
|-----------|--------|-------|
| QuickJob Database Model | ✅ Complete | `shared/models/QuickJob.js` |
| API Routes & Controllers | ✅ Complete | `job-service/routes/quickJobRoutes.js`, `job-service/controllers/quickJobController.js` |
| Paystack Escrow Integration | ✅ Complete | `job-service/services/paystackService.js`, `job-service/controllers/quickJobPaymentController.js` |
| Dispute Resolution System | ✅ Complete | `job-service/controllers/disputeController.js` |
| Frontend Service | ✅ Complete | `modules/quickjobs/services/quickJobService.js` |
| Homepage Categories | ✅ Complete | `modules/quickjobs/components/ServiceCategorySelector.jsx` |
| Quick Job Request Flow | ✅ Complete | `modules/quickjobs/pages/QuickJobRequestPage.jsx` |
| Worker Job Discovery | ✅ Complete | `modules/quickjobs/pages/NearbyJobsPage.jsx` |
| GPS Tracking & Verification | ✅ Complete | `modules/quickjobs/pages/QuickJobTrackingPage.jsx` |
| API Gateway Integration | ✅ Complete | `api-gateway/server.js` |

---

## Executive Summary

Kelmah is transforming from an Upwork-clone model to a **"Protected Quick-Hire"** system specifically designed for **Ghana's vocational job market** (plumbers, electricians, carpenters, masons, etc.).

### Core Philosophy
- **Feel like TaskRabbit** (fast, simple, mobile-first)
- **Protect like Upwork** (escrow, milestones, disputes)
- **Work for Ghana** (MoMo, WhatsApp, offline-tolerant)

---

## 1. Job Classification System

### 1.1 Two Job Tracks

| Track | Budget Range | Timeline | Flow | Payment |
|-------|-------------|----------|------|---------|
| **Quick Jobs** | Under GH₵500 | Same day - 2 days | Simple 5-step | Single escrow |
| **Projects** | Over GH₵500 | Days - Weeks | Protected milestone | Multi-milestone escrow |

### 1.2 Quick Jobs (Examples)
- Fix leaking pipe
- Install ceiling fan
- Repair door lock
- Paint one room
- Fix electrical outlet
- Mount TV/Shelves
- Minor carpentry repairs

### 1.3 Projects (Examples)
- Renovate bathroom
- Build fence/wall
- Full electrical rewiring
- Roofing work
- Room addition
- Complete painting job (whole house)
- Major plumbing installation

---

## 2. Quick Jobs Flow

### 2.1 Client Flow (5 Steps)

```
Step 1: SELECT SERVICE
┌─────────────────────────────────────────────────────────────┐
│  What do you need help with?                                │
│                                                             │
│  [🔧 Plumbing] [⚡ Electrical] [🪚 Carpentry] [🧱 Masonry]   │
│  [🎨 Painting] [🔩 Welding] [🛠️ General] [📦 Other]        │
└─────────────────────────────────────────────────────────────┘

Step 2: DESCRIBE & LOCATE
┌─────────────────────────────────────────────────────────────┐
│  Describe briefly (or tap to speak 🎤):                     │
│  [Leaking pipe under kitchen sink________________]          │
│                                                             │
│  📷 [Add photo] (optional but recommended)                  │
│                                                             │
│  📍 Location: [Auto-detect] or [Enter address]              │
│     Osu, Accra ✓                                            │
└─────────────────────────────────────────────────────────────┘

Step 3: WHEN DO YOU NEED IT?
┌─────────────────────────────────────────────────────────────┐
│  [🔴 EMERGENCY - Now/Today]                                 │
│  [🟡 Soon - Within 2-3 days]                                │
│  [🟢 Flexible - This week]                                  │
└─────────────────────────────────────────────────────────────┘

Step 4: REVIEW QUOTES
┌─────────────────────────────────────────────────────────────┐
│  3 workers responded:                                       │
│                                                             │
│  ┌────────────────────────────────────────┐                 │
│  │ 👤 Kofi A.  ⭐4.8 (45 jobs)            │                 │
│  │ 📍 1.2km away • Available NOW          │                 │
│  │ 💬 "I can come in 30 mins, GH₵80"      │                 │
│  │ [ACCEPT GH₵80]  [MESSAGE]              │                 │
│  └────────────────────────────────────────┘                 │
│                                                             │
│  ┌────────────────────────────────────────┐                 │
│  │ 👤 Kwame B.  ⭐4.6 (32 jobs)           │                 │
│  │ 📍 2.8km away • Available in 2hrs      │                 │
│  │ 💬 "GH₵70 including small parts"       │                 │
│  │ [ACCEPT GH₵70]  [MESSAGE]              │                 │
│  └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘

Step 5: PAY & CONFIRM
┌─────────────────────────────────────────────────────────────┐
│  Confirm Booking                                            │
│                                                             │
│  Worker: Kofi A.                                            │
│  Service: Plumbing - Leaking pipe                           │
│  When: Today, arriving ~3:30pm                              │
│  Amount: GH₵80                                              │
│                                                             │
│  💳 Payment Method:                                         │
│  [MTN MoMo ●] [Vodafone Cash] [AirtelTigo] [Card]          │
│                                                             │
│  ⓘ Money held safely until job complete                    │
│                                                             │
│  [CONFIRM & PAY GH₵80]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Worker Flow (Quick Jobs)

```
WORKER RECEIVES ALERT:
┌─────────────────────────────────────────────────────────────┐
│  🔔 NEW JOB NEARBY                                          │
│                                                             │
│  🔧 Plumbing: "Leaking pipe under kitchen sink"             │
│  📍 Osu, Accra (1.2km from you)                             │
│  ⏰ Needed: Today (ASAP)                                    │
│  📸 [View photo]                                            │
│                                                             │
│  [SEND QUOTE]  [NOT INTERESTED]                             │
│                                                             │
│  ⚡ 2 other workers already responded                       │
└─────────────────────────────────────────────────────────────┘

WORKER SENDS QUOTE:
┌─────────────────────────────────────────────────────────────┐
│  Your Quote                                                 │
│                                                             │
│  Amount: [GH₵_80_______]                                    │
│                                                             │
│  Message (optional):                                        │
│  [I can come in 30 mins. Price includes basic parts._]      │
│                                                             │
│  When can you arrive?                                       │
│  [In 30 mins ●] [In 1 hour] [In 2 hours] [Tomorrow]        │
│                                                             │
│  [SEND QUOTE]                                               │
└─────────────────────────────────────────────────────────────┘

WORKER CONFIRMED:
┌─────────────────────────────────────────────────────────────┐
│  ✅ JOB CONFIRMED!                                          │
│                                                             │
│  Client: Ama K.                                             │
│  📍 15 Oxford Street, Osu, Accra                            │
│  📞 [Call] [WhatsApp]                                       │
│                                                             │
│  Amount: GH₵80 (Secured in escrow ✓)                        │
│  Your earnings: GH₵72 (after 10% fee)                       │
│                                                             │
│  [📍 NAVIGATE]  [ON MY WAY]                                 │
└─────────────────────────────────────────────────────────────┘

WORKER ACTIONS:
┌─────────────────────────────────────────────────────────────┐
│  Job Progress                                               │
│                                                             │
│  [ON MY WAY] ✓ Started 3:05pm                               │
│       ↓                                                     │
│  [ARRIVED] 📍 GPS verified at 3:28pm                        │
│       ↓                                                     │
│  [WORK COMPLETE] 📸 Add completion photos                   │
│                                                             │
│  ┌────────────────────────────────────────┐                 │
│  │ Upload completion photos (required):   │                 │
│  │ [📸 +] [📸 +] [📸 +]                    │                 │
│  │ Min 1 photo, max 5 photos              │                 │
│  └────────────────────────────────────────┘                 │
│                                                             │
│  [MARK JOB COMPLETE]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Completion & Payment

```
CLIENT RECEIVES NOTIFICATION:
┌─────────────────────────────────────────────────────────────┐
│  Job Complete - Please Review                               │
│                                                             │
│  Kofi marked the job as complete.                           │
│                                                             │
│  Completion photos:                                         │
│  [📸 Photo 1] [📸 Photo 2]                                  │
│                                                             │
│  Is the work satisfactory?                                  │
│                                                             │
│  [✅ YES - RELEASE PAYMENT]                                 │
│                                                             │
│  [❌ THERE'S AN ISSUE - DISPUTE]                            │
│                                                             │
│  ⓘ Payment will auto-release in 24 hours if no response    │
└─────────────────────────────────────────────────────────────┘

PAYMENT RELEASED:
┌─────────────────────────────────────────────────────────────┐
│  ✅ Payment Sent!                                           │
│                                                             │
│  GH₵72 sent to Kofi A. via MTN MoMo                         │
│  (GH₵80 - GH₵8 platform fee)                                │
│                                                             │
│  Please leave a review:                                     │
│  ⭐⭐⭐⭐⭐                                                   │
│  [Write review...]                                          │
│                                                             │
│  [SUBMIT REVIEW]  [SKIP]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Projects Flow (Milestone-Based)

### 3.1 Project Creation

```
Step 1: PROJECT DETAILS
┌─────────────────────────────────────────────────────────────┐
│  Describe Your Project                                      │
│                                                             │
│  Category: [🧱 Masonry/Construction ▼]                      │
│                                                             │
│  Title: [Build storage room at back of house______]         │
│                                                             │
│  Description:                                               │
│  [Need a 3m x 4m storage room built. Foundation,           │
│   block walls, roofing with zinc sheets. Door and          │
│   window needed. Plastering and painting included.__]       │
│                                                             │
│  📷 [Add photos of area] (recommended)                      │
│                                                             │
│  📍 Location: [Tema, Accra___________________]              │
└─────────────────────────────────────────────────────────────┘

Step 2: BUDGET & TIMELINE
┌─────────────────────────────────────────────────────────────┐
│  Budget Range:                                              │
│  [GH₵3,000] - [GH₵4,000]                                    │
│                                                             │
│  Timeline:                                                  │
│  [2 weeks ▼]                                                │
│                                                             │
│  When to start:                                             │
│  [This week] [Next week] [Flexible]                         │
│                                                             │
│  [POST PROJECT]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Proposal & Milestone Agreement

```
WORKER SUBMITS PROPOSAL:
┌─────────────────────────────────────────────────────────────┐
│  Your Proposal                                              │
│                                                             │
│  Total Quote: [GH₵3,500_____]                               │
│                                                             │
│  Message:                                                   │
│  [I have 8 years experience building storage rooms.        │
│   I can start Monday and complete in 10 days._____]         │
│                                                             │
│  Proposed Milestones:                                       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Milestone 1: Foundation & Frame                  │       │
│  │ Amount: GH₵1,200  Duration: 3 days               │       │
│  │ Description: Dig foundation, pour concrete,      │       │
│  │ set up frame for walls.                          │       │
│  └──────────────────────────────────────────────────┘       │
│  [+ Add Milestone]                                          │
│                                                             │
│  [SUBMIT PROPOSAL]                                          │
└─────────────────────────────────────────────────────────────┘

CLIENT ACCEPTS PROPOSAL:
┌─────────────────────────────────────────────────────────────┐
│  Accept Proposal from Kwesi M.?                             │
│                                                             │
│  Total: GH₵3,500                                            │
│                                                             │
│  Milestones:                                                │
│  ✓ 1. Foundation & Frame      GH₵1,200 (3 days)            │
│  ✓ 2. Walls & Roofing         GH₵1,500 (4 days)            │
│  ✓ 3. Finishing & Handover    GH₵800  (3 days)             │
│                                                             │
│  You'll fund each milestone BEFORE it starts.               │
│  Money is held safely until you approve the work.           │
│                                                             │
│  [ACCEPT & FUND MILESTONE 1 - GH₵1,200]                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Milestone Execution

```
MILESTONE IN PROGRESS:
┌─────────────────────────────────────────────────────────────┐
│  Project: Build Storage Room                                │
│  Worker: Kwesi M.                                           │
│                                                             │
│  MILESTONE 1: Foundation & Frame                            │
│  Status: IN PROGRESS                                        │
│  Funded: GH₵1,200 (in escrow)                               │
│  Started: Jan 31, 2026                                      │
│  Due: Feb 3, 2026                                           │
│                                                             │
│  Progress Updates:                                          │
│  ┌────────────────────────────────────────────────┐         │
│  │ Feb 1, 9:30am - Kwesi M.                       │         │
│  │ "Foundation dug, starting concrete pour"       │         │
│  │ [📸 Photo] [📸 Photo]                          │         │
│  └────────────────────────────────────────────────┘         │
│  ┌────────────────────────────────────────────────┐         │
│  │ Jan 31, 2:00pm - Kwesi M.                      │         │
│  │ "Started work, marking out the area"           │         │
│  │ [📸 Photo]                                     │         │
│  └────────────────────────────────────────────────┘         │
│                                                             │
│  [MESSAGE WORKER]                                           │
└─────────────────────────────────────────────────────────────┘

MILESTONE COMPLETE - CLIENT APPROVAL:
┌─────────────────────────────────────────────────────────────┐
│  Milestone 1 Complete - Please Review                       │
│                                                             │
│  Kwesi submitted Milestone 1 for approval.                  │
│                                                             │
│  Completion photos:                                         │
│  [📸] [📸] [📸] [📸]                                        │
│                                                             │
│  Worker note:                                               │
│  "Foundation complete and cured. Frame is up and            │
│  ready for block laying."                                   │
│                                                             │
│  ⓘ Recommended: Visit site to inspect before approving     │
│                                                             │
│  [✅ APPROVE & RELEASE GH₵1,200]                            │
│  [❌ REQUEST CHANGES]                                       │
│  [⚠️ RAISE DISPUTE]                                         │
│                                                             │
│  Next: Milestone 2 - Walls & Roofing (GH₵1,500)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Protection & Verification Systems

### 4.1 Escrow System

```
ESCROW FLOW:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  CLIENT                    KELMAH                   WORKER  │
│    │                       ESCROW                      │    │
│    │                         │                         │    │
│    │  Pay GH₵100             │                         │    │
│    │─────────────────────────>│                        │    │
│    │                         │  Hold funds             │    │
│    │                         │◄────────────────────────│    │
│    │                         │                         │    │
│    │  "Money secured"        │  "Payment guaranteed"   │    │
│    │◄────────────────────────│────────────────────────>│    │
│    │                         │                         │    │
│    │                         │         Worker         │    │
│    │                         │         works          │    │
│    │                         │                         │    │
│    │  "Approve work?"        │  "Marked complete"     │    │
│    │◄────────────────────────│◄────────────────────────│    │
│    │                         │                         │    │
│    │  [APPROVE]              │                         │    │
│    │─────────────────────────>│                        │    │
│    │                         │  Release GH₵90         │    │
│    │                         │────────────────────────>│    │
│    │                         │  Keep GH₵10 fee        │    │
│    │                         │                         │    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 GPS Verification

```
ARRIVAL VERIFICATION:
┌─────────────────────────────────────────────────────────────┐
│  When worker clicks [ARRIVED]:                              │
│                                                             │
│  1. Get worker's GPS coordinates                            │
│  2. Compare with job address coordinates                    │
│  3. If within 100m radius → VERIFIED ✅                     │
│  4. If outside radius → Show warning, allow override        │
│                                                             │
│  Data stored:                                               │
│  {                                                          │
│    "jobId": "xxx",                                          │
│    "workerId": "yyy",                                       │
│    "arrivedAt": "2026-01-31T15:28:00Z",                     │
│    "workerLocation": { "lat": 5.5560, "lng": -0.1969 },     │
│    "jobLocation": { "lat": 5.5563, "lng": -0.1972 },        │
│    "distanceMeters": 42,                                    │
│    "verified": true                                         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Photo Proof System

```
COMPLETION PHOTOS:
┌─────────────────────────────────────────────────────────────┐
│  Required for all jobs:                                     │
│                                                             │
│  • Minimum 1 photo, maximum 5 photos                        │
│  • Photos auto-timestamped                                  │
│  • GPS coordinates embedded in metadata                     │
│  • Cannot use photos from gallery (camera only)             │
│                                                             │
│  Photo metadata stored:                                     │
│  {                                                          │
│    "photoId": "xxx",                                        │
│    "jobId": "yyy",                                          │
│    "uploadedAt": "2026-01-31T16:45:00Z",                    │
│    "location": { "lat": 5.5560, "lng": -0.1969 },           │
│    "deviceId": "worker_phone_xxx",                          │
│    "type": "completion_proof"                               │
│  }                                                          │
│                                                             │
│  Used for:                                                  │
│  • Dispute resolution                                       │
│  • Quality verification                                     │
│  • Worker portfolio building                                │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Identity Verification (Ghana-Specific)

```
WORKER VERIFICATION LEVELS:
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 1: Basic (Required to receive jobs)                  │
│  ─────────────────────────────────────────                  │
│  ✓ Phone number verified (OTP)                              │
│  ✓ Profile photo uploaded                                   │
│  ✓ At least 1 skill selected                                │
│                                                             │
│  LEVEL 2: Verified (Badge shown on profile)                 │
│  ─────────────────────────────────────────                  │
│  ✓ Ghana Card uploaded and validated                        │
│  ✓ Selfie matches Ghana Card photo                          │
│  ✓ Address verified                                         │
│                                                             │
│  LEVEL 3: Professional (Premium placement)                  │
│  ─────────────────────────────────────────                  │
│  ✓ NVTI certificate or trade certification                  │
│  ✓ Business registration (optional)                         │
│  ✓ 10+ completed jobs with 4.5+ rating                      │
│                                                             │
│  Badges displayed:                                          │
│  🆔 ID Verified  |  🛠️ Trade Certified  |  ⭐ Top Rated     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dispute Resolution System

### 5.1 Dispute Flow

```
DISPUTE INITIATED:
┌─────────────────────────────────────────────────────────────┐
│  Dispute: Job #12345                                        │
│                                                             │
│  Client's Issue:                                            │
│  "Worker said pipe is fixed but it's still leaking"         │
│                                                             │
│  Evidence Available:                                        │
│  • Worker's completion photos (2)                           │
│  • GPS arrival verification ✓                               │
│  • Time on site: 45 minutes                                 │
│                                                             │
│  Options:                                                   │
│  [WORKER TO FIX] Worker returns to fix at no extra cost     │
│  [PARTIAL REFUND] Split payment based on work done          │
│  [FULL REFUND] Cancel and refund client                     │
│  [ESCALATE] Send to Kelmah support team                     │
└─────────────────────────────────────────────────────────────┘

DISPUTE RESOLUTION:
┌─────────────────────────────────────────────────────────────┐
│  Resolution Steps:                                          │
│                                                             │
│  1. Automated check (photos, GPS, time)                     │
│  2. Both parties can add evidence/comments (24hr window)    │
│  3. If no agreement → Kelmah team reviews (24-48hrs)        │
│  4. Final decision issued                                   │
│                                                             │
│  Possible Outcomes:                                         │
│  • Worker returns to fix (most common)                      │
│  • Partial refund to client                                 │
│  • Full refund to client                                    │
│  • Full payment to worker (false claim)                     │
│                                                             │
│  Repeated disputes affect user ratings and standing.        │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Payment Integration (Ghana)

### 6.1 Supported Payment Methods

```
CLIENT PAYMENT OPTIONS:
┌─────────────────────────────────────────────────────────────┐
│  Mobile Money (Preferred):                                  │
│  • MTN Mobile Money                                         │
│  • Vodafone Cash                                            │
│  • AirtelTigo Money                                         │
│                                                             │
│  Cards:                                                     │
│  • Visa/Mastercard (via Paystack/Flutterwave)               │
│                                                             │
│  Bank Transfer:                                             │
│  • Direct bank transfer (for large projects)                │
└─────────────────────────────────────────────────────────────┘

WORKER PAYOUT OPTIONS:
┌─────────────────────────────────────────────────────────────┐
│  Instant Payout (on job completion):                        │
│  • MTN Mobile Money (default)                               │
│  • Vodafone Cash                                            │
│  • AirtelTigo Money                                         │
│                                                             │
│  Scheduled Payout (weekly):                                 │
│  • Bank Transfer                                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Fee Structure

```
PLATFORM FEES:
┌─────────────────────────────────────────────────────────────┐
│  Quick Jobs (Under GH₵500):                                 │
│  • Platform fee: 10% (deducted from worker payment)         │
│  • Example: GH₵100 job → Worker receives GH₵90              │
│                                                             │
│  Projects (Over GH₵500):                                    │
│  • Platform fee: 10% (deducted from each milestone)         │
│  • Example: GH₵3,500 project → Worker receives GH₵3,150     │
│                                                             │
│  Payment Processing:                                        │
│  • Mobile Money: No additional fee                          │
│  • Card payment: 1.5% (passed to client)                    │
│                                                             │
│  No fee for:                                                │
│  • Posting jobs                                             │
│  • Sending quotes                                           │
│  • Messaging                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Implementation Plan

### 7.1 Database Schema Changes

```javascript
// NEW: JobRequest (for Quick Jobs)
{
  _id: ObjectId,
  type: "quick_job",
  category: String,          // "plumbing", "electrical", etc.
  description: String,       // Brief description
  photos: [String],          // URLs
  location: {
    type: "Point",
    coordinates: [Number],   // [lng, lat]
    address: String,
    city: String,
    region: String
  },
  urgency: String,           // "emergency", "soon", "flexible"
  status: String,            // "open", "quoted", "accepted", "in_progress", "completed", "disputed", "cancelled"
  client: ObjectId,          // ref: User
  quotes: [{
    worker: ObjectId,
    amount: Number,
    message: String,
    availableAt: Date,
    createdAt: Date
  }],
  acceptedQuote: {
    worker: ObjectId,
    amount: Number,
    acceptedAt: Date
  },
  escrow: {
    amount: Number,
    status: String,          // "pending", "held", "released", "refunded"
    transactionId: String,
    paidAt: Date,
    releasedAt: Date
  },
  tracking: {
    workerOnWay: Date,
    workerArrived: Date,
    arrivedLocation: { lat: Number, lng: Number },
    arrivedVerified: Boolean,
    workCompleted: Date,
    completionPhotos: [String],
    clientApproved: Date
  },
  dispute: {
    raisedBy: String,        // "client" or "worker"
    reason: String,
    raisedAt: Date,
    resolution: String,
    resolvedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// ENHANCED: Job (for Projects) - add milestone tracking
{
  // ... existing fields ...
  type: "project",
  milestones: [{
    _id: ObjectId,
    title: String,
    description: String,
    amount: Number,
    duration: Number,        // days
    order: Number,
    status: String,          // "pending", "funded", "in_progress", "submitted", "approved", "disputed"
    escrow: {
      status: String,
      transactionId: String,
      fundedAt: Date,
      releasedAt: Date
    },
    updates: [{
      message: String,
      photos: [String],
      createdAt: Date
    }],
    submittedAt: Date,
    approvedAt: Date
  }]
}

// NEW: WorkerAvailability
{
  _id: ObjectId,
  worker: ObjectId,
  status: String,            // "available", "busy", "offline"
  availableFrom: Date,
  availableUntil: Date,
  currentLocation: {
    type: "Point",
    coordinates: [Number]
  },
  lastUpdated: Date
}
```

### 7.2 New API Endpoints

```
QUICK JOBS:
POST   /api/quick-jobs              Create job request
GET    /api/quick-jobs              List nearby job requests (for workers)
GET    /api/quick-jobs/:id          Get job request details
POST   /api/quick-jobs/:id/quote    Submit quote (worker)
POST   /api/quick-jobs/:id/accept   Accept quote (client)
POST   /api/quick-jobs/:id/fund     Fund escrow (client)
POST   /api/quick-jobs/:id/on-way   Mark on way (worker)
POST   /api/quick-jobs/:id/arrived  Mark arrived with GPS (worker)
POST   /api/quick-jobs/:id/complete Mark complete with photos (worker)
POST   /api/quick-jobs/:id/approve  Approve and release payment (client)
POST   /api/quick-jobs/:id/dispute  Raise dispute

PROJECTS:
POST   /api/projects/:id/milestones/:mid/fund     Fund milestone
POST   /api/projects/:id/milestones/:mid/start    Start milestone
POST   /api/projects/:id/milestones/:mid/update   Add progress update
POST   /api/projects/:id/milestones/:mid/submit   Submit for approval
POST   /api/projects/:id/milestones/:mid/approve  Approve milestone

WORKER AVAILABILITY:
GET    /api/workers/availability     Get worker availability status
PUT    /api/workers/availability     Update availability
GET    /api/workers/nearby           Find workers near location

ESCROW:
POST   /api/escrow/hold              Hold funds
POST   /api/escrow/release           Release to worker
POST   /api/escrow/refund            Refund to client
GET    /api/escrow/:id/status        Check escrow status
```

### 7.3 Frontend Components to Create

```
NEW COMPONENTS:
├── QuickJobFlow/
│   ├── ServiceSelector.jsx         # Category icons
│   ├── JobDescriptionForm.jsx      # Brief description + photo
│   ├── UrgencySelector.jsx         # Emergency/Soon/Flexible
│   ├── QuoteCard.jsx               # Display worker quote
│   ├── QuotesList.jsx              # List of received quotes
│   ├── PaymentConfirmation.jsx     # Escrow payment
│   └── JobTracker.jsx              # Track worker arrival/completion
│
├── WorkerQuickJob/
│   ├── JobAlert.jsx                # New job notification
│   ├── QuoteForm.jsx               # Send quote
│   ├── ActiveJobCard.jsx           # Current job in progress
│   ├── ArrivalButton.jsx           # GPS verified arrival
│   ├── CompletionUpload.jsx        # Photo proof upload
│   └── JobTimeline.jsx             # On way → Arrived → Complete
│
├── ProjectFlow/
│   ├── MilestoneBuilder.jsx        # Create milestones
│   ├── MilestoneTracker.jsx        # Track milestone progress
│   ├── MilestoneApproval.jsx       # Approve milestone
│   └── ProgressUpdateCard.jsx      # Show progress updates
│
├── Payment/
│   ├── MobileMoneySelector.jsx     # MTN/Vodafone/Airtel
│   ├── EscrowStatus.jsx            # Show escrow state
│   └── PayoutSettings.jsx          # Worker payout preferences
│
├── Verification/
│   ├── GhanaCardUpload.jsx         # ID verification
│   ├── SelfieVerification.jsx      # Photo match
│   └── VerificationBadges.jsx      # Display badges
│
└── Dispute/
    ├── DisputeForm.jsx             # Raise dispute
    ├── EvidenceUpload.jsx          # Add evidence
    └── DisputeTimeline.jsx         # Track resolution
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create JobRequest model for Quick Jobs
- [ ] Build Quick Job creation flow (3 steps)
- [ ] Build Quote submission and acceptance
- [ ] Implement basic escrow hold/release
- [ ] Simplify existing job posting (remove milestones for small jobs)

### Phase 2: Worker Experience (Week 3-4)
- [ ] Build worker job alerts system
- [ ] Implement quote sending flow
- [ ] Add GPS arrival verification
- [ ] Build completion photo upload
- [ ] Create job progress timeline

### Phase 3: Payment Integration (Week 5-6)
- [ ] Integrate Mobile Money APIs (MTN, Vodafone, AirtelTigo)
- [ ] Build escrow management system
- [ ] Implement auto-release after 24hrs
- [ ] Add payout to workers

### Phase 4: Projects & Milestones (Week 7-8)
- [ ] Enhance existing Job model with milestones
- [ ] Build milestone funding flow
- [ ] Build milestone progress updates
- [ ] Implement milestone approval

### Phase 5: Trust & Safety (Week 9-10)
- [ ] Build dispute resolution system
- [ ] Implement Ghana Card verification
- [ ] Add verification badges
- [ ] Build worker availability system

### Phase 6: Polish & Launch (Week 11-12)
- [ ] Mobile optimization
- [ ] Performance testing
- [ ] User testing with real vocational workers
- [ ] Launch MVP

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first quote | < 30 mins | From job post to first quote |
| Job completion rate | > 85% | Jobs completed vs started |
| Payment release time | < 5 mins | From approval to worker payout |
| Dispute rate | < 5% | Disputes vs completed jobs |
| Worker return rate | > 60% | Workers completing 2+ jobs |
| Client return rate | > 50% | Clients posting 2+ jobs |
| App rating | > 4.5 | Google Play / App Store |

---

## 10. Finalized Decisions (January 31, 2026)

### Payment & Fees
| Decision | Answer |
|----------|--------|
| Payment Provider | **Paystack** (handles MTN MoMo, Vodafone Cash, AirtelTigo, Cards) |
| Platform Fee | **15%** (deducted from worker payment) |
| Minimum Job Amount | **GH₵25** (to ensure platform fee is worthwhile) |

### Verification Requirements
| Decision | Answer |
|----------|--------|
| Worker Verification | **REQUIRED** - All workers must verify Ghana Card before receiving any job |
| Client Verification | **REQUIRED** - Clients must also verify identity |

### Dispute Resolution
| Decision | Answer |
|----------|--------|
| Minor Disputes | **Auto-resolve** within 48 hours based on evidence (photos, GPS, time) |
| Serious Disputes | **Support staff** handles - timeline varies based on complexity |

### Cancellation Policies
| Scenario | Policy |
|----------|--------|
| Client cancels BEFORE worker leaves | **Full refund** to client (but must communicate properly) |
| Client cancels AFTER worker is on the way | Worker receives **5%** compensation (worker must report to support) |
| Worker cancels | **Rating penalty** → After multiple cancellations: **Temporary suspension** |

### Geographic & Business Scope
| Decision | Answer |
|----------|--------|
| Launch Region | **Nationwide** from start |
| Maximum Job Amount | Depends on job type/contract |

### Materials Handling
| Scenario | Policy |
|----------|--------|
| Default | **Client purchases materials** based on worker's material budget list |
| Client wants worker to buy | **Controlled release system** - money released in stages, monitored to prevent fraud |

### Scope Changes (Extra Work Discovered On-Site)
| Option | Available |
|--------|-----------|
| Add to existing escrow | ✅ Yes - Worker requests → Client approves → Added to escrow |
| Create new job | ✅ Yes - For significant additional work |

### Technical Implementation
| Feature | Decision |
|---------|----------|
| Push Notifications | **Firebase Cloud Messaging** |
| Critical Alerts | **SMS** (job accepted, payment received, disputes) |
| Messaging | **WhatsApp integration** for direct communication |
| Offline Support | **YES** - View job details offline, queue actions when offline |

---

## 11. Fee Calculation Examples

### Quick Job Example (GH₵100)
```
Client pays:     GH₵100.00
Escrow holds:    GH₵100.00
Platform fee:    GH₵15.00 (15%)
Worker receives: GH₵85.00
```

### Project Example (GH₵3,500 in 3 milestones)
```
Milestone 1: GH₵1,200 → Worker receives GH₵1,020
Milestone 2: GH₵1,500 → Worker receives GH₵1,275  
Milestone 3: GH₵800  → Worker receives GH₵680
─────────────────────────────────────────────────
Total:       GH₵3,500 → Worker receives GH₵2,975
Platform fee total: GH₵525
```

---

*Document Version: 1.1*
*Last Updated: January 31, 2026*
*Status: FINALIZED - Ready for Implementation*
*Next Review: After Phase 1 completion*
