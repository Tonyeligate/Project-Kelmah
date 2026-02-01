/**
 * Master Migration Script
 * Orchestrates the complete SQL to MongoDB migration process
 */

const { exportData } = require('./01_export_sql_data');
const { transformData } = require('./03_transform_data');
const { importToMongoDB } = require('./04_import_mongodb');

async function runCompleteMigration() {
  console.log('🚀 Starting complete SQL to MongoDB migration...');
  console.log('=' . repeat(60));

  const startTime = Date.now();

  try {
    // Step 1: Export SQL data
    console.log('\n📤 STEP 1: Exporting SQL data...');
    await exportData();
    console.log('✅ SQL export completed');

    // Step 2: Transform data
    console.log('\n🔄 STEP 2: Transforming data...');
    await transformData();
    console.log('✅ Data transformation completed');

    // Step 3: Import to MongoDB
    console.log('\n📦 STEP 3: Importing to MongoDB...');
    await importToMongoDB();
    console.log('✅ MongoDB import completed');

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=' . repeat(60));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('📁 Check the following directories for logs:');
    console.log('   - exports/ (SQL export files)');
    console.log('   - transformed/ (Transformed data files)');
    console.log('   - import_summary.json (Import results)');

  } catch (error) {
    console.error('💥 MIGRATION FAILED:', error);
    console.log('\n🔍 Troubleshooting steps:');
    console.log('1. Check database connections');
    console.log('2. Verify SQL data exports');
    console.log('3. Review transformation logs');
    console.log('4. Check MongoDB connection and permissions');
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔧 Kelmah Database Migration Tool

Usage:
  node run_migration.js [options]

Options:
  --help, -h     Show this help message
  --export-only  Only export SQL data
  --transform    Only transform data (requires export)
  --import       Only import to MongoDB (requires transformation)

Examples:
  node run_migration.js                    # Run complete migration
  node run_migration.js --export-only      # Only export SQL data
  node run_migration.js --transform        # Only transform data
  node run_migration.js --import           # Only import to MongoDB

Environment Variables:
  MONGODB_URI    MongoDB connection string (default: mongodb://localhost:27017/kelmah)
  NODE_ENV       Environment (development/production)
  `);
  process.exit(0);
}

// Handle individual steps
if (args.includes('--export-only')) {
  exportData()
    .then(() => {
      console.log('✅ Export completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
} else if (args.includes('--transform')) {
  transformData()
    .then(() => {
      console.log('✅ Transformation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Transformation failed:', error);
      process.exit(1);
    });
} else if (args.includes('--import')) {
  importToMongoDB()
    .then(() => {
      console.log('✅ Import completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
} else {
  // Run complete migration
  runCompleteMigration();
}

module.exports = { runCompleteMigration };