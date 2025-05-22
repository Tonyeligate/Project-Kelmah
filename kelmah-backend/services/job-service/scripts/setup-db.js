/**
 * Database Setup Script
 * Runs migrations and seeders for the job service
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

// Set up environment variables for Sequelize CLI
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Directory paths
const SERVICE_DIR = path.resolve(__dirname, '..');

// Function to execute shell commands as promises
function execCommand(command, cwd = SERVICE_DIR) {
  return new Promise((resolve, reject) => {
    logger.info(`Executing: ${command}`);
    
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error: ${error.message}`);
        logger.error(`stderr: ${stderr}`);
        return reject(error);
      }
      
      if (stderr) {
        logger.warn(`stderr: ${stderr}`);
      }
      
      logger.info(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Run database migrations
async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    await execCommand('npx sequelize-cli db:migrate');
    logger.info('Database migrations completed successfully.');
    return true;
  } catch (error) {
    logger.error('Failed to run database migrations:', error);
    return false;
  }
}

// Run database seeders
async function runSeeders() {
  try {
    logger.info('Running database seeders...');
    await execCommand('npx sequelize-cli db:seed:all');
    logger.info('Database seeders completed successfully.');
    return true;
  } catch (error) {
    logger.error('Failed to run database seeders:', error);
    return false;
  }
}

// Main function to set up the database
async function setupDatabase() {
  try {
    logger.info('Starting database setup...');
    
    // Run migrations
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
      logger.error('Migration failed. Database setup incomplete.');
      process.exit(1);
    }
    
    // Run seeders
    const seedersSuccess = await runSeeders();
    if (!seedersSuccess) {
      logger.warn('Seeders failed but migrations were successful. Database setup partially complete.');
      process.exit(1);
    }
    
    logger.info('Database setup completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('An unexpected error occurred during database setup:', error);
    process.exit(1);
  }
}

// Execute the setup
setupDatabase(); 