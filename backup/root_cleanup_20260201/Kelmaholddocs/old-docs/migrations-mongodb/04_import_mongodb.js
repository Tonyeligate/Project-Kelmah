/**
 * MongoDB Import Script
 * Imports transformed data into MongoDB collections
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import schemas
const schemas = require('./02_mongodb_schemas');

// Directories
const transformedDir = path.join(__dirname, 'transformed');

// MongoDB Models
let Models = {};

async function importToMongoDB() {
  try {
    console.log('📦 Starting MongoDB import...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kelmah';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create models
    Models = {
      User: mongoose.model('User', schemas.userSchema),
      Job: mongoose.model('Job', schemas.jobSchema),
      Message: mongoose.model('Message', schemas.messageSchema),
      Conversation: mongoose.model('Conversation', schemas.conversationSchema),
      Transaction: mongoose.model('Transaction', schemas.transactionSchema),
      Review: mongoose.model('Review', schemas.reviewSchema),
      Notification: mongoose.model('Notification', schemas.notificationSchema)
    };

    // Load transformed data
    const transformedData = loadTransformedData();

    // Import in order (respecting dependencies)
    const importResults = {};

    // 1. Import Users first (no dependencies)
    importResults.users = await importUsers(transformedData.users);
    
    // 2. Import Jobs (depends on Users)
    importResults.jobs = await importJobs(transformedData.jobs);
    
    // 3. Import Conversations (depends on Users)
    importResults.conversations = await importConversations(transformedData.conversations);
    
    // 4. Import Messages (depends on Users and Conversations)
    importResults.messages = await importMessages(transformedData.messages);
    
    // 5. Import Transactions (depends on Users and Jobs)
    importResults.transactions = await importTransactions(transformedData.transactions);
    
    // 6. Import Reviews (depends on Users and Jobs)
    importResults.reviews = await importReviews(transformedData.reviews);
    
    // 7. Import Notifications (depends on Users)
    importResults.notifications = await importNotifications(transformedData.notifications);

    // Save import summary
    const summary = {
      importedAt: new Date().toISOString(),
      results: importResults,
      totalDocuments: Object.values(importResults).reduce((sum, result) => sum + result.imported, 0)
    };

    fs.writeFileSync(
      path.join(__dirname, 'import_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('🎉 MongoDB import completed!');
    console.log('📊 Import Summary:');
    console.table(importResults);

    await mongoose.disconnect();

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

function loadTransformedData() {
  const data = {};
  const files = fs.readdirSync(transformedDir).filter(file => file.endsWith('_transformed.json'));
  
  for (const file of files) {
    const collectionName = file.replace('_transformed.json', '');
    const filepath = path.join(transformedDir, file);
    data[collectionName] = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  
  return data;
}

// Store ID mappings for reference resolution
const idMappings = {
  users: new Map(),
  jobs: new Map(),
  conversations: new Map()
};

async function importUsers(userData) {
  console.log('👥 Importing users...');
  
  try {
    // Clear existing users (if any)
    await Models.User.deleteMany({});
    
    const users = [];
    for (const user of userData) {
      const newUser = new Models.User({
        ...user,
        _id: user._id
      });
      users.push(newUser);
      
      // Store ID mapping
      idMappings.users.set(user.sqlId, user._id);
    }

    const result = await Models.User.insertMany(users);
    
    return {
      imported: result.length,
      errors: 0
    };
    
  } catch (error) {
    console.error('Error importing users:', error);
    return {
      imported: 0,
      errors: 1
    };
  }
}

async function importJobs(jobData) {
  console.log('💼 Importing jobs...');
  
  try {
    await Models.Job.deleteMany({});
    
    const jobs = [];
    for (const job of jobData) {
      // Resolve user ID references
      const hirerId = idMappings.users.get(job.hirerId);
      const assignedWorkerId = job.assignedWorkerId ? idMappings.users.get(job.assignedWorkerId) : null;
      
      if (!hirerId) {
        console.warn(`Skipping job ${job.sqlId}: hirer not found`);
        continue;
      }
      
      const newJob = new Models.Job({
        ...job,
        hirerId,
        assignedWorkerId,
        _id: job._id
      });
      
      jobs.push(newJob);
      idMappings.jobs.set(job.sqlId, job._id);
    }

    const result = await Models.Job.insertMany(jobs);
    
    return {
      imported: result.length,
      errors: jobData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing jobs:', error);
    return {
      imported: 0,
      errors: jobData.length
    };
  }
}

async function importConversations(conversationData) {
  console.log('💬 Importing conversations...');
  
  try {
    await Models.Conversation.deleteMany({});
    
    const conversations = [];
    for (const conv of conversationData) {
      // Resolve participant IDs
      const participants = conv.participants
        .map(sqlId => idMappings.users.get(sqlId))
        .filter(id => id); // Remove undefined IDs
      
      if (participants.length === 0) {
        console.warn(`Skipping conversation ${conv.sqlId}: no valid participants`);
        continue;
      }
      
      const relatedJobId = conv.relatedJobId ? idMappings.jobs.get(conv.relatedJobId) : null;
      const lastMessageSenderId = conv.lastMessage.senderId ? 
        idMappings.users.get(conv.lastMessage.senderId) : null;
      
      const newConversation = new Models.Conversation({
        ...conv,
        participants,
        relatedJobId,
        lastMessage: {
          ...conv.lastMessage,
          senderId: lastMessageSenderId
        },
        _id: conv._id
      });
      
      conversations.push(newConversation);
      idMappings.conversations.set(conv.sqlId, conv._id);
    }

    const result = await Models.Conversation.insertMany(conversations);
    
    return {
      imported: result.length,
      errors: conversationData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing conversations:', error);
    return {
      imported: 0,
      errors: conversationData.length
    };
  }
}

async function importMessages(messageData) {
  console.log('💌 Importing messages...');
  
  try {
    await Models.Message.deleteMany({});
    
    const messages = [];
    for (const msg of messageData) {
      const conversationId = idMappings.conversations.get(msg.conversationId);
      const senderId = idMappings.users.get(msg.senderId);
      
      if (!conversationId || !senderId) {
        console.warn(`Skipping message ${msg.sqlId}: references not found`);
        continue;
      }
      
      const newMessage = new Models.Message({
        ...msg,
        conversationId,
        senderId,
        _id: msg._id
      });
      
      messages.push(newMessage);
    }

    const result = await Models.Message.insertMany(messages);
    
    return {
      imported: result.length,
      errors: messageData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing messages:', error);
    return {
      imported: 0,
      errors: messageData.length
    };
  }
}

async function importTransactions(transactionData) {
  console.log('💰 Importing transactions...');
  
  try {
    await Models.Transaction.deleteMany({});
    
    const transactions = [];
    for (const txn of transactionData) {
      const fromUserId = txn.fromUserId ? idMappings.users.get(txn.fromUserId) : null;
      const toUserId = txn.toUserId ? idMappings.users.get(txn.toUserId) : null;
      const jobId = txn.jobId ? idMappings.jobs.get(txn.jobId) : null;
      
      const newTransaction = new Models.Transaction({
        ...txn,
        fromUserId,
        toUserId,
        jobId,
        _id: txn._id
      });
      
      transactions.push(newTransaction);
    }

    const result = await Models.Transaction.insertMany(transactions);
    
    return {
      imported: result.length,
      errors: transactionData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing transactions:', error);
    return {
      imported: 0,
      errors: transactionData.length
    };
  }
}

async function importReviews(reviewData) {
  console.log('⭐ Importing reviews...');
  
  try {
    await Models.Review.deleteMany({});
    
    const reviews = [];
    for (const review of reviewData) {
      const jobId = idMappings.jobs.get(review.jobId);
      const reviewerId = idMappings.users.get(review.reviewerId);
      const revieweeId = idMappings.users.get(review.revieweeId);
      
      if (!jobId || !reviewerId || !revieweeId) {
        console.warn(`Skipping review ${review.sqlId}: references not found`);
        continue;
      }
      
      const newReview = new Models.Review({
        ...review,
        jobId,
        reviewerId,
        revieweeId,
        _id: review._id
      });
      
      reviews.push(newReview);
    }

    const result = await Models.Review.insertMany(reviews);
    
    return {
      imported: result.length,
      errors: reviewData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing reviews:', error);
    return {
      imported: 0,
      errors: reviewData.length
    };
  }
}

async function importNotifications(notificationData) {
  console.log('🔔 Importing notifications...');
  
  try {
    await Models.Notification.deleteMany({});
    
    const notifications = [];
    for (const notif of notificationData) {
      const userId = idMappings.users.get(notif.userId);
      
      if (!userId) {
        console.warn(`Skipping notification ${notif.sqlId}: user not found`);
        continue;
      }
      
      // Resolve data references
      const data = { ...notif.data };
      if (data.jobId) data.jobId = idMappings.jobs.get(data.jobId);
      if (data.conversationId) data.conversationId = idMappings.conversations.get(data.conversationId);
      
      const newNotification = new Models.Notification({
        ...notif,
        userId,
        data,
        _id: notif._id
      });
      
      notifications.push(newNotification);
    }

    const result = await Models.Notification.insertMany(notifications);
    
    return {
      imported: result.length,
      errors: notificationData.length - result.length
    };
    
  } catch (error) {
    console.error('Error importing notifications:', error);
    return {
      imported: 0,
      errors: notificationData.length
    };
  }
}

// Run import if called directly
if (require.main === module) {
  importToMongoDB()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importToMongoDB };