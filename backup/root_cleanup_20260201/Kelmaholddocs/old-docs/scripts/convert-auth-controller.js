#!/usr/bin/env node

/**
 * Script to convert Auth Controller from Sequelize to Mongoose
 * Handles common Sequelize to Mongoose conversions
 */

const fs = require('fs');
const path = require('path');

// File path
const authControllerPath = path.join(__dirname, '../kelmah-backend/services/auth-service/controllers/auth.controller.js');

// Read the current file
let content = fs.readFileSync(authControllerPath, 'utf8');

console.log('🔄 Converting Auth Controller from Sequelize to Mongoose...');

// Remove Sequelize import
content = content.replace('const { Op } = require("sequelize");', '// Sequelize Op removed - using MongoDB query operators directly');

// Convert findByPk to findById
content = content.replace(/User\.findByPk\(/g, 'User.findById(');
content = content.replace(/RefreshToken\.findByPk\(/g, 'RefreshToken.findById(');

// Convert Sequelize where clauses to MongoDB queries
// RefreshToken.findOne({ where: { token: refreshToken, expiresAt: { [Op.gt]: new Date() } } })
// becomes RefreshToken.findOne({ token: refreshToken, expiresAt: { $gt: new Date() } })
content = content.replace(/findOne\(\s*{\s*where:\s*{([^}]+)}\s*}\s*\)/g, 'findOne({ $1 })');

// Convert Op.gt to $gt
content = content.replace(/\[Op\.gt\]:/g, '$gt:');
content = content.replace(/\[Op\.lt\]:/g, '$lt:');
content = content.replace(/\[Op\.gte\]:/g, '$gte:');
content = content.replace(/\[Op\.lte\]:/g, '$lte:');
content = content.replace(/\[Op\.ne\]:/g, '$ne:');
content = content.replace(/\[Op\.in\]:/g, '$in:');
content = content.replace(/\[Op\.notIn\]:/g, '$nin:');

// Convert destroy to deleteMany/deleteOne
content = content.replace(/RefreshToken\.destroy\(\s*{\s*where:\s*{([^}]+)}\s*}\s*\)/g, 'RefreshToken.deleteMany({ $1 })');

// Convert attributes selection to Mongoose select
content = content.replace(/,\s*{\s*attributes:\s*\[([^\]]+)\]\s*}/g, '.select("$1")');

// Fix select format (convert array format to string)
content = content.replace(/\.select\("([^"]+)"\)/g, (match, fields) => {
  // Convert array-like string to space-separated string
  const cleanFields = fields.replace(/"/g, '').replace(/,/g, ' ').trim();
  return `.select("${cleanFields}")`;
});

// Convert create operations (they should work the same)
// But ensure we handle the response correctly

console.log('✅ Basic conversions completed');

// Write the updated content
fs.writeFileSync(authControllerPath, content);

console.log('🎉 Auth Controller conversion completed!');
console.log('⚠️  Manual review required for complex queries and error handling');
console.log('📋 Next steps:');
console.log('1. Review the updated file');
console.log('2. Test the auth endpoints');
console.log('3. Update any remaining Sequelize-specific code');