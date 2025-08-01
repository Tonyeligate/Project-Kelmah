const { successResponse, errorResponse } = require('../utils/response');
const Job = require('../models/Job');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * GET /api/dashboard/overview
 */
exports.getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const totalJobs = await Job.countDocuments({ hirer: userId });
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const upcomingAppointments = await Appointment.countDocuments({ worker: userId, date: { $gte: new Date() } });
    const data = { totalJobs, unreadNotifications, unreadConversations, upcomingAppointments };
    return successResponse(res, 200, 'Overview data retrieved', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/activity
 */
exports.getActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Recent notifications
    const notifications = await Notification.find({ user: userId })
      .sort('-createdAt')
      .limit(10);
    // Recent conversations (last messages)
    const convs = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .sort('-updatedAt')
      .limit(10);
    const recentMessages = convs.map(c => ({
      conversationId: c._id,
      lastMessage: c.lastMessage,
      participants: c.participants
    }));
    return successResponse(res, 200, 'Activity data retrieved', { notifications, recentMessages });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Job counts by status
    const totalOpenJobs = await Job.countDocuments({ hirer: userId, status: 'open' });
    const totalInProgress = await Job.countDocuments({ hirer: userId, status: 'in-progress' });
    const totalCompleted = await Job.countDocuments({ hirer: userId, status: 'completed' });
    return successResponse(res, 200, 'Statistics data retrieved', { totalOpenJobs, totalInProgress, totalCompleted });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Fetch upcoming appointments for the user as tasks
    const tasks = await Appointment.find({
      worker: userId,
      date: { $gte: new Date() }
    })
      .sort('date')
      .limit(10);
    return successResponse(res, 200, 'Tasks retrieved', tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/messages
 */
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Fetch recent conversations with last messages
    const convs = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .sort('-updatedAt')
      .limit(10);
    const messages = convs.map(c => ({
      conversationId: c._id,
      lastMessage: c.lastMessage,
      updatedAt: c.updatedAt
    }));
    return successResponse(res, 200, 'Recent messages retrieved', messages);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/performance
 */
exports.getPerformance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Count messages sent by user
    const messagesSent = await Message.countDocuments({ sender: userId });
    // Count completed appointments for user (as worker)
    const completedAppointments = await Appointment.countDocuments({ worker: userId, status: 'completed' });
    return successResponse(res, 200, 'Performance metrics retrieved', { messagesSent, completedAppointments });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/quick-actions
 */
exports.getQuickActions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let actions = [];
    
    if (userRole === 'worker') {
      // Worker quick actions
      actions = [
        {
          id: 'find_work',
          title: 'Find Work',
          description: 'Browse carpentry, plumbing & electrical jobs',
          icon: 'work',
          route: '/worker/find-work',
          color: '#2196F3',
          urgent: false
        },
        {
          id: 'my_applications',
          title: 'My Jobs',
          description: 'Manage active applications',
          icon: 'assignment',
          route: '/worker/applications',
          color: '#FF9800',
          urgent: true,
          badge: await Job.countDocuments({ 
            'applications.applicant': userId,
            'applications.status': 'pending'
          })
        },
        {
          id: 'messages',
          title: 'Messages',
          description: 'Chat with clients',
          icon: 'message',
          route: '/messages',
          color: '#4CAF50',
          urgent: false,
          badge: await Conversation.find({ participants: userId })
            .then(convs => convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0))
        },
        {
          id: 'profile',
          title: 'Profile',
          description: 'Update your skills & portfolio',
          icon: 'person',
          route: '/profile',
          color: '#9C27B0',
          urgent: false
        }
      ];
    } else {
      // Hirer quick actions
      actions = [
        {
          id: 'post_job',
          title: 'Post a Job',
          description: 'Find skilled workers for your project',
          icon: 'add_circle',
          route: '/hirer/post-job',
          color: '#2196F3',
          urgent: false
        },
        {
          id: 'my_jobs',
          title: 'My Jobs',
          description: 'Manage your job postings',
          icon: 'work',
          route: '/hirer/jobs',
          color: '#FF9800',
          urgent: false,
          badge: await Job.countDocuments({ 
            hirer: userId,
            status: 'open'
          })
        },
        {
          id: 'find_workers',
          title: 'Find Workers',
          description: 'Search skilled professionals',
          icon: 'search',
          route: '/hirer/find-workers',
          color: '#4CAF50',
          urgent: false
        },
        {
          id: 'messages',
          title: 'Messages',
          description: 'Communicate with workers',
          icon: 'message',
          route: '/messages',
          color: '#673AB7',
          urgent: false,
          badge: await Conversation.find({ participants: userId })
            .then(convs => convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0))
        }
      ];
    }
    
    return successResponse(res, 200, 'Quick actions retrieved', actions);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/notifications-summary
 */
