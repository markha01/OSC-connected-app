// Reminder Notification Dialog Component
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { CheckCircle as TakenIcon, Cancel as MissedIcon } from '@mui/icons-material';
import { useReminder } from '../contexts/ReminderContext';

const ReminderNotification: React.FC = () => {
  const { activeReminderDialog, closeReminderDialog, logReminderResponse } = useReminder();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const handleResponse = async (taken: boolean) => {
    if (!activeReminderDialog.reminder || !activeReminderDialog.medication) return;

    setSubmitting(true);
    setError('');

    try {
      await logReminderResponse(
        activeReminderDialog.reminder.id,
        activeReminderDialog.medication.id,
        taken
      );
      closeReminderDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log response');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeReminderDialog.open || !activeReminderDialog.medication) {
    return null;
  }

  return (
    <Dialog
      open={activeReminderDialog.open}
      onClose={closeReminderDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Medication Reminder</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h5" gutterBottom>
            {activeReminderDialog.medication.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Time: {activeReminderDialog.reminder?.time}
          </Typography>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Have you taken your medicine?
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<TakenIcon />}
          onClick={() => handleResponse(true)}
          disabled={submitting}
          sx={{ minWidth: 120 }}
        >
          Yes
        </Button>
        <Button
          variant="contained"
          color="error"
          size="large"
          startIcon={<MissedIcon />}
          onClick={() => handleResponse(false)}
          disabled={submitting}
          sx={{ minWidth: 120 }}
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReminderNotification;
