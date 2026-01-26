// Notes API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const router = express.Router();

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all notes
router.get('/', async (req, res) => {
  try {
    const { medication_id } = req.query;

    let sql = 'SELECT * FROM notes';
    const params = [];

    if (medication_id) {
      sql += ' WHERE medication_id = ?';
      params.push(medication_id);
    }

    sql += ' ORDER BY created_at DESC';

    const notes = await query(sql, params);
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single note by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await query(
      'SELECT * FROM notes WHERE id = ?',
      [id]
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

// Create a new note
router.post('/', async (req, res) => {
  try {
    const { medication_id, content } = req.body;

    if (!medication_id || !content) {
      return res.status(400).json({
        error: 'medication_id and content are required'
      });
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

// Update a note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
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

    if (updatedNote.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updatedNote[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notes WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
