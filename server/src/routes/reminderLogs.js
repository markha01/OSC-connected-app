// Reminder Logs API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all reminder log routes
router.use(authenticateToken);

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all reminder logs for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { reminder_id, start, end } = req.query;

    let sql = `
      SELECT rl.* FROM reminder_logs rl
      JOIN medications m ON rl.medication_id = m.id
      WHERE m.user_id = ?
    `;
    const params = [req.userId];

    if (reminder_id) {
      sql += ' AND rl.reminder_id = ?';
      params.push(reminder_id);
    }

    if (start && end) {
      sql += ' AND rl.scheduled_time BETWEEN ? AND ?';
      params.push(start, end);
    }

    sql += ' ORDER BY rl.scheduled_time DESC';

    const logs = await query(sql, params);

    // Convert tinyint to boolean for 'taken' field
    const parsedLogs = logs.map(log => ({
      ...log,
      taken: Boolean(log.taken)
    }));

    res.json(parsedLogs);
  } catch (err) {
    console.error('Error fetching reminder logs:', err);
    res.status(500).json({ error: 'Failed to fetch reminder logs' });
  }
});

// Get a single reminder log by ID (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await query(
      `SELECT rl.* FROM reminder_logs rl
       JOIN medications m ON rl.medication_id = m.id
       WHERE rl.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    const log = {
      ...logs[0],
      taken: Boolean(logs[0].taken)
    };

    res.json(log);
  } catch (err) {
    console.error('Error fetching reminder log:', err);
    res.status(500).json({ error: 'Failed to fetch reminder log' });
  }
});

// Create a new reminder log (only for user's own medications)
router.post('/', async (req, res) => {
  try {
    const { reminder_id, medication_id, scheduled_time, taken } = req.body;

    if (!reminder_id || !medication_id || !scheduled_time || taken === undefined) {
      return res.status(400).json({
        error: 'reminder_id, medication_id, scheduled_time, and taken are required'
      });
    }

    // Verify user owns the medication
    const medication = await query(
      'SELECT id FROM medications WHERE id = ? AND user_id = ?',
      [medication_id, req.userId]
    );

    if (medication.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const id = uuidv4();
    const now = formatDateForDB();
    const scheduledTimeForDB = formatDateForDB(new Date(scheduled_time));

    await query(
      'INSERT INTO reminder_logs (id, reminder_id, medication_id, scheduled_time, taken, logged_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, reminder_id, medication_id, scheduledTimeForDB, taken ? 1 : 0, now]
    );

    const newLog = await query(
      'SELECT * FROM reminder_logs WHERE id = ?',
      [id]
    );

    const log = {
      ...newLog[0],
      taken: Boolean(newLog[0].taken)
    };

    res.status(201).json(log);
  } catch (err) {
    console.error('Error creating reminder log:', err);
    res.status(500).json({ error: 'Failed to create reminder log' });
  }
});

// Update a reminder log (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { taken } = req.body;

    if (taken === undefined) {
      return res.status(400).json({ error: 'taken field is required' });
    }

    // Verify ownership
    const existing = await query(
      `SELECT rl.id FROM reminder_logs rl
       JOIN medications m ON rl.medication_id = m.id
       WHERE rl.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    const now = formatDateForDB();

    await query(
      'UPDATE reminder_logs SET taken = ?, logged_at = ? WHERE id = ?',
      [taken ? 1 : 0, now, id]
    );

    const updatedLog = await query(
      'SELECT * FROM reminder_logs WHERE id = ?',
      [id]
    );

    const log = {
      ...updatedLog[0],
      taken: Boolean(updatedLog[0].taken)
    };

    res.json(log);
  } catch (err) {
    console.error('Error updating reminder log:', err);
    res.status(500).json({ error: 'Failed to update reminder log' });
  }
});

// Delete a reminder log (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await query(
      `SELECT rl.id FROM reminder_logs rl
       JOIN medications m ON rl.medication_id = m.id
       WHERE rl.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    await query('DELETE FROM reminder_logs WHERE id = ?', [id]);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting reminder log:', err);
    res.status(500).json({ error: 'Failed to delete reminder log' });
  }
});

export default router;
