// Notes API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all notes routes
router.use(authenticateToken);

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all notes for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { medication_id } = req.query;

    let sql = `
      SELECT n.* FROM notes n
      JOIN medications m ON n.medication_id = m.id
      WHERE m.user_id = ?
    `;
    const params = [req.userId];

    if (medication_id) {
      sql += ' AND n.medication_id = ?';
      params.push(medication_id);
    }

    sql += ' ORDER BY n.created_at DESC';

    const notes = await query(sql, params);
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single note by ID (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await query(
      `SELECT n.* FROM notes n
       JOIN medications m ON n.medication_id = m.id
       WHERE n.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(notes[0]);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note (only for user's own medications)
router.post('/', async (req, res) => {
  try {
    const { medication_id, content } = req.body;

    if (!medication_id || !content) {
      return res.status(400).json({
        error: 'medication_id and content are required'
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
      'INSERT INTO notes (id, medication_id, content, created_at) VALUES (?, ?, ?, ?)',
      [id, medication_id, content, now]
    );

    const newNote = await query(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );

    res.status(201).json(newNote[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Verify ownership
    const existing = await query(
      `SELECT n.id FROM notes n
       JOIN medications m ON n.medication_id = m.id
       WHERE n.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const now = formatDateForDB();

    await query(
      'UPDATE notes SET content = ?, created_at = ? WHERE id = ?',
      [content, now, id]
    );

    const updatedNote = await query(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );

    res.json(updatedNote[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await query(
      `SELECT n.id FROM notes n
       JOIN medications m ON n.medication_id = m.id
       WHERE n.id = ? AND m.user_id = ?`,
      [id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await query('DELETE FROM notes WHERE id = ?', [id]);

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
