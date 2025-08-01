/**
 * Real Test Users Data
 * Based on the actual test accounts provided by the user
 */

export const TEST_USERS_DATA = {
  // Accra, Greater Accra Region
  'kwame.asante1@kelmah.test': {
    id: 'user-kwame-asante-001',
    email: 'kwame.asante1@kelmah.test',
    firstName: 'Kwame',
    lastName: 'Asante',
    fullName: 'Kwame Asante',
    role: 'worker',
    phone: '+233 24 345 6789',
    profession: 'Plumber',
    hourlyRate: 45,
    experience: '6 years',
    rating: 4.7,
    completedJobs: 89,
    location: {
      city: 'Accra',
      region: 'Greater Accra Region',
      country: 'Ghana',
      coordinates: { latitude: 5.6037, longitude: -0.1870 }
    },
    skills: ['Pipe Installation', 'Drain Repair', 'Water Heater Maintenance', 'Leak Detection'],
    verified: true,
    status: 'active',
    totalEarnings: 32450.00
  },
  
  'efua.mensah2@kelmah.test': {
    id: 'user-efua-mensah-002',
    email: 'efua.mensah2@kelmah.test',
    firstName: 'Efua',
    lastName: 'Mensah',
    fullName: 'Efua Mensah',
    role: 'worker',
    phone: '+233 20 456 7890',
    profession: 'Plumber',
    hourlyRate: 45,
    experience: '4 years',
    rating: 4.5,
    completedJobs: 67,
    location: {
      city: 'Accra',
      region: 'Greater Accra Region',
      country: 'Ghana',
      coordinates: { latitude: 5.6037, longitude: -0.1870 }
    },
    skills: ['Residential Plumbing', 'Bathroom Installation', 'Emergency Repairs'],
    verified: true,
    status: 'active',
    totalEarnings: 28900.00
  },

  'kwaku.osei3@kelmah.test': {
    id: 'user-kwaku-osei-003',
    email: 'kwaku.osei3@kelmah.test',
    firstName: 'Kwaku',
    lastName: 'Osei',
    fullName: 'Kwaku Osei',
    role: 'worker',
    phone: '+233 26 567 8901',
    profession: 'Electrician',
    hourlyRate: 50,
    experience: '8 years',
    rating: 4.9,
    completedJobs: 124,
    location: {
      city: 'Accra',
      region: 'Greater Accra Region',
      country: 'Ghana',
      coordinates: { latitude: 5.6037, longitude: -0.1870 }
    },
    skills: ['Electrical Installation', 'Solar Panel Setup', 'Circuit Repair', 'Wiring'],
    verified: true,
    status: 'active',
    totalEarnings: 45600.00
  },

  'yaa.adjei4@kelmah.test': {
    id: 'user-yaa-adjei-004',
    email: 'yaa.adjei4@kelmah.test',
    firstName: 'Yaa',
    lastName: 'Adjei',
    fullName: 'Yaa Adjei',
    role: 'worker',
    phone: '+233 24 678 9012',
    profession: 'Electrician',
    hourlyRate: 50,
    experience: '5 years',
    rating: 4.6,
    completedJobs: 78,
    location: {
      city: 'Accra',
      region: 'Greater Accra Region',
      country: 'Ghana',
      coordinates: { latitude: 5.6037, longitude: -0.1870 }
    },
    skills: ['Home Wiring', 'Light Installation', 'Electrical Troubleshooting'],
    verified: true,
    status: 'active',
    totalEarnings: 35200.00
  },

  // Kumasi, Ashanti Region
  'fiifi.boateng5@kelmah.test': {
    id: 'user-fiifi-boateng-005',
    email: 'fiifi.boateng5@kelmah.test',
    firstName: 'Fiifi',
    lastName: 'Boateng',
    fullName: 'Fiifi Boateng',
    role: 'worker',
    phone: '+233 20 789 0123',
    profession: 'Carpenter',
    hourlyRate: 40,
    experience: '7 years',
    rating: 4.8,
    completedJobs: 95,
    location: {
      city: 'Kumasi',
      region: 'Ashanti Region',
      country: 'Ghana',
      coordinates: { latitude: 6.6885, longitude: -1.6244 }
    },
    skills: ['Custom Furniture', 'Cabinet Making', 'Wood Finishing', 'Repairs'],
    verified: true,
    status: 'active',
    totalEarnings: 38000.00
  },

  'afia.owusu6@kelmah.test': {
    id: 'user-afia-owusu-006',
    email: 'afia.owusu6@kelmah.test',
    firstName: 'Afia',
    lastName: 'Owusu',
    fullName: 'Afia Owusu',
    role: 'worker',
    phone: '+233 26 890 1234',
    profession: 'Carpenter',
    hourlyRate: 40,
    experience: '4 years',
    rating: 4.4,
    completedJobs: 62,
    location: {
      city: 'Kumasi',
      region: 'Ashanti Region',
      country: 'Ghana',
      coordinates: { latitude: 6.6885, longitude: -1.6244 }
    },
    skills: ['Door Installation', 'Window Frames', 'Interior Design'],
    verified: true,
    status: 'active',
    totalEarnings: 24800.00
  },

  'kwadwo.agyei7@kelmah.test': {
    id: 'user-kwadwo-agyei-007',
    email: 'kwadwo.agyei7@kelmah.test',
    firstName: 'Kwadwo',
    lastName: 'Agyei',
    fullName: 'Kwadwo Agyei',
    role: 'worker',
    phone: '+233 24 901 2345',
    profession: 'Mason',
    hourlyRate: 42,
    experience: '9 years',
    rating: 4.7,
    completedJobs: 108,
    location: {
      city: 'Kumasi',
      region: 'Ashanti Region',
      country: 'Ghana',
      coordinates: { latitude: 6.6885, longitude: -1.6244 }
    },
    skills: ['Bricklaying', 'Stone Work', 'Foundation', 'Plastering'],
    verified: true,
    status: 'active',
    totalEarnings: 42600.00
  },

  'esi.darko8@kelmah.test': {
    id: 'user-esi-darko-008',
    email: 'esi.darko8@kelmah.test',
    firstName: 'Esi',
    lastName: 'Darko',
    fullName: 'Esi Darko',
    role: 'worker',
    phone: '+233 20 012 3456',
    profession: 'Mason',
    hourlyRate: 42,
    experience: '3 years',
    rating: 4.3,
    completedJobs: 45,
    location: {
      city: 'Kumasi',
      region: 'Ashanti Region',
      country: 'Ghana',
      coordinates: { latitude: 6.6885, longitude: -1.6244 }
    },
    skills: ['Wall Construction', 'Tile Work', 'Concrete Work'],
    verified: true,
    status: 'active',
    totalEarnings: 18900.00
  },

  // Tamale, Northern Region
  'yaw.antwi9@kelmah.test': {
    id: 'user-yaw-antwi-009',
    email: 'yaw.antwi9@kelmah.test',
    firstName: 'Yaw',
    lastName: 'Antwi',
    fullName: 'Yaw Antwi',
    role: 'worker',
    phone: '+233 26 123 4567',
    profession: 'Painter',
    hourlyRate: 35,
    experience: '6 years',
    rating: 4.6,
    completedJobs: 87,
    location: {
      city: 'Tamale',
      region: 'Northern Region',
      country: 'Ghana',
      coordinates: { latitude: 9.4034, longitude: -0.8424 }
    },
    skills: ['Interior Painting', 'Exterior Coating', 'Wall Preparation', 'Color Mixing'],
    verified: true,
    status: 'active',
    totalEarnings: 30450.00
  },

  'adjoa.oppong10@kelmah.test': {
    id: 'user-adjoa-oppong-010',
    email: 'adjoa.oppong10@kelmah.test',
    firstName: 'Adjoa',
    lastName: 'Oppong',
    fullName: 'Adjoa Oppong',
    role: 'worker',
    phone: '+233 24 234 5678',
    profession: 'Painter',
    hourlyRate: 35,
    experience: '4 years',
    rating: 4.4,
    completedJobs: 56,
    location: {
      city: 'Tamale',
      region: 'Northern Region',
      country: 'Ghana',
      coordinates: { latitude: 9.4034, longitude: -0.8424 }
    },
    skills: ['Decorative Painting', 'House Painting', 'Surface Preparation'],
    verified: true,
    status: 'active',
    totalEarnings: 19600.00
  },

  'kwame.gyamfi11@kelmah.test': {
    id: 'user-kwame-gyamfi-011',
    email: 'kwame.gyamfi11@kelmah.test',
    firstName: 'Kwame',
    lastName: 'Gyamfi',
    fullName: 'Kwame Gyamfi',
    role: 'worker',
    phone: '+233 20 345 6789',
    profession: 'Welder',
    hourlyRate: 55,
    experience: '10 years',
    rating: 4.8,
    completedJobs: 132,
    location: {
      city: 'Tamale',
      region: 'Northern Region',
      country: 'Ghana',
      coordinates: { latitude: 9.4034, longitude: -0.8424 }
    },
    skills: ['Arc Welding', 'Metal Fabrication', 'Structural Welding', 'Repair Work'],
    verified: true,
    status: 'active',
    totalEarnings: 72600.00
  },

  'efua.acheampong12@kelmah.test': {
    id: 'user-efua-acheampong-012',
    email: 'efua.acheampong12@kelmah.test',
    firstName: 'Efua',
    lastName: 'Acheampong',
    fullName: 'Efua Acheampong',
    role: 'worker',
    phone: '+233 26 456 7890',
    profession: 'Welder',
    hourlyRate: 55,
    experience: '5 years',
    rating: 4.5,
    completedJobs: 71,
    location: {
      city: 'Tamale',
      region: 'Northern Region',
      country: 'Ghana',
      coordinates: { latitude: 9.4034, longitude: -0.8424 }
    },
    skills: ['TIG Welding', 'Aluminum Work', 'Custom Projects'],
    verified: true,
    status: 'active',
    totalEarnings: 39050.00
  },

  // Cape Coast, Central Region
  'kwaku.addai13@kelmah.test': {
    id: 'user-kwaku-addai-013',
    email: 'kwaku.addai13@kelmah.test',
    firstName: 'Kwaku',
    lastName: 'Addai',
    fullName: 'Kwaku Addai',
    role: 'worker',
    phone: '+233 24 567 8901',
    profession: 'Mechanic',
    hourlyRate: 48,
    experience: '8 years',
    rating: 4.7,
    completedJobs: 103,
    location: {
      city: 'Cape Coast',
      region: 'Central Region',
      country: 'Ghana',
      coordinates: { latitude: 5.1053, longitude: -1.2466 }
    },
    skills: ['Auto Repair', 'Engine Maintenance', 'Diagnostics', 'Electrical Systems'],
    verified: true,
    status: 'active',
    totalEarnings: 49440.00
  },

  'yaa.wiredu14@kelmah.test': {
    id: 'user-yaa-wiredu-014',
    email: 'yaa.wiredu14@kelmah.test',
    firstName: 'Yaa',
    lastName: 'Wiredu',
    fullName: 'Yaa Wiredu',
    role: 'worker',
    phone: '+233 20 678 9012',
    profession: 'Mechanic',
    hourlyRate: 48,
    experience: '6 years',
    rating: 4.6,
    completedJobs: 84,
    location: {
      city: 'Cape Coast',
      region: 'Central Region',
      country: 'Ghana',
      coordinates: { latitude: 5.1053, longitude: -1.2466 }
    },
    skills: ['Motorcycle Repair', 'Brake Systems', 'Transmission Work'],
    verified: true,
    status: 'active',
    totalEarnings: 40320.00
  },

  'fiifi.frimpong15@kelmah.test': {
    id: 'user-fiifi-frimpong-015',
    email: 'fiifi.frimpong15@kelmah.test',
    firstName: 'Fiifi',
    lastName: 'Frimpong',
    fullName: 'Fiifi Frimpong',
    role: 'worker',
    phone: '+233 26 789 0123',
    profession: 'Tailor',
    hourlyRate: 30,
    experience: '5 years',
    rating: 4.5,
    completedJobs: 76,
    location: {
      city: 'Cape Coast',
      region: 'Central Region',
      country: 'Ghana',
      coordinates: { latitude: 5.1053, longitude: -1.2466 }
    },
    skills: ['Custom Clothing', 'Alterations', 'Traditional Wear', 'Embroidery'],
    verified: true,
    status: 'active',
    totalEarnings: 22800.00
  },

  'afia.nyarko16@kelmah.test': {
    id: 'user-afia-nyarko-016',
    email: 'afia.nyarko16@kelmah.test',
    firstName: 'Afia',
    lastName: 'Nyarko',
    fullName: 'Afia Nyarko',
    role: 'worker',
    phone: '+233 24 890 1234',
    profession: 'Tailor',
    hourlyRate: 30,
    experience: '3 years',
    rating: 4.2,
    completedJobs: 48,
    location: {
      city: 'Cape Coast',
      region: 'Central Region',
      country: 'Ghana',
      coordinates: { latitude: 5.1053, longitude: -1.2466 }
    },
    skills: ['Fashion Design', 'Pattern Making', 'Garment Construction'],
    verified: true,
    status: 'active',
    totalEarnings: 14400.00
  },

  // Sekondi-Takoradi, Western Region
  'kwadwo.bediako17@kelmah.test': {
    id: 'user-kwadwo-bediako-017',
    email: 'kwadwo.bediako17@kelmah.test',
    firstName: 'Kwadwo',
    lastName: 'Bediako',
    fullName: 'Kwadwo Bediako',
    role: 'worker',
    phone: '+233 20 901 2345',
    profession: 'Hair Stylist',
    hourlyRate: 25,
    experience: '4 years',
    rating: 4.4,
    completedJobs: 156,
    location: {
      city: 'Sekondi-Takoradi',
      region: 'Western Region',
      country: 'Ghana',
      coordinates: { latitude: 4.9348, longitude: -1.7925 }
    },
    skills: ['Hair Cutting', 'Styling', 'Hair Treatment', 'Braiding'],
    verified: true,
    status: 'active',
    totalEarnings: 39000.00
  },

  'esi.appiah18@kelmah.test': {
    id: 'user-esi-appiah-018',
    email: 'esi.appiah18@kelmah.test',
    firstName: 'Esi',
    lastName: 'Appiah',
    fullName: 'Esi Appiah',
    role: 'worker',
    phone: '+233 26 012 3456',
    profession: 'Hair Stylist',
    hourlyRate: 25,
    experience: '6 years',
    rating: 4.6,
    completedJobs: 189,
    location: {
      city: 'Sekondi-Takoradi',
      region: 'Western Region',
      country: 'Ghana',
      coordinates: { latitude: 4.9348, longitude: -1.7925 }
    },
    skills: ['Natural Hair Care', 'Chemical Treatments', 'Wedding Styles'],
    verified: true,
    status: 'active',
    totalEarnings: 47250.00
  },

  'yaw.danso19@kelmah.test': {
    id: 'user-yaw-danso-019',
    email: 'yaw.danso19@kelmah.test',
    firstName: 'Yaw',
    lastName: 'Danso',
    fullName: 'Yaw Danso',
    role: 'worker',
    phone: '+233 24 123 4567',
    profession: 'Gardener',
    hourlyRate: 28,
    experience: '7 years',
    rating: 4.5,
    completedJobs: 98,
    location: {
      city: 'Sekondi-Takoradi',
      region: 'Western Region',
      country: 'Ghana',
      coordinates: { latitude: 4.9348, longitude: -1.7925 }
    },
    skills: ['Landscape Design', 'Plant Care', 'Lawn Maintenance', 'Tree Pruning'],
    verified: true,
    status: 'active',
    totalEarnings: 27440.00
  },

  'adjoa.ofori20@kelmah.test': {
    id: 'user-adjoa-ofori-020',
    email: 'adjoa.ofori20@kelmah.test',
    firstName: 'Adjoa',
    lastName: 'Ofori',
    fullName: 'Adjoa Ofori',
    role: 'worker',
    phone: '+233 20 234 5678',
    profession: 'Gardener',
    hourlyRate: 28,
    experience: '3 years',
    rating: 4.3,
    completedJobs: 52,
    location: {
      city: 'Sekondi-Takoradi',
      region: 'Western Region',
      country: 'Ghana',
      coordinates: { latitude: 4.9348, longitude: -1.7925 }
    },
    skills: ['Indoor Plants', 'Garden Planning', 'Irrigation Systems'],
    verified: true,
    status: 'active',
    totalEarnings: 14560.00
  }
};

