/**
 * SQL Data Export Script
 * Exports all data from current Sequelize models to JSON files
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Import current models
const db = require('../kelmah-backend/models');

// Export directory
const exportDir = path.join(__dirname, 'exports');

async function exportData() {
  try {
    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    console.log('🚀 Starting SQL data export...');

    // List of models to export
    const modelsToExport = [
      'User',
      'Job', 
      'Profile',
      'Contract',
      'Conversation',
      'Message',
      'Notification',
      'Review',
      'Dispute',
      'Escrow',
      'Transaction',
      'Wallet',
      'Subscription',
      'Plan'
    ];

    const exportResults = {};

    for (const modelName of modelsToExport) {
      try {
        console.log(`📊 Exporting ${modelName}...`);
        
        const model = db[modelName];
        if (!model) {
          console.warn(`⚠️  Model ${modelName} not found, skipping...`);
          continue;
        }

        // Export all records
        const records = await model.findAll({
          raw: true // Get plain objects instead of Sequelize instances
        });

        // Save to JSON file
        const filename = `${modelName.toLowerCase()}_export.json`;
        const filepath = path.join(exportDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(records, null, 2));
        
        exportResults[modelName] = {
          count: records.length,
          file: filename,
          exported: true
        };

        console.log(`✅ ${modelName}: ${records.length} records exported`);
        
      } catch (error) {
        console.error(`❌ Error exporting ${modelName}:`, error.message);
        exportResults[modelName] = {
          count: 0,
          error: error.message,
          exported: false
        };
      }
    }

    // Save export summary
    const summaryPath = path.join(exportDir, 'export_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(exportResults, null, 2));

    console.log('📋 Export Summary:');
    console.table(exportResults);
    
    console.log('🎉 SQL data export completed!');
    console.log(`📁 Files saved to: ${exportDir}`);

  } catch (error) {
    console.error('💥 Export failed:', error);
    process.exit(1);
  }
}

// Run export if called directly
if (require.main === module) {
  exportData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { exportData };