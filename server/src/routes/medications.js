// Medications API Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const router = express.Router();

// Helper to format date for MariaDB (YYYY-MM-DD HH:MM:SS)
const formatDateForDB = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all medications
router.get('/', async (req, res) => {
  try {
    const medications = await query(
      'SELECT * FROM medications ORDER BY created_at DESC'
    );
    res.json(medications);
  } catch (err) {
    console.error('Error fetching medications:', err);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// Get a single medication by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const medications = await query(
      'SELECT * FROM medications WHERE id = ?',
      [id]
    );

    if (medications.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json(medications[0]);
  } catch (err) {
    console.error('Error fetching medication:', err);
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
});

// Create a new medication
router.post('/', async (req, res) => {
  try {
    const { name, dosage_form } = req.body;

    if (!name || !dosage_form) {
      return res.status(400).json({ error: 'Name and dosage_form are required' });
    }

    const id = uuidv4();
    const now = formatDateForDB();

    await query(
      'INSERT INTO medications (id, name, dosage_form, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, dosage_form, now, now]
    );

    const newMedication = await query(
      'SELECT * FROM medications WHERE id = ?',
      [id]
    );

    res.status(201).json(newMedication[0]);
  } catch (err) {
    console.error('Error creating medication:', err);
    res.status(500).json({ error: 'Failed to create medication' });
  }
});

// Update a medication
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dosage_form } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (dosage_form !== undefined) {
      updates.push('dosage_form = ?');
      values.push(dosage_form);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(formatDateForDB());
    values.push(id);

    await query(
      `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedMedication = await query(
      'SELECT * FROM medications WHERE id = ?',
      [id]
    );

    if (updatedMedication.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json(updatedMedication[0]);
  } catch (err) {
    console.error('Error updating medication:', err);
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// Delete a medication
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM medications WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting medication:', err);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

export default router;
