// Reminder Form Component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import type { DayOfWeek, ReminderFormData, Reminder } from '../types';
import { useReminder } from '../contexts/ReminderContext';

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ReminderFormProps {
  open: boolean;
  onClose: () => void;
  medicationId: string;
  editReminder?: Reminder | null;
}

const ReminderForm: React.FC<ReminderFormProps> = ({
  open,
  onClose,
  medicationId,
  editReminder,
}) => {
  const { createReminder, updateReminder } = useReminder();
  const [formData, setFormData] = useState<ReminderFormData>({
    medication_id: medicationId,
    time: '09:00',
    days: [],
  });
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing or when medicationId changes
  useEffect(() => {
    if (editReminder) {
      setFormData({
        medication_id: editReminder.medication_id,
        time: editReminder.time,
        days: editReminder.days,
      });
    } else {
      setFormData({
        medication_id: medicationId,
        time: '09:00',
        days: [],
      });
    }
    setError('');
  }, [editReminder, medicationId, open]);

  const handleTimeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, time: value }));
    setError('');
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev) => {
      const days = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.days.length === 0) {
      setError('Please select at least one day');
      return;
    }

    setSubmitting(true);

    try {
      if (editReminder) {
        // Update existing reminder
        await updateReminder(editReminder.id, formData);
      } else {
        // Create new reminder
        await createReminder(formData);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      medication_id: medicationId,
      time: '09:00',
      days: [],
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editReminder ? 'Edit Reminder' : 'Add New Reminder'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Time"
              type="time"
              value={formData.time}
              onChange={(e) => handleTimeChange(e.target.value)}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 300, // 5 min intervals
              }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Repeat on days *
              </Typography>
              <FormGroup row>
                {DAYS_OF_WEEK.map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                    }
                    label={day}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : editReminder ? 'Update' : 'Add Reminder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReminderForm;
