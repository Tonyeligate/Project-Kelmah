/**
 * Image Processing Utility
 * Handles image resizing and thumbnail generation
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

// Max dimensions for thumbnails
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

/**
 * Generate a thumbnail for an image
 * @param {string} filePath - Path to original image
 * @param {string} thumbnailPath - Path where thumbnail should be saved
 * @returns {Promise<boolean>} - Success status
 */
exports.generateThumbnail = async (filePath, thumbnailPath) => {
  try {
    // Process with sharp
    await sharp(filePath)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(thumbnailPath);
    
    logger.info(`Generated thumbnail: ${thumbnailPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to generate thumbnail: ${error.message}`);
    return false;
  }
};

/**
 * Process an uploaded image (generate thumbnails, resize if needed)
 * @param {string} fileName - File name
 * @param {string} uploadDir - Upload directory
 * @returns {Promise<void>}
 */
exports.processImage = async (fileName, uploadDir) => {
  const filePath = path.join(uploadDir, fileName);
  const thumbnailPath = path.join(uploadDir, `thumb_${fileName}`);
  
  try {
    // Check if file exists and is an image
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      logger.error(`Not a file: ${filePath}`);
      return;
    }
    
    // Generate thumbnail
    await this.generateThumbnail(filePath, thumbnailPath);
    
    // Additional processing could be added here:
    // - Extract EXIF data
    // - Optimize image
    // - Add watermark
    // - Convert format
  } catch (error) {
    logger.error(`Error processing image: ${error.message}`);
  }
};

/**
 * Check if a file is an image based on mimetype
 * @param {string} mimetype - File mimetype
 * @returns {boolean} - True if image
 */
exports.isImage = (mimetype) => {
  return mimetype.startsWith('image/');
}; 