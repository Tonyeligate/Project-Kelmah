const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kelma_user:MjlsUDU3EbIEfRyAw7aaeCgvxk0D0DL8@dpg-d1pns2ruibrs73duqpq0-a.oregon-postgres.render.com/kelma',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create team_registrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_registrations (
        id SERIAL PRIMARY KEY,
        personal_info JSONB NOT NULL,
        technical_background JSONB NOT NULL,
        commitment JSONB NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        applicant_score INTEGER DEFAULT 0,
        is_selected BOOLEAN DEFAULT FALSE,
        selection_rank INTEGER,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_team_registrations_email ON team_registrations(email);
      CREATE INDEX IF NOT EXISTS idx_team_registrations_status ON team_registrations(status);
      CREATE INDEX IF NOT EXISTS idx_team_registrations_selected ON team_registrations(is_selected, selection_rank);
      CREATE INDEX IF NOT EXISTS idx_team_registrations_date ON team_registrations(registration_date);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initDatabase
};