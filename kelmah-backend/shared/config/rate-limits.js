/**
 * Rate Limiting Configuration
 * Define rate limits per endpoint type
 */

module.exports = {
  default: {
    limit: 100,
    window: 900 // 15 minutes in seconds
  },
  login: {
    limit: 10,
    window: 900
  },
  register: {
    limit: 5,
    window: 900
  },
  passwordReset: {
    limit: 5,
    window: 900
  },
  emailVerification: {
    limit: 5,
    window: 900
  },
  search: {
    limit: 60,
    window: 60 // 1 minute
  },
  upload: {
    limit: 10,
    window: 300 // 5 minutes
  },
  messaging: {
    limit: 60,
    window: 60
  }
};
