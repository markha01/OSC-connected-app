// Express Server for Medication Management App
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import medicationsRouter from './routes/medications.js';
import remindersRouter from './routes/reminders.js';
import reminderLogsRouter from './routes/reminderLogs.js';
import notesRouter from './routes/notes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Vite dev server (alternate port)
  'http://localhost:4173',  // Vite preview server
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/medications', medicationsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/reminder-logs', reminderLogsRouter);
app.use('/api/notes', notesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check at http://localhost:${PORT}/health`);
      console.log(`\nAvailable endpoints:`);
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
