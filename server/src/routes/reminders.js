// Reminders API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all reminder routes
router.use(authenticateToken);

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper to safely parse days field (handles both JSON and comma-separated strings)
const parseDays = (days) => {
  if (!days) return [];
  if (Array.isArray(days)) return days;

  try {
    const parsed = JSON.parse(days);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // If JSON parse fails, treat as comma-separated string
    return days.split(',').map(d => d.trim()).filter(Boolean);
  }
};

// Get all reminders for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { medication_id } = req.query;

    let sql = `
      SELECT r.* FROM reminders r
      JOIN medications m ON r.medication_id = m.id
      WHERE m.user_id = ?
    `;
    const params = [req.userId];

    if (medication_id) {
      sql += ' AND r.medication_id = ?';
      params.push(medication_id);
    }

    sql += ' ORDER BY r.created_at DESC';

    const reminders = await query(sql, params);

    // Parse JSON days field
    const parsedReminders = reminders.map(reminder => ({
      ...reminder,
      days: parseDays(reminder.days)
    }));

    res.json(parsedReminders);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Get a single reminder by ID (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reminders = await query(
      `SELECT r.* FROM reminders r
       JOIN medications m ON r.medication_id = m.id
       WHERE r.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (reminders.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminder = {
      ...reminders[0],
      days: parseDays(reminders[0].days)
    };

    res.json(reminder);
  } catch (err) {
    console.error('Error fetching reminder:', err);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

// Create a new reminder (only for user's own medications)
router.post('/', async (req, res) => {
  try {
    const { medication_id, time, days } = req.body;

    if (!medication_id || !time || !days || !Array.isArray(days)) {
      return res.status(400).json({
        error: 'medication_id, time, and days (array) are required'
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

    await query(
      'INSERT INTO reminders (id, medication_id, time, days, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, medication_id, time, JSON.stringify(days), 'pending', now]
    );

    const newReminder = await query(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );

    const reminder = {
      ...newReminder[0],
      days: parseDays(newReminder[0].days)
    };

    res.status(201).json(reminder);
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update a reminder (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { medication_id, time, days, status } = req.body;

    // Verify ownership
    const existing = await query(
      `SELECT r.id FROM reminders r
       JOIN medications m ON r.medication_id = m.id
       WHERE r.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updates = [];
    const values = [];

    if (medication_id !== undefined) {
      // Verify new medication is also owned by user
      const med = await query(
        'SELECT id FROM medications WHERE id = ? AND user_id = ?',
        [medication_id, req.userId]
      );
      if (med.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      updates.push('medication_id = ?');
      values.push(medication_id);
    }
    if (time !== undefined) {
      updates.push('time = ?');
      values.push(time);
    }
    if (days !== undefined) {
      updates.push('days = ?');
      values.push(JSON.stringify(days));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(
      `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedReminder = await query(
      'SELECT * FROM reminders WHERE id = ?',
      [id]
    );

    const reminder = {
      ...updatedReminder[0],
      days: parseDays(updatedReminder[0].days)
    };

    res.json(reminder);
  } catch (err) {
    console.error('Error updating reminder:', err);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete a reminder (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await query(
      `SELECT r.id FROM reminders r
       JOIN medications m ON r.medication_id = m.id
       WHERE r.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await query('DELETE FROM reminders WHERE id = ?', [id]);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
