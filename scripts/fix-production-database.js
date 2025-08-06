#!/usr/bin/env node

/**
 * 🚨 CRITICAL DATABASE SCHEMA FIX SCRIPT
 * Fixes production TimescaleDB schema issues and missing columns
 */

const { Client } = require('pg');
require('dotenv').config();

const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.TIMESCALE_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable required');
    process.exit(1);
  }

  return {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

async function fixProductionDatabase() {
  console.log('🚨 STARTING CRITICAL DATABASE SCHEMA FIX');
  
  const client = new Client(getDatabaseConfig());

  try {
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Add missing columns
    const schemaUpdates = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_type VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_hires INTEGER DEFAULT 0`
    ];

    for (const update of schemaUpdates) {
      try {
        await client.query(update);
        console.log('✅ Schema update completed');
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message}`);
      }
    }

    console.log('🎉 DATABASE SCHEMA FIX COMPLETED!');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  fixProductionDatabase().catch(console.error);
}

module.exports = { fixProductionDatabase };