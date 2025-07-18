module.exports = {
  sendVerificationEmail: async ({ name, email, verificationUrl }) => {},
  sendPasswordResetEmail: async ({ name, email, resetUrl }) => {},
  sendPasswordChangedEmail: async ({ name, email }) => {},
  sendAccountDeactivationEmail: async ({ name, email }) => {},
  sendAccountReactivationEmail: async ({ name, email }) => {},
  sendAccountLockedEmail: async ({ name, email }) => {},
  sendLoginNotificationEmail: async ({ name, email }) => {},
};
