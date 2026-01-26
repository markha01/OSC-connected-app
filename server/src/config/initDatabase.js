// Database Initialization Script
// Run this to create all required tables in MariaDB
import { getConnection } from './database.js';

const createTablesSQL = `
-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dosage_form ENUM(
    'capsules', 'tablets', 'oral liquid', 'inhalers',
    'injections', 'nasal spray', 'cream', 'ear drops',
    'eye drops', 'lozenges'
  ) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id VARCHAR(36) PRIMARY KEY,
  medication_id VARCHAR(36) NOT NULL,
  time VARCHAR(5) NOT NULL COMMENT 'Format: HH:mm',
  days JSON NOT NULL COMMENT 'Array of day abbreviations: Mon, Tue, etc.',
  status ENUM('pending', 'taken', 'missed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  INDEX idx_medication_id (medication_id),
  INDEX idx_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reminder Logs Table
CREATE TABLE IF NOT EXISTS reminder_logs (
  id VARCHAR(36) PRIMARY KEY,
  reminder_id VARCHAR(36) NOT NULL,
  medication_id VARCHAR(36) NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  taken BOOLEAN NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  INDEX idx_reminder_id (reminder_id),
  INDEX idx_medication_id (medication_id),
  INDEX idx_scheduled_time (scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(36) PRIMARY KEY,
  medication_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  INDEX idx_medication_id (medication_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function initializeDatabase() {
  let conn;
  try {
    console.log('🔄 Initializing database tables...');
    conn = await getConnection();

    // Split and execute each CREATE TABLE statement
    const statements = createTablesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await conn.query(statement);
    }

    console.log('✅ Database tables created successfully!');
    console.log('\nTables created:');
    console.log('  - medications');
    console.log('  - reminders');
    console.log('  - reminder_logs');
    console.log('  - notes');

    // Show table structure
    const tables = await conn.query('SHOW TABLES');
    console.log('\n📋 Current tables in database:');
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });

  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

initializeDatabase();
