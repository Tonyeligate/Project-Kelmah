# Kelmah Job Distribution & Bidding System Specification

## 📋 **Project Overview**
**Platform**: Kelmah - Ghana's Skilled Trades Platform  
**Purpose**: Connect verified skilled workers with hirers through intelligent job distribution and fair bidding system  
**Target Users**: Illiterate/semi-literate skilled tradespeople in Ghana  
**Documentation Date**: January 2025  

---

## 🎯 **Core System Requirements**

### **1. Job Integration with Hirers**
- **Integration Method**: Real-time job posting from hirers via API
- **Job Data Source**: Existing hirer-posted jobs (not mock data)
- **Update Frequency**: Real-time updates for job status, availability, and requirements
- **Job Lifecycle**: 30-day auto-expiry with renewal options

### **2. User Skill Management System**
- **Primary Skills**: Selected during registration (fixed, cannot be changed)
- **Secondary Skills**: Users can add up to 3 additional skills with conditions:
  - Minimum 6 months experience in primary skill required
  - Verification required for each secondary skill
  - 30-day cooldown period between adding new skills
- **Skill Categories**: Plumbing, Electrical, Carpentry, Construction, Painting, Welding, Masonry

### **3. Location-Based Distribution**
- **Primary Focus**: Major cities in Ghana
- **Coverage Areas**: 
  - Greater Accra (Accra, Tema, Kasoa, Madina)
  - Ashanti (Kumasi, Obuasi, Ejisu)
  - Western (Takoradi, Sekondi, Tarkwa)
  - Eastern (Koforidua, Akosombo, Nkawkaw)
  - Central (Cape Coast, Kasoa, Winneba)
  - Volta (Ho, Keta, Hohoe)
- **Future Expansion**: Framework ready for rural areas and cross-border expansion

### **4. Performance-Based Job Visibility**
- **Tier 1 - Premium Access**: Verified skills + 90% performance + complete profile
  - Benefits: First-hand jobs, exclusive opportunities, priority bidding
  - Job Access: Immediate
- **Tier 2 - Verified Access**: Verified primary skill + 75% performance
  - Benefits: Verified jobs, early access
  - Job Access: 2-hour delay
- **Tier 3 - Standard Access**: Basic verification + 60% performance
  - Benefits: Standard jobs
  - Job Access: 24-hour delay

### **5. Bidding System with Limits**
- **Job Bidding Limits**:
  - Maximum 5 bidders per job
  - Maximum 5 bids per user per month
  - 24-hour cooldown between bids on same job
- **Bid Amounts**: Set by hirer (minimum/maximum bid amounts)
- **Bid Management**: One bid per job, modification allowed before deadline

---

## 🔧 **Technical Implementation**

### **Enhanced Job Model Structure**
```javascript
const EnhancedJobSchema = {
  // Existing fields from current Job model
  title: String,
  description: String,
  category: String,
  skills: [String],
  budget: Number,
  currency: String,
  duration: { value: Number, unit: String },
  paymentType: String,
  location: { type: String, country: String, city: String },
  status: String,
  visibility: String,
  attachments: [Object],
  hirer: ObjectId,
  worker: ObjectId,
  proposalCount: Number,
  viewCount: Number,
  startDate: Date,
  endDate: Date,
  completedDate: Date,
  
  // New fields for enhanced system
  bidding: {
    maxBidders: { type: Number, default: 5 },
    currentBidders: { type: Number, default: 0 },
    bidDeadline: Date,
    minBidAmount: Number,
    maxBidAmount: Number,
    bidStatus: { type: String, enum: ["open", "closed", "full"] }
  },
  locationDetails: {
    region: String,
    district: String,
    coordinates: { lat: Number, lng: Number },
    searchRadius: Number
  },
  requirements: {
    primarySkills: [String],
    secondarySkills: [String],
    experienceLevel: String,
    certifications: [String],
    tools: [String]
  },
  performanceTier: {
    type: String,
    enum: ["tier1", "tier2", "tier3"],
    default: "tier3"
  }
}
```

### **Enhanced Application/Bid Model**
```javascript
const BidSchema = {
  job: { type: ObjectId, ref: "Job", required: true },
  worker: { type: ObjectId, ref: "User", required: true },
  bidAmount: { type: Number, required: true },
  estimatedDuration: { value: Number, unit: String },
  coverLetter: String,
  portfolio: [String],
  availability: String,
  bidTimestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "withdrawn"],
    default: "pending"
  },
  monthlyBidCount: Number, // Track monthly bid usage
  performanceScore: Number // User's performance score at time of bid
}
```

### **User Performance Tracking**
```javascript
const UserPerformanceSchema = {
  userId: { type: ObjectId, ref: "User", required: true },
  metrics: {
    jobCompletionRate: Number,
    clientSatisfaction: Number,
    responseTime: Number,
    profileCompleteness: Number,
    verifiedSkillsCount: Number
  },
  performanceTier: String,
  monthlyBidQuota: { type: Number, default: 5 },
  bidHistory: [{
    jobId: ObjectId,
    bidDate: Date,
    outcome: String
  }],
  lastUpdated: { type: Date, default: Date.now }
}
```

---

## 🎨 **UI/UX Enhancements for Illiterate Users**

### **Visual Job Discovery**
- **Icon-Based Categories**: 🔧 Plumbing, ⚡ Electrical, 🔨 Carpentry, 🏗️ Construction, 🎨 Painting, 🔥 Welding
- **Color-Coded Status**: Red (Urgent), Green (Verified), Gold (Premium), Blue (New)
- **Location Indicators**: 🏠 Nearby, 🏙️ Regional, 🌍 National
- **Performance Indicators**: Visual badges for user performance tiers