// Universal password for all test users
export const TEST_USER_PASSWORD = 'TestUser123!';

// Helper functions
export const getTestUserByEmail = (email) => TEST_USERS_DATA[email] || null;

export const getAllTestUsers = () => Object.values(TEST_USERS_DATA);

export const getTestUsersByLocation = (city) => {
  return getAllTestUsers().filter(user => user.location.city === city);
};

export const getTestUsersByProfession = (profession) => {
  return getAllTestUsers().filter(user => user.profession === profession);
};

export const generateEnhancedUserProfile = (basicUser) => {
  return {
    ...basicUser,
    profileImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMWExYTFhIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjRkZENzAwIi8+CjxwYXRoIGQ9Im0zMCAxMjBjMC0yNSAyMC00NSA0NS00NXM0NSAyMCA0NSA0NSIgZmlsbD0iI0ZGRDcwMCIvPgo8L3N2Zz4K',
    currency: 'GHS',
    joinDate: '2023-03-15',
    lastLogin: new Date().toISOString(),
    availability: {
      status: 'available',
      schedule: {
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '15:00', available: true },
        sunday: { available: false }
      }
    },
    wallet: {
      balance: Math.floor(Math.random() * 5000) + 1000,
      currency: 'GHS',
      pendingEarnings: Math.floor(Math.random() * 2000),
    },
    notifications: [],
    unreadNotifications: Math.floor(Math.random() * 5),
    unreadMessages: Math.floor(Math.random() * 3),
  };
};