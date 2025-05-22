/**
 * Fraud Detection Scheduler
 * Schedules periodic scans for detecting fraud and suspicious activities
 */

const cron = require('node-cron');
const fraudDetectionController = require('../controllers/fraud-detection.controller');
const logger = require('../utils/logger');

/**
 * Initialize fraud detection scheduled tasks
 */
const initFraudDetectionScheduler = () => {
  // Run fraud detection scan every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    logger.info('Starting scheduled fraud detection scan');
    try {
      await fraudDetectionController.runFraudDetectionScan();
      logger.info('Completed scheduled fraud detection scan');
    } catch (error) {
      logger.error('Error running scheduled fraud detection scan:', error);
    }
  });
  
  // Run a more intensive daily fraud analysis at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily comprehensive fraud analysis');
    try {
      // In a real implementation, this would run more intensive checks
      // For now, just run the standard scan
      await fraudDetectionController.runFraudDetectionScan();
      logger.info('Completed daily comprehensive fraud analysis');
    } catch (error) {
      logger.error('Error running daily fraud analysis:', error);
    }
  });
  
  logger.info('Fraud detection scheduler initialized');
};

module.exports = { initFraudDetectionScheduler }; 