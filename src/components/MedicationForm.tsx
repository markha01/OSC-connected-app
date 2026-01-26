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
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Medication as MedicationIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MedicationIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {editMedication ? 'Edit Medication' : 'Add New Medication'}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Medication Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              fullWidth
              required
              autoFocus
              placeholder="e.g., Aspirin, Ibuprofen"
              helperText="Enter the name of your medication"
            />

            <TextField
              select
              label="Dosage Form"
              value={formData.dosage_form}
              onChange={(e) => handleChange('dosage_form', e.target.value as DosageForm)}
              fullWidth
              required
              helperText="Select how you take this medication"
            >
              {DOSAGE_FORMS.map((form) => (
                <MenuItem key={form} value={form}>
                  {form.charAt(0).toUpperCase() + form.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              px: 3,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : editMedication ? (
                <SaveIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{ px: 3 }}
          >
            {submitting ? 'Saving...' : editMedication ? 'Update' : 'Add Medication'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MedicationForm;
