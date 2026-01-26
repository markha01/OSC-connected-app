// Reminder Form Component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  Typography,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  Alarm as AlarmIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            <AlarmIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {editReminder ? 'Edit Reminder' : 'Add New Reminder'}
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

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Reminder Time
              </Typography>
              <TextField
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
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    py: 1.5,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Repeat on days
              </Typography>
              <ToggleButtonGroup
                value={formData.days}
                onChange={(_e, newDays) => {
                  if (newDays !== null) {
                    setFormData((prev) => ({ ...prev, days: newDays }));
                    setError('');
                  }
                }}
                aria-label="days of week"
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: '2px solid #e2e8f0 !important',
                    borderRadius: '12px !important',
                    margin: 0,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderColor: '#10b981 !important',
                      color: '#059669',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                    },
                  },
                }}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <ToggleButton
                    key={day}
                    value={day}
                    aria-label={day}
                    sx={{
                      px: 2.5,
                      py: 1,
                      minWidth: { xs: 'calc(25% - 8px)', sm: 'auto' },
                    }}
                  >
                    {day}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Select the days you want to be reminded
              </Typography>
            </Box>
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
              ) : editReminder ? (
                <SaveIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              px: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            {submitting ? 'Saving...' : editReminder ? 'Update' : 'Add Reminder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReminderForm;
