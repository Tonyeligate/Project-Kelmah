/**
 * Database Configuration
 * Configures Sequelize ORM for database connection
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kelmah',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg)
};

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  pool: {
      max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
    },
    dialectOptions: {
      // Native PostgreSQL options
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    timezone: '+00:00' // Use UTC for all date/time operations
  }
);

// Initialize models
const initModels = () => {
  // Import model definitions
  const Conversation = require('../models/conversation.model')(sequelize);
  const Message = require('../models/message.model')(sequelize);
  const Participant = require('../models/participant.model')(sequelize);
  
  // Define associations
  // Conversation - Message: One-to-Many
  Conversation.hasMany(Message, {
    as: 'messages',
    foreignKey: 'conversationId'
  });
  Message.belongsTo(Conversation, {
    as: 'conversation',
    foreignKey: 'conversationId'
  });
  
  // Conversation - Participant: One-to-Many
  Conversation.hasMany(Participant, {
    as: 'participants',
    foreignKey: 'conversationId'
  });
  Participant.belongsTo(Conversation, {
    as: 'conversation',
    foreignKey: 'conversationId'
  });
  
  // Message - Message (Self-referencing for replies)
  Message.belongsTo(Message, {
    as: 'replyTo',
    foreignKey: 'replyToId'
  });
  Message.hasMany(Message, {
    as: 'replies',
    foreignKey: 'replyToId'
  });
  
  // User associations (User model is imported from auth-service)
  // We need to make sure the User model is defined with the same attributes
  if (!sequelize.models.User) {
    // Create a placeholder User model if not already defined
    const User = sequelize.define('User', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active',
        allowNull: false
      },
      lastSeen: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isOnline: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'users',
      timestamps: true
    });
    
    logger.info('Created placeholder User model for associations');
  }
  
  const User = sequelize.models.User;
  
  // User - Message: One-to-Many
  User.hasMany(Message, {
    as: 'messages',
    foreignKey: 'senderId'
  });
  Message.belongsTo(User, {
    as: 'sender',
    foreignKey: 'senderId'
  });
  
  // User - Participant: One-to-Many
  User.hasMany(Participant, {
    as: 'participations',
    foreignKey: 'userId'
  });
  Participant.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId'
  });
  
  logger.info('Database models initialized and associations defined');
  
  return {
    sequelize,
    Conversation,
    Message,
    Participant,
    User
  };
};

// Export the sequelize instance and initialized models
module.exports = initModels(); 