### **Simplified Navigation**
- **Icon + Text**: All navigation items have both icons and text
- **Large Touch Targets**: Minimum 44px touch targets for mobile
- **High Contrast**: Yellow/black color scheme for maximum readability
- **Visual Feedback**: Clear visual states for all interactive elements

---

## 🔄 **Job Distribution Algorithm**

### **Multi-Factor Scoring System**
```javascript
const distributionFactors = {
  userPerformance: 0.30,    // 30% weight
  skillMatch: 0.25,         // 25% weight  
  locationProximity: 0.20,  // 20% weight
  availability: 0.15,       // 15% weight
  bidHistory: 0.10          // 10% weight
}

const calculateJobScore = (job, user) => {
  let score = 0;
  
  // Skill matching
  const skillMatch = calculateSkillMatch(job.requiredSkills, user.skills);
  score += skillMatch * 0.25;
  
  // Location proximity
  const locationScore = calculateLocationScore(job.location, user.location);
  score += locationScore * 0.20;
  
  // User performance tier
  const performanceScore = getUserPerformanceScore(user);
  score += performanceScore * 0.30;
  
  // Availability match
  const availabilityScore = checkAvailabilityMatch(job, user);
  score += availabilityScore * 0.15;
  
  // Bid history success rate
  const bidHistoryScore = calculateBidSuccessRate(user);
  score += bidHistoryScore * 0.10;
  
  return Math.min(100, Math.max(0, score));
}
```

### **Distribution Process**
1. **Filter Jobs**: By user's primary and secondary skills
2. **Apply Location Filtering**: Based on user's location preferences
3. **Check Performance Tier**: Apply visibility rules based on user tier
4. **Calculate Match Scores**: For each eligible job
5. **Distribute Jobs**: Based on tier and match score
6. **Reserve Spots**: For high-performance users
7. **Release Remaining**: To standard users after delay

---

## 🛡️ **Dispute Resolution System (Existing Enhancement)**

### **Current System Analysis**
Your codebase already has a solid dispute resolution foundation:
- **Models**: `Dispute.js`, `ContractDispute.js`
- **Controllers**: `dispute.controller.js`, `contract.controller.js`
- **Frontend**: `DisputeManagement.jsx` with comprehensive admin interface

### **Recommended Enhancements**
```javascript
const EnhancedDisputeSchema = {
  // Existing fields
  contractId: ObjectId,
  raisedBy: ObjectId,
  reason: String,
  status: String,
  resolution: String,
  
  // Enhanced fields
  category: { 
    type: String, 
    enum: ["payment", "quality", "communication", "scope", "other"] 
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"] 
  },
  evidence: [{
    type: String, // "image", "document", "message"
    url: String,
    description: String,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],
  mediation: {
    assignedAgent: ObjectId,
    agentNotes: String,
    resolutionSteps: [String],
    resolutionDate: Date
  },
  escalation: {
    escalated: Boolean,
    escalatedTo: String, // "senior_agent", "legal_team"
    escalationReason: String
  }
}
```

### **Agent Assignment System**
- **Field Agents**: For in-person verification and interviews
- **Remote Agents**: For online dispute resolution
- **Specialized Agents**: For different dispute categories
- **Escalation Path**: Senior agents → Legal team → External arbitration

---

## 📊 **Implementation Phases**

### **Phase 1: Foundation (2 months)**
- [ ] Enhanced job model implementation
- [ ] Basic bidding system with limits
- [ ] User performance tracking
- [ ] Location-based filtering
- [ ] Primary skill registration flow

### **Phase 2: Intelligence (3 months)**
- [ ] Performance-based job visibility
- [ ] Secondary skill management
- [ ] Advanced job distribution algorithm
- [ ] Real-time job updates
- [ ] Enhanced dispute resolution

### **Phase 3: Optimization (6 months)**
- [ ] AI-powered job matching
- [ ] Predictive analytics
- [ ] Mobile app optimization
- [ ] Rural area expansion
- [ ] Cross-border capabilities

---

## 🎯 **Success Metrics**

### **User Engagement**
- Job application success rate
- User retention rate
- Time to first job application
- User satisfaction scores

### **Platform Performance**
- Job posting to application ratio
- Average time to fill jobs
- Dispute resolution time
- Geographic coverage expansion

### **Business Metrics**
- Monthly active users
- Job completion rate
- Revenue per user
- Market penetration in target regions

---

## 🔮 **Future Considerations**

### **Payment Integration** (Deferred)
- Mobile Money integration
- Bank transfer support
- Escrow system implementation
- Multi-currency support

### **Seasonal Work Patterns**
- Agricultural season adjustments
- Construction peak periods
- Weather-based job availability
- Holiday season considerations

### **Advanced Features**
- Video job interviews
- Skill assessment tests
- Portfolio verification
- Peer review system

---

## 📝 **Documentation Notes**

### **Key Decisions Made**
1. **Bid Amounts**: Set by hirer (minimum/maximum)
2. **Skill Verification**: Personal info + background check + agent interviews
3. **Payment System**: Deferred for special attention
4. **Dispute Resolution**: Enhanced existing system with agent assignment
5. **Seasonal Work**: Applicable but not current focus

### **Room for Improvement**
- All systems designed with scalability in mind
- Framework ready for rural expansion
- Payment integration framework prepared
- Advanced analytics capabilities planned
- Cross-border expansion framework designed

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025  
**Status**: Ready for Implementation