exports.getNotificationsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    return successResponse(res, 200, 'Notifications summary retrieved', { unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/stats
 */
exports.getRealTimeStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Global open jobs count
    const openJobs = await Job.countDocuments({ status: 'open' });
    // Unread notifications for user
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    // Unread messages count for user across conversations
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    return successResponse(res, 200, 'Real-time stats retrieved', { openJobs, unreadNotifications, unreadConversations });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    // Alias for overview metrics
    const userId = req.user.id;
    const totalJobs = await Job.countDocuments({ hirer: userId });
    const unreadNotifications = await Notification.countDocuments({ user: userId, isRead: false });
    const convs = await Conversation.find({ participants: userId });
    const unreadConversations = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const upcomingAppointments = await Appointment.countDocuments({ worker: userId, date: { $gte: new Date() } });
    const metrics = { totalJobs, unreadNotifications, unreadConversations, upcomingAppointments };
    return successResponse(res, 200, 'Metrics data retrieved', metrics);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/jobs
 */
exports.getRecentJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Recent jobs posted by user
    const jobs = await Job.find({ hirer: userId })
      .sort('-createdAt')
      .limit(10);
    return successResponse(res, 200, 'Recent jobs retrieved', jobs);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/workers
 */
exports.getWorkers = async (req, res, next) => {
  try {
    // Active worker list sorted by rating
    const workers = await User.find({ role: 'worker' })
      .sort('-rating')
      .select('id firstName lastName rating skills')
      .limit(10);
    return successResponse(res, 200, 'Active workers retrieved', workers);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/analytics
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get date ranges for analytics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    let analytics = {};
    
    if (userRole === 'worker') {
      // Worker-specific analytics
      const totalApplications = await Job.countDocuments({ 
        'applications.applicant': userId 
      });
      const thisMonthApplications = await Job.countDocuments({ 
        'applications.applicant': userId,
        'applications.appliedAt': { $gte: currentMonth }
      });
      const completedJobs = await Job.countDocuments({ 
        worker: userId, 
        status: 'completed' 
      });
      const activeJobs = await Job.countDocuments({ 
        worker: userId, 
        status: 'in-progress' 
      });
      
      // Calculate earnings (mock calculation)
      const totalEarnings = completedJobs * 150; // Average $150 per job
      const thisMonthEarnings = Math.floor(totalEarnings * 0.3); // 30% this month
      
      analytics = {
        jobsThisMonth: thisMonthApplications,
        applicationsThisMonth: thisMonthApplications,
        earningsThisMonth: thisMonthEarnings,
        averageResponseTime: '2.5 hours',
        completionRate: completedJobs > 0 ? Math.floor((completedJobs / (completedJobs + activeJobs)) * 100) : 0,
        clientSatisfaction: 4.7,
        monthlyGrowth: {
          jobs: Math.floor(Math.random() * 25) + 5,
          earnings: Math.floor(Math.random() * 30) + 10,
          applications: Math.floor(Math.random() * 20) + 8,
        },
        topSkills: ['Electrical Work', 'Plumbing', 'Carpentry'],
        totalApplications,
        completedJobs,
        activeJobs,
        totalEarnings
      };
    } else {
      // Hirer-specific analytics
      const totalJobsPosted = await Job.countDocuments({ hirer: userId });
      const thisMonthJobs = await Job.countDocuments({ 
        hirer: userId,
        createdAt: { $gte: currentMonth }
      });
      const completedJobs = await Job.countDocuments({ 
        hirer: userId, 
        status: 'completed' 
      });
      const activeJobs = await Job.countDocuments({ 
        hirer: userId, 
        status: 'in-progress' 
      });
      
      analytics = {
        jobsThisMonth: thisMonthJobs,
        applicationsThisMonth: Math.floor(thisMonthJobs * 3.2), // Average applications per job
        earningsThisMonth: 0, // Hirers don't earn
        averageResponseTime: '1.8 hours',
        completionRate: completedJobs > 0 ? Math.floor((completedJobs / totalJobsPosted) * 100) : 0,
        clientSatisfaction: 4.5,
        monthlyGrowth: {
          jobs: Math.floor(Math.random() * 15) + 5,
          earnings: 0,
          applications: Math.floor(Math.random() * 25) + 10,
        },
        topSkills: ['Project Management', 'Quality Control', 'Budget Planning'],
        totalJobsPosted,
        completedJobs,
        activeJobs,
        totalSpent: completedJobs * 180 // Average $180 per completed job
      };
    }
    
    return successResponse(res, 200, 'Analytics data retrieved', analytics);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/job-matches
 * Get personalized job matches for workers
 */
exports.getJobMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'worker') {
      return errorResponse(res, 403, 'Only workers can access job matches');
    }
    
    // Get user's skills and preferences
    const user = await User.findById(userId);
    const userSkills = user.skills || [];
    const userLocation = user.location || {};
    
    // Build query for matching jobs
    let query = { 
      status: 'open', 
      visibility: 'public',
      // Don't show jobs user already applied to
      'applications.applicant': { $ne: userId }
    };
    
    // Match by skills
    if (userSkills.length > 0) {
      query.$or = [
        { skills: { $in: userSkills } },
        { category: { $in: userSkills } }
      ];
    }
    
    // Location matching (if user has location)
    if (userLocation.city) {
      query['location.city'] = userLocation.city;
    }
    
    // Get matching jobs with scoring
    const jobs = await Job.find(query)
      .populate('hirer', 'firstName lastName profileImage rating')
      .sort('-createdAt')
      .limit(20);
    
    // Add match scores
    const jobsWithScores = jobs.map(job => {
      let matchScore = 0;
      
      // Skill matching (40% of score)
      const skillMatches = job.skills.filter(skill => 
        userSkills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      matchScore += (skillMatches.length / Math.max(job.skills.length, 1)) * 40;
      
      // Location matching (20% of score)
      if (job.location?.city === userLocation.city) {
        matchScore += 20;
      }
      
      // Budget matching (20% of score) - prefer higher budgets
      const budgetScore = Math.min((job.budget || 100) / 500, 1) * 20;
      matchScore += budgetScore;
      
      // Recency (10% of score)
      const daysOld = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, (7 - daysOld) / 7) * 10;
      matchScore += recencyScore;
      
      // Client rating (10% of score)
      const ratingScore = ((job.hirer?.rating || 4) / 5) * 10;
      matchScore += ratingScore;
      
      return {
        ...job.toObject(),
        matchScore: Math.round(matchScore),
        matchReasons: [
          skillMatches.length > 0 ? `${skillMatches.length} skill matches` : null,
          job.location?.city === userLocation.city ? 'Same location' : null,
          job.budget > 200 ? 'Good budget' : null,
          daysOld < 3 ? 'Recently posted' : null
        ].filter(Boolean)
      };
    });
    
    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    return successResponse(res, 200, 'Job matches retrieved', jobsWithScores);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recommendations
 * Get recommendations based on user activity and preferences
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let recommendations = [];
    
    if (userRole === 'worker') {
      // Worker recommendations
      const user = await User.findById(userId);
      const appliedJobs = await Job.find({ 'applications.applicant': userId }).select('category skills');
      
      // Analyze user's application history
      const appliedCategories = [...new Set(appliedJobs.map(job => job.category))];
      const appliedSkills = [...new Set(appliedJobs.flatMap(job => job.skills))];
      
      recommendations = [
        {
          type: 'skill_development',
          title: 'Develop New Skills',
          description: 'Based on market demand, consider learning these skills',
          action: 'View Courses',
          data: ['Smart Home Integration', 'Solar Installation', 'Green Building'],
          priority: 'high'
        },
        {
          type: 'job_alert',
          title: 'Set Job Alerts',
          description: `Get notified of new ${appliedCategories[0] || 'electrical'} jobs`,
          action: 'Setup Alerts',
          data: appliedCategories,
          priority: 'medium'
        },
        {
          type: 'profile_completion',
          title: 'Complete Your Profile',
          description: 'Add certifications to increase job matches by 40%',
          action: 'Complete Profile',
          data: { completion: user.profileCompletion || 65 },
          priority: 'high'
        },
        {
          type: 'location_expansion',
          title: 'Expand Service Area',
          description: 'Consider nearby cities for 50% more opportunities',
          action: 'Update Location',
          data: ['Kumasi', 'Tamale', 'Cape Coast'],
          priority: 'low'
        }
      ];
    } else {
      // Hirer recommendations
      const postedJobs = await Job.find({ hirer: userId });
      const avgApplications = postedJobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0) / Math.max(postedJobs.length, 1);
      
      recommendations = [
        {
          type: 'job_optimization',
          title: 'Optimize Job Posts',
          description: `Your jobs average ${Math.round(avgApplications)} applications. Industry average is 8.`,
          action: 'Learn More',
          data: { current: Math.round(avgApplications), target: 8 },
          priority: avgApplications < 5 ? 'high' : 'medium'
        },
        {
          type: 'worker_retention',
          title: 'Worker Retention Program',
          description: 'Build long-term relationships with top workers',
          action: 'View Program',
          data: ['Save favorites', 'Direct messaging', 'Repeat hiring bonuses'],
          priority: 'medium'
        },
        {
          type: 'budget_optimization',
          title: 'Budget Insights',
          description: 'Analyze your spending patterns for better ROI',
          action: 'View Analytics',
          data: { savings: '15-25%' },
          priority: 'low'
        }
      ];
    }
    
    return successResponse(res, 200, 'Recommendations retrieved', recommendations);
  } catch (err) {
    next(err);
  }
}; 