// Reminder Notification Dialog Component
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as TakenIcon,
  Cancel as MissedIcon,
  Medication as MedicationIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
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
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          px: 3,
          py: 3,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={closeReminderDialog}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.05)', opacity: 0.9 },
              },
            }}
          >
            <MedicationIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            Medication Reminder
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 4, pb: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {activeReminderDialog.medication.name}
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              mb: 4,
            }}
          >
            <TimeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {activeReminderDialog.reminder?.time}
            </Typography>
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#1e293b',
              mb: 1,
            }}
          >
            Have you taken your medicine?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Let us know so we can track your progress
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 4, pt: 2, gap: 2, px: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={
            submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <TakenIcon />
            )
          }
          onClick={() => handleResponse(true)}
          disabled={submitting}
          sx={{
            minWidth: 140,
            py: 1.5,
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
            },
          }}
        >
          Yes
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={
            submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <MissedIcon />
            )
          }
          onClick={() => handleResponse(false)}
          disabled={submitting}
          sx={{
            minWidth: 140,
            py: 1.5,
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)',
            },
          }}
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReminderNotification;
