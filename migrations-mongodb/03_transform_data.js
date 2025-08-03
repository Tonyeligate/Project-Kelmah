/**
 * Data Transformation Script
 * Transforms SQL data to MongoDB document format
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import MongoDB schemas
const schemas = require('./02_mongodb_schemas');

// Export directory
const exportDir = path.join(__dirname, 'exports');
const transformedDir = path.join(__dirname, 'transformed');

async function transformData() {
  try {
    console.log('🔄 Starting data transformation...');

    // Ensure directories exist
    if (!fs.existsSync(transformedDir)) {
      fs.mkdirSync(transformedDir, { recursive: true });
    }

    // Load exported SQL data
    const sqlData = loadSqlExports();

    // Transform each entity
    const transformedData = {};

    // Transform Users (merge with profiles)
    transformedData.users = await transformUsers(sqlData);
    
    // Transform Jobs
    transformedData.jobs = await transformJobs(sqlData);
    
    // Transform Messages and Conversations
    const { conversations, messages } = await transformMessaging(sqlData);
    transformedData.conversations = conversations;
    transformedData.messages = messages;
    
    // Transform Transactions
    transformedData.transactions = await transformTransactions(sqlData);
    
    // Transform Reviews
    transformedData.reviews = await transformReviews(sqlData);
    
    // Transform Notifications
    transformedData.notifications = await transformNotifications(sqlData);

    // Save transformed data
    for (const [collection, data] of Object.entries(transformedData)) {
      const filename = `${collection}_transformed.json`;
      const filepath = path.join(transformedDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`✅ ${collection}: ${data.length} documents transformed`);
    }

    // Create transformation summary
    const summary = {
      transformedAt: new Date().toISOString(),
      collections: Object.keys(transformedData).reduce((acc, key) => {
        acc[key] = transformedData[key].length;
        return acc;
      }, {}),
      totalDocuments: Object.values(transformedData).reduce((sum, arr) => sum + arr.length, 0)
    };

    fs.writeFileSync(
      path.join(transformedDir, 'transformation_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('🎉 Data transformation completed!');
    console.log('📊 Summary:', summary);

  } catch (error) {
    console.error('💥 Transformation failed:', error);
    process.exit(1);
  }
}

function loadSqlExports() {
  const data = {};
  const files = fs.readdirSync(exportDir).filter(file => file.endsWith('_export.json'));
  
  for (const file of files) {
    const modelName = file.replace('_export.json', '');
    const filepath = path.join(exportDir, file);
    data[modelName] = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  
  return data;
}

async function transformUsers(sqlData) {
  const users = sqlData.user || [];
  const profiles = sqlData.profile || [];
  const wallets = sqlData.wallet || [];
  const subscriptions = sqlData.subscription || [];

  return users.map(user => {
    // Find related data
    const profile = profiles.find(p => p.userId === user.id) || {};
    const wallet = wallets.find(w => w.userId === user.id) || {};
    const subscription = subscriptions.find(s => s.userId === user.id) || {};

    return {
      _id: new mongoose.Types.ObjectId(),
      sqlId: user.id, // Keep original ID for reference during migration
      email: user.email,
      password: user.password,
      role: user.role || 'worker',
      profile: {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        location: {
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || ''
        },
        avatar: profile.avatar || '',
        bio: profile.bio || '',
        skills: profile.skills ? profile.skills.split(',') : [],
        rating: {
          average: profile.rating || 0,
          count: profile.reviewCount || 0
        }
      },
      wallet: {
        balance: wallet.balance || 0,
        pendingBalance: wallet.pendingBalance || 0,
        currency: wallet.currency || 'USD'
      },
      subscription: {
        plan: subscription.plan || 'free',
        status: subscription.status || 'active',
        expiresAt: subscription.expiresAt || null
      },
      emailVerifiedAt: user.emailVerifiedAt || null,
      lastLoginAt: user.lastLoginAt || null,
      isActive: user.isActive !== false,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };
  });
}

async function transformJobs(sqlData) {
  const jobs = sqlData.job || [];
  const contracts = sqlData.contract || [];

  return jobs.map(job => {
    const contract = contracts.find(c => c.jobId === job.id) || {};

    return {
      _id: new mongoose.Types.ObjectId(),
      sqlId: job.id,
      title: job.title,
      description: job.description,
      category: job.category || 'general',
      skillsRequired: job.skillsRequired ? job.skillsRequired.split(',') : [],
      payment: {
        amount: {
          fixed: job.paymentAmount || 0
        },
        currency: job.currency || 'USD',
        type: 'fixed'
      },
      location: {
        type: job.locationType || 'onsite',
        address: job.address || '',
        city: job.city || '',
        state: job.state || ''
      },
      status: job.status || 'draft',
      hirerId: job.hirerId, // Will be replaced with MongoDB ObjectId during import
      assignedWorkerId: job.assignedWorkerId || null,
      applications: [], // Will be populated from applications table
      contract: {
        terms: contract.terms || '',
        startDate: contract.startDate || null,
        endDate: contract.endDate || null,
        milestones: []
      },
      createdAt: job.createdAt || new Date(),
      updatedAt: job.updatedAt || new Date()
    };
  });
}

async function transformMessaging(sqlData) {
  const messages = sqlData.message || [];
  const conversations = sqlData.conversation || [];

  // Transform conversations
  const transformedConversations = conversations.map(conv => ({
    _id: new mongoose.Types.ObjectId(),
    sqlId: conv.id,
    participants: conv.participants ? conv.participants.split(',').map(Number) : [],
    type: conv.type || 'direct',
    relatedJobId: conv.relatedJobId || null,
    lastMessage: {
      content: conv.lastMessageContent || '',
      senderId: conv.lastMessageSenderId || null,
      timestamp: conv.lastMessageAt || new Date()
    },
    isActive: conv.isActive !== false,
    createdAt: conv.createdAt || new Date(),
    updatedAt: conv.updatedAt || new Date()
  }));

  // Transform messages
  const transformedMessages = messages.map(msg => ({
    _id: new mongoose.Types.ObjectId(),
    sqlId: msg.id,
    conversationId: msg.conversationId, // Will be replaced during import
    senderId: msg.senderId, // Will be replaced during import
    content: {
      text: msg.content || '',
      attachments: msg.attachments ? JSON.parse(msg.attachments) : []
    },
    messageType: msg.messageType || 'text',
    readBy: msg.readBy ? JSON.parse(msg.readBy) : [],
    createdAt: msg.createdAt || new Date(),
    updatedAt: msg.updatedAt || new Date()
  }));

  return { conversations: transformedConversations, messages: transformedMessages };
}

async function transformTransactions(sqlData) {
  const transactions = sqlData.transaction || [];

  return transactions.map(txn => ({
    _id: new mongoose.Types.ObjectId(),
    sqlId: txn.id,
    fromUserId: txn.fromUserId, // Will be replaced during import
    toUserId: txn.toUserId, // Will be replaced during import
    jobId: txn.jobId || null,
    amount: txn.amount || 0,
    currency: txn.currency || 'USD',
    type: txn.type || 'payment',
    status: txn.status || 'pending',
    paymentMethod: txn.paymentMethod || 'credit_card',
    description: txn.description || '',
    fees: {
      platformFee: txn.platformFee || 0,
      processingFee: txn.processingFee || 0
    },
    metadata: {
      referenceNumber: txn.referenceNumber || ''
    },
    createdAt: txn.createdAt || new Date(),
    updatedAt: txn.updatedAt || new Date()
  }));
}

async function transformReviews(sqlData) {
  const reviews = sqlData.review || [];

  return reviews.map(review => ({
    _id: new mongoose.Types.ObjectId(),
    sqlId: review.id,
    jobId: review.jobId, // Will be replaced during import
    reviewerId: review.reviewerId, // Will be replaced during import
    revieweeId: review.revieweeId, // Will be replaced during import
    rating: review.rating || 5,
    comment: review.comment || '',
    categories: {
      quality: review.qualityRating || review.rating,
      communication: review.communicationRating || review.rating,
      timeliness: review.timelinessRating || review.rating
    },
    isVisible: review.isVisible !== false,
    createdAt: review.createdAt || new Date(),
    updatedAt: review.updatedAt || new Date()
  }));
}

async function transformNotifications(sqlData) {
  const notifications = sqlData.notification || [];

  return notifications.map(notif => ({
    _id: new mongoose.Types.ObjectId(),
    sqlId: notif.id,
    userId: notif.userId, // Will be replaced during import
    type: notif.type || 'system',
    title: notif.title || '',
    message: notif.message || '',
    data: notif.data ? JSON.parse(notif.data) : {},
    isRead: notif.isRead || false,
    readAt: notif.readAt || null,
    createdAt: notif.createdAt || new Date(),
    updatedAt: notif.updatedAt || new Date()
  }));
}

// Run transformation if called directly
if (require.main === module) {
  transformData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { transformData };