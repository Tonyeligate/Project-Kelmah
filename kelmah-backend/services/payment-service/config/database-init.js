/**
 * Payment Service Database Initialization
 * This script initializes the database tables for the payment service
 */

const sequelize = require('./database');
const { 
  Payment, 
  Escrow, 
  Dispute, 
  Plan, 
  Subscription, 
  PaymentMethod, 
  Transaction,
  defineAssociations 
} = require('../models');
const logger = require('../utils/logger');

// Define model associations
defineAssociations();

/**
 * Initialize the database
 * Create all tables if they don't exist
 */
const initializeDatabase = async (force = false) => {
  try {
    logger.info('Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models with database
    logger.info(`Synchronizing models with database (force: ${force})...`);
    
    if (force) {
      logger.warn('CAUTION: Force sync will drop existing tables!');
    }
    
    await sequelize.sync({ force });
    
    logger.info('Database initialization completed successfully.');
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Seed initial data for plans
 */
const seedPlans = async () => {
  try {
    const existingPlans = await Plan.findAll();
    
    if (existingPlans.length > 0) {
      logger.info('Plans already exist in the database, skipping seed...');
      return;
    }
    
    logger.info('Seeding initial plans...');
    
    // Freelancer plans
    await Plan.create({
      name: 'Freelancer Free',
      slug: 'freelancer-free',
      description: 'Basic plan for freelancers just getting started',
      type: 'freelancer',
      tier: 'free',
      price: 0,
      currency: 'GHS',
      billingCycle: 'monthly',
      isDefault: true,
      displayOrder: 1,
      features: {
        browse_jobs: true,
        apply_jobs: true,
        max_applications: 10,
        profile_visibility: 'limited',
        skills_assessment: false,
        portfolio_projects: 2
      },
      limits: {
        monthly_applications: 10,
        portfolio_projects: 2,
        saved_jobs: 5
      },
      comparePosition: 'basic'
    });
    
    await Plan.create({
      name: 'Freelancer Pro',
      slug: 'freelancer-pro',
      description: 'Enhanced visibility and more opportunities for serious freelancers',
      type: 'freelancer',
      tier: 'premium',
      price: 49.99,
      currency: 'GHS',
      billingCycle: 'monthly',
      isDefault: false,
      isFeatured: true,
      displayOrder: 2,
      features: {
        browse_jobs: true,
        apply_jobs: true,
        max_applications: 50,
        profile_visibility: 'full',
        skills_assessment: true,
        portfolio_projects: 10,
        featured_profile: true,
        early_access_jobs: true,
        custom_proposals: true
      },
      limits: {
        monthly_applications: 50,
        portfolio_projects: 10,
        saved_jobs: 25
      },
      trialDays: 7,
      hasTrial: true,
      comparePosition: 'premium',
      annualDiscount: 20
    });
    
    // Hirer plans
    await Plan.create({
      name: 'Hirer Basic',
      slug: 'hirer-basic',
      description: 'Post jobs and find talent for small projects',
      type: 'hirer',
      tier: 'basic',
      price: 29.99,
      currency: 'GHS',
      billingCycle: 'monthly',
      isDefault: true,
      displayOrder: 1,
      features: {
        post_jobs: true,
        invite_freelancers: true,
        max_active_jobs: 2,
        applicant_screening: 'basic',
        escrow_payment: true
      },
      limits: {
        monthly_job_posts: 3,
        monthly_invites: 20,
        saved_freelancers: 10
      },
      comparePosition: 'basic'
    });
    
    await Plan.create({
      name: 'Hirer Business',
      slug: 'hirer-business',
      description: 'Complete solution for businesses with ongoing talent needs',
      type: 'hirer',
      tier: 'premium',
      price: 99.99,
      currency: 'GHS',
      billingCycle: 'monthly',
      isDefault: false,
      isFeatured: true,
      displayOrder: 2,
      features: {
        post_jobs: true,
        invite_freelancers: true,
        max_active_jobs: 10,
        applicant_screening: 'advanced',
        escrow_payment: true,
        featured_jobs: true,
        team_access: true,
        dedicated_support: true
      },
      limits: {
        monthly_job_posts: 15,
        monthly_invites: 100,
        saved_freelancers: 50,
        team_members: 5
      },
      trialDays: 14,
      hasTrial: true,
      comparePosition: 'premium',
      annualDiscount: 15
    });
    
    // Business plans
    await Plan.create({
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Custom solution for large organizations with specific requirements',
      type: 'enterprise',
      tier: 'enterprise',
      price: 499.99,
      currency: 'GHS',
      billingCycle: 'monthly',
      isDefault: true,
      isFeatured: true,
      displayOrder: 1,
      features: {
        post_jobs: true,
        invite_freelancers: true,
        max_active_jobs: 'unlimited',
        applicant_screening: 'premium',
        escrow_payment: true,
        featured_jobs: true,
        team_access: true,
        dedicated_support: true,
        custom_branding: true,
        custom_contracts: true,
        api_access: true
      },
      limits: {
        monthly_job_posts: 'unlimited',
        monthly_invites: 'unlimited',
        saved_freelancers: 'unlimited',
        team_members: 20
      },
      trialDays: 30,
      hasTrial: true,
      trialRequiresCreditCard: false,
      comparePosition: 'not_shown',
      userTypes: ['business', 'enterprise'],
      annualDiscount: 25
    });
    
    logger.info('Plan seeding completed successfully.');
  } catch (error) {
    logger.error('Failed to seed plans:', error);
    throw error;
  }
};

/**
 * Initialize everything in the correct order
 */
const initialize = async (options = {}) => {
  const { force = false, seed = true } = options;
  
  try {
    await initializeDatabase(force);
    
    if (seed) {
      await seedPlans();
    }
    
    logger.info('Payment service database initialization completed successfully.');
    return true;
  } catch (error) {
    logger.error('Failed to initialize payment service database:', error);
    throw error;
  }
};

module.exports = {
  initialize,
  initializeDatabase,
  seedPlans
}; 