// Medication Form Component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import type { DosageForm, MedicationFormData, Medication } from '../types';
import { useMedication } from '../contexts/MedicationContext';

const DOSAGE_FORMS: DosageForm[] = [
  'capsules',
  'tablets',
  'oral liquid',
  'inhalers',
  'injections',
  'nasal spray',
  'cream',
  'ear drops',
  'eye drops',
  'lozenges',
];

interface MedicationFormProps {
  open: boolean;
  onClose: () => void;
  editMedication?: Medication | null;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ open, onClose, editMedication }) => {
  const { createMedication, updateMedication } = useMedication();
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    dosage_form: 'tablets',
  });
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editMedication) {
      setFormData({
        name: editMedication.name,
        dosage_form: editMedication.dosage_form,
      });
    } else {
      setFormData({ name: '', dosage_form: 'tablets' });
    }
    setError('');
  }, [editMedication, open]);

  const handleChange = (field: keyof MedicationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Medication name is required');
      return;
    }

    setSubmitting(true);

    try {
      if (editMedication) {
        // Update existing medication
        await updateMedication(editMedication.id, formData);
      } else {
        // Create new medication
        await createMedication(formData);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', dosage_form: 'tablets' });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMedication ? 'Edit Medication' : 'Add New Medication'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Medication Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              required
              autoFocus
              placeholder="e.g., Aspirin"
            />

            <TextField
              select
              label="Dosage Form"
              value={formData.dosage_form}
              onChange={(e) => handleChange('dosage_form', e.target.value as DosageForm)}
              fullWidth
              required
            >
              {DOSAGE_FORMS.map((form) => (
                <MenuItem key={form} value={form}>
                  {form.charAt(0).toUpperCase() + form.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : editMedication ? 'Update' : 'Add Medication'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MedicationForm;
