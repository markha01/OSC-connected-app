// Express Server for Medication Management App
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, getConnection } from './config/database.js';
import medicationsRouter from './routes/medications.js';
import remindersRouter from './routes/reminders.js';
import reminderLogsRouter from './routes/reminderLogs.js';
import notesRouter from './routes/notes.js';
import authRouter from './routes/auth.js';

dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../dist');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(distPath));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/reminder-logs', reminderLogsRouter);
app.use('/api/notes', notesRouter);

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database tables
async function initializeTables() {
  const createTablesSQL = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS medications (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      dosage_form ENUM('capsules', 'tablets', 'oral liquid', 'inhalers', 'injections', 'nasal spray', 'cream', 'ear drops', 'eye drops', 'lozenges') NOT NULL,
      total_quantity INT NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id VARCHAR(36) PRIMARY KEY,
      medication_id VARCHAR(36) NOT NULL,
      time VARCHAR(5) NOT NULL,
      days JSON NOT NULL,
      status ENUM('pending', 'taken', 'missed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS reminder_logs (
      id VARCHAR(36) PRIMARY KEY,
      reminder_id VARCHAR(36) NOT NULL,
      medication_id VARCHAR(36) NOT NULL,
      scheduled_time TIMESTAMP NOT NULL,
      taken BOOLEAN NOT NULL,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS notes (
      id VARCHAR(36) PRIMARY KEY,
      medication_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];

  let conn;
  try {
    conn = await getConnection();
    for (const sql of createTablesSQL) {
      await conn.query(sql);
    }

    // Migration: Add user_id to existing medications table if it doesn't exist
    try {
      const columns = await conn.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'user_id'"
      );
      if (columns.length === 0) {
        await conn.query('ALTER TABLE medications ADD COLUMN user_id VARCHAR(36) AFTER id');
        await conn.query('ALTER TABLE medications ADD INDEX idx_user_id (user_id)');
        console.log('✅ Migration: Added user_id column to medications table');
      }
    } catch (migrationErr) {
      // Column might already exist or table structure issue
      console.log('Migration check completed');
    }

    // Migration: Add total_quantity to existing medications table (IF NOT EXISTS is a no-op if already present)
    try {
      await conn.query('ALTER TABLE medications ADD COLUMN IF NOT EXISTS total_quantity INT NULL DEFAULT NULL');
      console.log('✅ Migration: total_quantity column ensured on medications table');
    } catch (migrationErr) {
      console.error('Migration error (total_quantity):', migrationErr.message);
    }

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('Error initializing tables:', err.message);
  } finally {
    if (conn) conn.release();
  }
}

// Start server
async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    // Initialize tables
    await initializeTables();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check at http://localhost:${PORT}/health`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/auth/me`);
      console.log(`  GET    /api/medications`);
      console.log(`  POST   /api/medications`);
      console.log(`  GET    /api/medications/:id`);
      console.log(`  PUT    /api/medications/:id`);
      console.log(`  DELETE /api/medications/:id`);
      console.log(`  GET    /api/reminders`);
      console.log(`  POST   /api/reminders`);
      console.log(`  GET    /api/reminders/:id`);
      console.log(`  PUT    /api/reminders/:id`);
      console.log(`  DELETE /api/reminders/:id`);
      console.log(`  GET    /api/reminder-logs`);
      console.log(`  POST   /api/reminder-logs`);
      console.log(`  PUT    /api/reminder-logs/:id`);
      console.log(`  DELETE /api/reminder-logs/:id`);
      console.log(`  GET    /api/notes`);
      console.log(`  POST   /api/notes`);
      console.log(`  GET    /api/notes/:id`);
      console.log(`  PUT    /api/notes/:id`);
      console.log(`  DELETE /api/notes/:id`);
      console.log(`\n✨ Ready to accept requests!\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
