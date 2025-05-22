/**
 * Passport Configuration
 * Configures OAuth strategies for authentication
 */

const passport = require('passport');
const { logger } = require('../utils/logger');

// Mock strategies for development
const mockStrategy = (name) => ({
  name,
  authenticate: function(req, options) {
    const user = { 
      id: 'mock-user-id',
      provider: name,
      displayName: 'Mock User',
      emails: [{ value: 'mockuser@example.com' }]
    };
    
    logger.info(`Mock ${name} authentication for development`);
    return this.success(user);
  }
});

// Use simple mock strategies for now
passport.use('google', mockStrategy('google'));
passport.use('facebook', mockStrategy('facebook'));
passport.use('linkedin', mockStrategy('linkedin'));

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
passport.deserializeUser((id, done) => {
  // In a real app, we would fetch the user from the database
  done(null, { id });
});

module.exports = passport; 