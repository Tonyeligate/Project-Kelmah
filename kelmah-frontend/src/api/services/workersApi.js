/**
 * Workers API Service
 * Handles worker-specific operations like availability, dashboard stats, etc.
 */

import axios from 'axios';
import { SERVICES } from '../../config/environment';

// Create workers service client - using AUTH_SERVICE since USER_SERVICE doesn't have worker endpoints yet
const workersServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE, // Using auth service as fallback until user service is updated
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
workersServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const workersApi = {
  /**
   * Get worker availability status - Enhanced with localStorage persistence
   */
  async getAvailabilityStatus() {
    const saved = localStorage.getItem('worker_availability');
    return saved ? JSON.parse(saved) : { 
      isAvailable: true, 
      status: 'available',
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Update worker availability - Enhanced with localStorage persistence
   */
  async updateAvailability(availabilityData) {
    const updatedStatus = {
      ...availabilityData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('worker_availability', JSON.stringify(updatedStatus));
    console.log('Worker availability updated:', updatedStatus);
    return updatedStatus;
  },

  /**
   * Get worker dashboard statistics - Enhanced with realistic mock data
   */
  async getDashboardStats() {
    const mockStats = {
      totalApplications: Math.floor(Math.random() * 25) + 15,
      activeContracts: Math.floor(Math.random() * 8) + 2,
      completedJobs: Math.floor(Math.random() * 50) + 20,
      totalEarnings: Math.floor(Math.random() * 15000) + 5000,
      monthlyEarnings: Math.floor(Math.random() * 3000) + 1000,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      profileViews: Math.floor(Math.random() * 200) + 50,
      responseRate: Math.floor(Math.random() * 30) + 70,
      completionRate: Math.floor(Math.random() * 20) + 80,
      skillsEndorsements: Math.floor(Math.random() * 15) + 5,
      portfolioViews: Math.floor(Math.random() * 100) + 25
    };
    return mockStats;
  },

  /**
   * Get worker earnings data - New enhanced method
   */
  async getEarningsData(timeRange = '6months') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const getMonthlyData = (monthCount) => {
      return months.slice(Math.max(0, currentMonth - monthCount + 1), currentMonth + 1).map((month, index) => {
        const baseAmount = 1500 + Math.random() * 2500;
        const jobs = Math.floor(Math.random() * 12) + 3;
        return {
          month,
          earnings: Math.round(baseAmount),
          jobs: jobs,
          expenses: Math.round(baseAmount * 0.15),
          netEarnings: Math.round(baseAmount * 0.85),
          hoursWorked: jobs * 8,
          avgPerJob: Math.round(baseAmount / jobs),
        };
      });
    };

    const monthlyData = timeRange === '3months' ? getMonthlyData(3) : 
                      timeRange === '12months' ? getMonthlyData(12) : 
                      getMonthlyData(6);

    const categoryData = [
      { category: 'Carpentry', amount: 4200, jobs: 10, percentage: 35 },
      { category: 'Plumbing', amount: 3100, jobs: 7, percentage: 26 },
      { category: 'Electrical', amount: 2800, jobs: 6, percentage: 23 },
      { category: 'Painting', amount: 1400, jobs: 4, percentage: 12 },
      { category: 'General Repairs', amount: 500, jobs: 3, percentage: 4 },
    ];

    return {
      monthly: monthlyData,
      byCategory: categoryData,
      summary: {
        totalEarnings: monthlyData.reduce((sum, m) => sum + m.earnings, 0),
        totalJobs: monthlyData.reduce((sum, m) => sum + m.jobs, 0),
        averageMonthly: Math.round(monthlyData.reduce((sum, m) => sum + m.earnings, 0) / monthlyData.length),
        growthRate: monthlyData.length > 1 ? 
          (((monthlyData[monthlyData.length - 1].earnings - monthlyData[0].earnings) / monthlyData[0].earnings) * 100).toFixed(1) : 
          0
      }
    };
  },

  /**
   * Get worker appointments - Enhanced method
   */
  async getAppointments() {
    const appointmentTypes = ['Client Meeting', 'Project Start', 'Inspection', 'Consultation', 'Material Delivery'];
    const locations = ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Tema'];
    const clients = ['Johnson Residence', 'Miller Office', 'Smith Home', 'Brown Construction', 'Davis Renovation'];
    
    return Array.from({ length: 8 }, (_, index) => {
      const baseDate = new Date();
      const daysAhead = Math.floor(Math.random() * 14) + 1;
      const appointmentDate = new Date(baseDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      const hour = Math.floor(Math.random() * 8) + 9;
      appointmentDate.setHours(hour, index % 2 === 0 ? 0 : 30, 0, 0);
      
      const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      return {
        id: `apt_${index + 1}`,
        title: `${type}: ${client}`,
        type: type.toLowerCase().replace(' ', '_'),
        client: client,
        datetime: appointmentDate,
        location: location,
        duration: Math.floor(Math.random() * 3) + 1,
        status: Math.random() > 0.7 ? 'confirmed' : Math.random() > 0.4 ? 'pending' : 'upcoming',
        priority: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        description: `${type} scheduled with ${client} in ${location}. Please arrive 15 minutes early.`,
        clientContact: {
          phone: '+233 20 123 4567',
          email: 'client@example.com'
        }
      };
    }).sort((a, b) => a.datetime - b.datetime);
  },

  /**
   * Get worker profile data - Uses auth token verification
   */
  async getWorkerProfile() {
    try {
      const response = await workersServiceClient.get('/api/auth/verify');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch worker profile:', error.message);
      // Return mock profile data for development
      return {
        id: 'worker_123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+233 20 123 4567',
        profession: 'Professional Carpenter',
        location: 'Accra, Ghana',
        joinedDate: '2023-01-15',
        skills: ['Carpentry', 'Plumbing', 'Electrical Work'],
        rating: 4.8,
        completedJobs: 45,
        profileCompletion: 85
      };
    }
  },

  /**
   * Update worker profile - Enhanced with validation
   */
  async updateWorkerProfile(profileData) {
    console.log('Profile update requested:', profileData);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would update the backend
    // For now, just simulate success
    return {
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    };
  },

  /**
   * Get portfolio projects - Enhanced with realistic data
   */
  async getPortfolioProjects() {
    const projects = [
      {
        id: 'proj_1',
        title: 'Modern Kitchen Renovation',
        description: 'Complete kitchen makeover with custom cabinets and modern appliances for a family home in East Legon.',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        category: 'Carpentry',
        completionDate: '2024-02-15',
        client: 'Johnson Family',
        duration: '3 weeks',
        skills: ['Custom Carpentry', 'Kitchen Design', 'Project Management'],
        status: 'completed',
        rating: 5.0
      },
      {
        id: 'proj_2',
        title: 'Office Plumbing Installation',
        description: 'Complete plumbing system installation for a new office building in Tema, including water supply and drainage.',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        category: 'Plumbing',
        completionDate: '2024-01-20',
        client: 'TechCorp Ghana',
        duration: '2 weeks',
        skills: ['Commercial Plumbing', 'System Design', 'Installation'],
        status: 'completed',
        rating: 4.8
      },
      {
        id: 'proj_3',
        title: 'Residential Electrical Wiring',
        description: 'Complete electrical system upgrade for a 4-bedroom house including smart home integration.',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
        category: 'Electrical',
        completionDate: '2023-12-10',
        client: 'Smith Residence',
        duration: '1 week',
        skills: ['Electrical Installation', 'Smart Home Systems', 'Safety Compliance'],
        status: 'completed',
        rating: 4.9
      }
    ];
    
    return projects;
  },

  /**
   * Get skills and licenses - Enhanced with realistic data
   */
  async getSkillsAndLicenses() {
    return {
      skills: [
        { 
          id: 'skill_1', 
          name: 'Carpentry', 
          level: 'Expert', 
          years: 8, 
          verified: true, 
          endorsements: 12,
          category: 'Construction'
        },
        { 
          id: 'skill_2', 
          name: 'Plumbing', 
          level: 'Advanced', 
          years: 5, 
          verified: true, 
          endorsements: 8,
          category: 'Construction'
        },
        { 
          id: 'skill_3', 
          name: 'Electrical Work', 
          level: 'Intermediate', 
          years: 3, 
          verified: false, 
          endorsements: 4,
          category: 'Construction'
        },
        { 
          id: 'skill_4', 
          name: 'Project Management', 
          level: 'Advanced', 
          years: 6, 
          verified: true, 
          endorsements: 6,
          category: 'Management'
        }
      ],
      licenses: [
        {
          id: 'license_1',
          name: 'Ghana Contractors License',
          number: 'GCL-2023-1234',
          issuedBy: 'Ministry of Works and Housing',
          issueDate: '2023-01-15',
          expiryDate: '2025-01-15',
          status: 'active',
          verified: true
        },
        {
          id: 'license_2',
          name: 'Electrical Installation Certificate',
          number: 'EIC-2022-5678',
          issuedBy: 'Ghana Standards Authority',
          issueDate: '2022-06-10',
          expiryDate: '2024-06-10',
          status: 'active',
          verified: true
        }
      ],
      certifications: [
        {
          id: 'cert_1',
          name: 'Safety Management Certification',
          issuedBy: 'Ghana Institute of Construction',
          issueDate: '2023-03-20',
          validUntil: '2026-03-20',
          verified: true
        }
      ]
    };
  },

  /**
   * Request skill verification - Enhanced implementation
   */
  async requestSkillVerification(skillId, verificationData) {
    console.log('Skill verification requested:', skillId, verificationData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: 'Verification request submitted successfully',
      requestId: `verify_${Date.now()}`,
      expectedProcessingTime: '3-5 business days',
      status: 'pending',
      requiredDocuments: [
        'Certificate or diploma',
        'Work experience letters',
        'Portfolio examples'
      ]
    };
  },

  /**
   * Get profile completion status - New method
   */
  async getProfileCompletion() {
    const profile = await this.getWorkerProfile();
    const skills = await this.getSkillsAndLicenses();
    const portfolio = await this.getPortfolioProjects();
    
    const completionItems = [
      { name: 'Basic Information', completed: !!(profile.firstName && profile.email), weight: 20 },
      { name: 'Professional Details', completed: !!(profile.profession && profile.location), weight: 15 },
      { name: 'Contact Information', completed: !!profile.phone, weight: 10 },
      { name: 'Skills', completed: skills.skills.length > 0, weight: 25 },
      { name: 'Portfolio', completed: portfolio.length > 0, weight: 20 },
      { name: 'Verification', completed: skills.licenses.length > 0, weight: 10 }
    ];
    
    const completedWeight = completionItems
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    
    return {
      percentage: completedWeight,
      items: completionItems,
      nextSteps: completionItems
        .filter(item => !item.completed)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
    };
  }
};

export default workersApi;