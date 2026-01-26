// Reminder Logs API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const router = express.Router();

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all reminder logs
router.get('/', async (req, res) => {
  try {
    const { reminder_id, start, end } = req.query;

    let sql = 'SELECT * FROM reminder_logs WHERE 1=1';
    const params = [];

    if (reminder_id) {
      sql += ' AND reminder_id = ?';
      params.push(reminder_id);
    }

    if (start && end) {
      sql += ' AND scheduled_time BETWEEN ? AND ?';
      params.push(start, end);
    }

    sql += ' ORDER BY scheduled_time DESC';

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

// Get a single reminder log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await query(
      'SELECT * FROM reminder_logs WHERE id = ?',
      [id]
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

// Create a new reminder log
router.post('/', async (req, res) => {
  try {
    const { reminder_id, medication_id, scheduled_time, taken } = req.body;

    if (!reminder_id || !medication_id || !scheduled_time || taken === undefined) {
      return res.status(400).json({
        error: 'reminder_id, medication_id, scheduled_time, and taken are required'
      });
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

// Update a reminder log
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { taken } = req.body;

    if (taken === undefined) {
      return res.status(400).json({ error: 'taken field is required' });
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

    if (updatedLog.length === 0) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

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

// Delete a reminder log
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM reminder_logs WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting reminder log:', err);
    res.status(500).json({ error: 'Failed to delete reminder log' });
  }
});

export default router;
