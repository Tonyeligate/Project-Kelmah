/**
 * Enhanced Test User Data
 * Comprehensive user profile to replace mock data across the application
 */

export const enhancedTestUser = {
  // Basic Profile
  id: 'test-user-123',
  email: 'kwame.asante@example.com',
  firstName: 'Kwame',
  lastName: 'Asante',
  fullName: 'Kwame Asante',
  role: 'worker',
  phone: '+233 24 123 4567',
  profileImage:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMWExYTFhIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjRkZENzAwIi8+CjxwYXRoIGQ9Im0zMCAxMjBjMC0yNSAyMC00NSA0NS00NXM0NSAyMCA0NSA0NSIgZmlsbD0iI0ZGRDcwMCIvPgo8L3N2Zz4K',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  nationality: 'Ghanaian',

  // Location
  location: {
    city: 'Accra',
    region: 'Greater Accra',
    country: 'Ghana',
    address: '123 Liberation Road, Accra',
    coordinates: {
      latitude: 5.6037,
      longitude: -0.187,
    },
  },

  // Professional Profile
  profession: 'Professional Electrician',
  specialization: 'Residential & Commercial Electrical Installation',
  experience: '8 years',
  rating: 4.8,
  completedJobs: 127,
  totalEarnings: 45600.5,
  currency: 'GHS',

  // Skills & Certifications
  skills: [
    {
      name: 'Electrical Installation',
      level: 'Expert',
      certified: true,
      yearsExperience: 8,
      description:
        'Complete electrical system installation for residential and commercial buildings',
    },
    {
      name: 'Circuit Repair & Maintenance',
      level: 'Expert',
      certified: true,
      yearsExperience: 7,
      description:
        'Diagnosis and repair of electrical faults and circuit issues',
    },
    {
      name: 'Solar Panel Installation',
      level: 'Advanced',
      certified: true,
      yearsExperience: 4,
      description: 'Installation and maintenance of solar power systems',
    },
    {
      name: 'Industrial Electrical Systems',
      level: 'Intermediate',
      certified: false,
      yearsExperience: 3,
      description: 'Basic industrial electrical equipment maintenance',
    },
  ],

  licenses: [
    {
      type: 'Electrical Installation License',
      issuer: 'Ghana Standards Authority',
      number: 'EL-2023-001234',
      issueDate: '2023-01-15',
      expiryDate: '2025-01-15',
      status: 'active',
      category: 'Professional',
    },
    {
      type: 'Solar Installation Certification',
      issuer: 'Renewable Energy Association of Ghana',
      number: 'SOL-2022-567',
      issueDate: '2022-06-20',
      expiryDate: '2024-06-20',
      status: 'active',
      category: 'Specialty',
    },
  ],

  certifications: [
    {
      name: 'Certified Electrician',
      issuer: 'Ghana Institute of Engineers',
      issueDate: '2022-08-20',
      validUntil: '2024-08-20',
      credentialId: 'GIE-ELEC-2022-1234',
    },
    {
      name: 'Occupational Safety & Health',
      issuer: 'Ghana Labour Department',
      issueDate: '2023-03-10',
      validUntil: '2025-03-10',
      credentialId: 'OSH-2023-5678',
    },
  ],

  // Availability
  availability: {
    status: 'available',
    lastUpdated: new Date().toISOString(),
    schedule: {
      monday: { start: '08:00', end: '17:00', available: true },
      tuesday: { start: '08:00', end: '17:00', available: true },
      wednesday: { start: '08:00', end: '17:00', available: true },
      thursday: { start: '08:00', end: '17:00', available: true },
      friday: { start: '08:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { available: false },
    },
    nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    hourlyRate: 85,
    minJobDuration: 2,
    maxJobsPerDay: 3,
  },

  // Recent Job History
  recentJobs: [
    {
      id: 'job-001',
      title: 'Residential Electrical Rewiring',
      client: 'Sarah Mitchell',
      location: 'East Legon, Accra',
      status: 'completed',
      startDate: '2024-01-10',
      completedDate: '2024-01-12',
      earnings: 2800,
      rating: 5,
      feedback:
        'Excellent work, very professional and completed ahead of schedule.',
    },
    {
      id: 'job-002',
      title: 'Solar Panel Installation',
      client: 'Tech Solutions Ltd',
      location: 'Airport City, Accra',
      status: 'completed',
      startDate: '2024-01-15',
      completedDate: '2024-01-18',
      earnings: 4500,
      rating: 5,
      feedback: 'Outstanding solar installation, exceeded our expectations.',
    },
    {
      id: 'job-003',
      title: 'Office Electrical Maintenance',
      client: 'GhanaCorp Industries',
      location: 'Tema, Greater Accra',
      status: 'in-progress',
      startDate: '2024-01-25',
      estimatedCompletion: '2024-01-27',
      earnings: 1800,
    },
  ],

  // Performance Metrics
  metrics: {
    jobsCompleted: 127,
    totalEarnings: 45600.5,
    averageRating: 4.8,
    onTimeCompletion: 96,
    clientRetention: 89,
    responseTime: '< 2 hours',
    monthlyStats: [
      { month: 'Jan 2024', jobs: 12, earnings: 8400, rating: 4.9 },
      { month: 'Dec 2023', jobs: 11, earnings: 7800, rating: 4.8 },
      { month: 'Nov 2023', jobs: 10, earnings: 7200, rating: 4.7 },
      { month: 'Oct 2023', jobs: 13, earnings: 9100, rating: 4.8 },
    ],
    skillDistribution: {
      'Electrical Installation': 45,
      'Circuit Repair': 30,
      'Solar Installation': 20,
      Maintenance: 5,
    },
  },

  // Financial Info
  wallet: {
    balance: 2850.75,
    pendingEarnings: 1800.0,
    currency: 'GHS',
    accountNumber: '****-1234',
    bank: 'GCB Bank',
    paymentMethods: [
      {
        id: 'pm-1',
        type: 'bank_account',
        name: 'GCB Savings Account',
        details: '****-1234',
        isDefault: true,
        status: 'verified',
      },
      {
        id: 'pm-2',
        type: 'mobile_money',
        name: 'MTN Mobile Money',
        details: '+233-24-***-4567',
        isDefault: false,
        status: 'verified',
      },
    ],
  },

  // Notifications & Messages
  notifications: [
    {
      id: 'notif-1',
      type: 'job_application',
      title: 'New Job Application',
      message: 'You have a new job application for "Residential Wiring"',
      isRead: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      type: 'payment_received',
      title: 'Payment Received',
      message: 'GHS 2,800 has been credited to your wallet',
      isRead: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  unreadNotifications: 3,
  unreadMessages: 2,

  // Preferences
  preferences: {
    language: 'en',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    notifications: {
      email: true,
      sms: true,
      push: true,
      jobAlerts: true,
      paymentUpdates: true,
    },
    workPreferences: {
      maxTravelDistance: 25, // km
      preferredJobTypes: ['residential', 'commercial'],
      minimumJobValue: 500,
      workingHours: 'flexible',
    },
  },

  // Account Status
  status: 'active',
  verified: true,
  premium: false,
  joinDate: '2022-03-15',
  lastLogin: new Date().toISOString(),

  // Social/Reviews
  reviews: [
    {
      id: 'rev-1',
      client: 'Sarah Mitchell',
      rating: 5,
      comment:
        'Kwame is extremely professional and skilled. Completed our home rewiring project efficiently and safely.',
      date: '2024-01-12',
      jobType: 'Residential Electrical',
    },
    {
      id: 'rev-2',
      client: 'Tech Solutions Ltd',
      rating: 5,
      comment:
        'Outstanding solar panel installation. Kwame explained everything clearly and delivered exceptional results.',
      date: '2024-01-18',
      jobType: 'Solar Installation',
    },
  ],

  // Emergency Contact
  emergencyContact: {
    name: 'Ama Asante',
    relationship: 'Wife',
    phone: '+233 20 987 6543',
  },
};

// Mock data generators based on the enhanced user
export const generateUserSpecificMockData = (user = enhancedTestUser) => ({
  // Dashboard metrics specific to this user
  dashboardMetrics: {
    totalJobs: user.metrics.jobsCompleted,
    activeJobs: user.recentJobs.filter((j) => j.status === 'in-progress')
      .length,
    totalEarnings: user.metrics.totalEarnings,
    averageRating: user.metrics.averageRating,
    completionRate: user.metrics.onTimeCompletion,
    responseTime: user.metrics.responseTime,
  },

  // Available jobs relevant to user's skills
  relevantJobs: [
    {
      id: 'job-r1',
      title: 'Commercial Building Electrical Installation',
      description:
        'Complete electrical installation for new 3-story commercial building in Accra.',
      budget: 15000,
      location: 'Airport City, Accra',
      urgency: 'medium',
      skillsRequired: ['Electrical Installation', 'Commercial Systems'],
      matchScore: 95, // High match for user's skills
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'job-r2',
      title: 'Solar Panel System Maintenance',
      description:
        'Quarterly maintenance for solar panel installation at residential complex.',
      budget: 2500,
      location: 'East Legon, Accra',
      urgency: 'low',
      skillsRequired: ['Solar Installation', 'Maintenance'],
      matchScore: 88,
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // User-specific appointments
  appointments: [
    {
      id: 'apt-1',
      jobTitle: 'Residential Electrical Inspection',
      client: 'John Doe',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      startTime: new Date(
        Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
      ).toISOString(),
      endTime: new Date(
        Date.now() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000,
      ).toISOString(),
      status: 'confirmed',
      location: 'Cantonments, Accra',
      type: 'site_visit',
    },
  ],
});
