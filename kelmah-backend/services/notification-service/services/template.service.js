/**
 * Template Service for Notifications
 * Manages templates for all notification types and channels
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } = require('../constants');
const logger = require('../../../utils/logger');

// Cache for compiled templates
const templateCache = new Map();

/**
 * Get template file path
 * @param {string} type - Notification type 
 * @param {string} channel - Delivery channel
 * @returns {string} Template file path
 */
function getTemplatePath(type, channel) {
  // Convert notification type to kebab case for file names
  const typeKebab = type.toLowerCase().replace(/_/g, '-');
  
  switch(channel) {
    case NOTIFICATION_CHANNELS.EMAIL:
      return path.join(__dirname, '../templates/email', `${typeKebab}-notification.html`);
    case NOTIFICATION_CHANNELS.SMS:
      return path.join(__dirname, '../templates/sms', `${typeKebab}-notification.txt`);
    case NOTIFICATION_CHANNELS.PUSH:
      return path.join(__dirname, '../templates/push', `${typeKebab}-notification.json`);
    default:
      return null;
  }
}

/**
 * Get fallback template file path
 * @param {string} channel - Delivery channel
 * @returns {string} Fallback template file path
 */
function getFallbackTemplatePath(channel) {
  switch(channel) {
    case NOTIFICATION_CHANNELS.EMAIL:
      return path.join(__dirname, '../templates/email', 'notification.html');
    case NOTIFICATION_CHANNELS.SMS:
      return path.join(__dirname, '../templates/sms', 'notification.txt');
    case NOTIFICATION_CHANNELS.PUSH:
      return path.join(__dirname, '../templates/push', 'notification.json');
    default:
      return null;
  }
}

/**
 * Load template from file
 * @param {string} templatePath - Path to template file
 * @returns {Promise<string>} Template content
 */
async function loadTemplate(templatePath) {
  try {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    const template = await readFile(templatePath, 'utf8');
    return template;
  } catch (error) {
    logger.error(`Error loading template: ${error.message}`);
    throw error;
  }
}

/**
 * Register a template in the cache
 * @param {string} type - Notification type
 * @param {string} channel - Delivery channel
 * @param {string} template - Template content
 */
function registerTemplate(type, channel, template) {
  const cacheKey = `${type}:${channel}`;
  
  try {
    const compiledTemplate = handlebars.compile(template);
    templateCache.set(cacheKey, compiledTemplate);
    logger.info(`Registered template for ${type} on ${channel} channel`);
  } catch (error) {
    logger.error(`Error compiling template for ${type} on ${channel} channel: ${error.message}`);
    throw error;
  }
}

/**
 * Get template for notification type and channel
 * @param {string} type - Notification type
 * @param {string} channel - Delivery channel
 * @returns {Promise<Function>} Compiled template function
 */
async function getTemplate(type, channel) {
  const cacheKey = `${type}:${channel}`;
  
  // Check if template is already in cache
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }
  
  try {
    // Try to load specific template
    const templatePath = getTemplatePath(type, channel);
    let template;
    
    try {
      template = await loadTemplate(templatePath);
    } catch (error) {
      // If specific template not found, use fallback
      logger.warn(`Specific template not found for ${type} on ${channel}, using fallback`);
      const fallbackPath = getFallbackTemplatePath(channel);
      template = await loadTemplate(fallbackPath);
    }
    
    // Compile and cache template
    const compiledTemplate = handlebars.compile(template);
    templateCache.set(cacheKey, compiledTemplate);
    return compiledTemplate;
  } catch (error) {
    logger.error(`Failed to get template for ${type} on ${channel}: ${error.message}`);
    throw error;
  }
}

/**
 * Render template with data
 * @param {string} type - Notification type
 * @param {string} channel - Delivery channel
 * @param {Object} data - Data to render template with
 * @returns {Promise<string>} Rendered template
 */
async function renderTemplate(type, channel, data = {}) {
  try {
    const template = await getTemplate(type, channel);
    return template(data);
  } catch (error) {
    logger.error(`Error rendering template: ${error.message}`);
    throw error;
  }
}

/**
 * Initialize and cache all available templates
 */
async function initializeTemplates() {
  logger.info('Initializing notification templates');
  
  // Register handlebars helpers
  handlebars.registerHelper('formatDate', function(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  });
  
  handlebars.registerHelper('formatTime', function(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
  });
  
  handlebars.registerHelper('formatDateTime', function(date) {
    if (!date) return '';
    return new Date(date).toLocaleString();
  });

  handlebars.registerHelper('truncate', function(str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  });
  
  // Load all email templates
  try {
    // Preload common templates
    const notificationTemplate = await loadTemplate(
      path.join(__dirname, '../templates/email', 'notification.html')
    );
    registerTemplate('DEFAULT', NOTIFICATION_CHANNELS.EMAIL, notificationTemplate);
    
    // Preload specific templates for each notification type
    for (const type of Object.values(NOTIFICATION_TYPES)) {
      const templatePath = getTemplatePath(type, NOTIFICATION_CHANNELS.EMAIL);
      
      try {
        if (fs.existsSync(templatePath)) {
          const template = await loadTemplate(templatePath);
          registerTemplate(type, NOTIFICATION_CHANNELS.EMAIL, template);
        }
      } catch (error) {
        logger.warn(`Could not load template for ${type}: ${error.message}`);
        // Continue with next template
      }
    }
    
    logger.info('Notification templates initialized successfully');
  } catch (error) {
    logger.error(`Error initializing templates: ${error.message}`);
  }
}

module.exports = {
  getTemplate,
  renderTemplate,
  registerTemplate,
  initializeTemplates
}; 