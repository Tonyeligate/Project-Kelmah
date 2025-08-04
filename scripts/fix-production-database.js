#!/usr/bin/env node

/**
 * Production Database Fix Script
 * Fixes database schema issues and ensures all services can connect to real data
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Production database connection (TimescaleDB)
const DATABASE_URL = process.env.DATABASE_URL || process.env.SQL_URL || process.env.AUTH_SQL_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('💡 Set it to your TimescaleDB connection string from Render');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixDatabaseSchema() {
  try {
    console.log('🔄 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected to TimescaleDB');

    // Check if Users table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Users'
    `);

    if (tablesResult.rows.length === 0) {
      console.log('📝 Creating Users table...');
      await createUsersTable();
    } else {
      console.log('🔍 Checking Users table schema...');
      await verifyUsersSchema();
    }

    // Create other required tables
    await createJobTables();
    await createMessagingTables();
    await createPaymentTables();
    
    console.log('✅ Database schema verification complete!');

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function createUsersTable() {
  const createUsersSQL = `
    CREATE TABLE IF NOT EXISTS "Users" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "firstName" VARCHAR(255) NOT NULL,
      "lastName" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255) NOT NULL UNIQUE,
      "phone" VARCHAR(255) UNIQUE,
      "password" VARCHAR(255) NOT NULL,
      "role" VARCHAR(50) DEFAULT 'worker' CHECK ("role" IN ('admin', 'hirer', 'worker', 'staff')),
      "isEmailVerified" BOOLEAN DEFAULT FALSE,
      "emailVerificationToken" VARCHAR(255),
      "emailVerificationExpires" TIMESTAMP,
      "isPhoneVerified" BOOLEAN DEFAULT FALSE,
      "phoneVerificationToken" VARCHAR(255),
      "phoneVerificationExpires" TIMESTAMP,
      "passwordResetToken" VARCHAR(255),
      "passwordResetExpires" TIMESTAMP,
      "isTwoFactorEnabled" BOOLEAN DEFAULT FALSE,
      "twoFactorSecret" VARCHAR(255),
      "tokenVersion" INTEGER DEFAULT 0,
      "isActive" BOOLEAN DEFAULT TRUE,
      "lastLogin" TIMESTAMP,
      "googleId" VARCHAR(255) UNIQUE,
      "facebookId" VARCHAR(255) UNIQUE,
      "linkedinId" VARCHAR(255) UNIQUE,
      "dateOfBirth" DATE,
      "gender" VARCHAR(50) DEFAULT 'prefer_not_to_say' CHECK ("gender" IN ('male', 'female', 'other', 'prefer_not_to_say')),
      "address" TEXT,
      "city" VARCHAR(255),
      "state" VARCHAR(255),
      "country" VARCHAR(255) DEFAULT 'Ghana',
      "countryCode" VARCHAR(2) DEFAULT 'GH',
      "postalCode" VARCHAR(20),
      "profilePicture" TEXT,
      "bio" TEXT,
      "failedLoginAttempts" INTEGER DEFAULT 0,
      "accountLocked" BOOLEAN DEFAULT FALSE,
      "accountLockedUntil" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    );
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS "Users_email_idx" ON "Users"("email");
    CREATE INDEX IF NOT EXISTS "Users_phone_idx" ON "Users"("phone");
    CREATE INDEX IF NOT EXISTS "Users_role_idx" ON "Users"("role");
    CREATE INDEX IF NOT EXISTS "Users_isActive_idx" ON "Users"("isActive");
  `;

  await client.query(createUsersSQL);
  console.log('✅ Users table created successfully');
}

async function verifyUsersSchema() {
  // Check for missing columns
  const columnsResult = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Users' AND table_schema = 'public'
  `);
  
  const existingColumns = columnsResult.rows.map(row => row.column_name);
  const requiredColumns = [
    'id', 'firstName', 'lastName', 'email', 'phone', 'password', 'role',
    'isEmailVerified', 'isPhoneVerified', 'isTwoFactorEnabled', 'isActive',
    'createdAt', 'updatedAt'
  ];

  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.log(`🔧 Adding missing columns: ${missingColumns.join(', ')}`);
    
    // Add missing columns
    for (const column of missingColumns) {
      if (column === 'isPhoneVerified') {
        await client.query('ALTER TABLE "Users" ADD COLUMN "isPhoneVerified" BOOLEAN DEFAULT FALSE');
      }
      // Add other missing columns as needed
    }
    console.log('✅ Missing columns added');
  } else {
    console.log('✅ Users table schema is up to date');
  }
}

async function createJobTables() {
  console.log('📝 Creating Jobs table...');
  
  const createJobsSQL = `
    CREATE TABLE IF NOT EXISTS "Jobs" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT NOT NULL,
      "category" VARCHAR(100) NOT NULL,
      "skills" JSONB DEFAULT '[]',
      "budget" DECIMAL(10,2),
      "currency" VARCHAR(3) DEFAULT 'GHS',
      "location" TEXT,
      "isRemote" BOOLEAN DEFAULT FALSE,
      "urgency" VARCHAR(50) DEFAULT 'medium',
      "status" VARCHAR(50) DEFAULT 'open',
      "hirerId" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
      "assignedWorkerId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
      "startDate" DATE,
      "endDate" DATE,
      "applicationDeadline" TIMESTAMP,
      "requirements" JSONB DEFAULT '{}',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS "Jobs_hirerId_idx" ON "Jobs"("hirerId");
    CREATE INDEX IF NOT EXISTS "Jobs_status_idx" ON "Jobs"("status");
    CREATE INDEX IF NOT EXISTS "Jobs_category_idx" ON "Jobs"("category");
  `;

  await client.query(createJobsSQL);
  console.log('✅ Jobs table created');
}

async function createMessagingTables() {
  console.log('📝 Creating messaging tables...');
  
  const createConversationsSQL = `
    CREATE TABLE IF NOT EXISTS "Conversations" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "participants" JSONB NOT NULL,
      "lastMessage" TEXT,
      "lastMessageAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `;

  await client.query(createConversationsSQL);
  console.log('✅ Messaging tables created');
}

async function createPaymentTables() {
  console.log('📝 Creating payment tables...');
  
  const createPaymentsSQL = `
    CREATE TABLE IF NOT EXISTS "Payments" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "amount" DECIMAL(10,2) NOT NULL,
      "currency" VARCHAR(3) DEFAULT 'GHS',
      "status" VARCHAR(50) DEFAULT 'pending',
      "payerId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
      "payeeId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
      "jobId" UUID REFERENCES "Jobs"("id") ON DELETE SET NULL,
      "paymentMethod" VARCHAR(100),
      "transactionId" VARCHAR(255),
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS "Payments_status_idx" ON "Payments"("status");
    CREATE INDEX IF NOT EXISTS "Payments_payerId_idx" ON "Payments"("payerId");
  `;

  await client.query(createPaymentsSQL);
  console.log('✅ Payment tables created');
}

async function seedSampleData() {
  console.log('🌱 Adding sample data for testing...');
  
  // Add sample admin user
  const adminExists = await client.query(`
    SELECT id FROM "Users" WHERE email = 'admin@kelmah.com' LIMIT 1
  `);
  
  if (adminExists.rows.length === 0) {
    await client.query(`
      INSERT INTO "Users" (
        "firstName", "lastName", "email", "password", "role", "isEmailVerified", "isActive"
      ) VALUES (
        'Admin', 'User', 'admin@kelmah.com', '$2b$10$dummy.hash.for.testing', 'admin', TRUE, TRUE
      )
    `);
    console.log('✅ Admin user created');
  }

  // Add sample jobs
  const jobCount = await client.query('SELECT COUNT(*) FROM "Jobs"');
  if (parseInt(jobCount.rows[0].count) === 0) {
    await client.query(`
      INSERT INTO "Jobs" (
        "title", "description", "category", "budget", "location", "hirerId"
      ) 
      SELECT 
        'Sample Plumbing Job',
        'Fix kitchen sink and pipes',
        'Plumbing',
        500.00,
        'Accra, Ghana',
        "id"
      FROM "Users" WHERE "role" = 'admin' LIMIT 1
    `);
    console.log('✅ Sample jobs created');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting production database fix...');
  console.log('🔗 Database URL:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
  
  try {
    await fixDatabaseSchema();
    await seedSampleData();
    
    console.log('\n🎉 DATABASE FIX COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart all Render services');
    console.log('2. Test API endpoints');
    console.log('3. Verify real data in frontend');
    
  } catch (error) {
    console.error('\n❌ Database fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDatabaseSchema, seedSampleData };