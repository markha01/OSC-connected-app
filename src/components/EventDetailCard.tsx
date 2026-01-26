// Event Detail Card - Shows medication info for calendar events
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  IconButton,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Note as NoteIcon,
  Medication as MedicationIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { CalendarEvent, Note } from '../types';
import { useReminder } from '../contexts/ReminderContext';
import { useMedication } from '../contexts/MedicationContext';
import { noteService } from '../services/oscDatabase';
import moment from 'moment';

interface EventDetailCardProps {
  event: CalendarEvent;
  onClose: () => void;
  showTakenSection?: boolean; // Show "Have you taken your medicine?" for past/present events
}

const EventDetailCard: React.FC<EventDetailCardProps> = ({
  event,
  onClose,
  showTakenSection = false,
}) => {
  const { updateReminder, reminders, buildCalendarEvents, logReminderResponse } = useReminder();
  const { medications } = useMedication();

  const [newTime, setNewTime] = useState(moment(event.start).format('HH:mm'));
  const [noteContent, setNoteContent] = useState('');
  const [existingNotes, setExistingNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get medication details
  const medication = medications.find((m) => m.id === event.resource.medication_id);

  // Load existing notes for this medication
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notes = await noteService.getByMedicationId(event.resource.medication_id);
        setExistingNotes(notes);
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };
    loadNotes();
  }, [event.resource.medication_id]);

  // Handle time change
  const handleTimeChange = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const reminder = reminders.find((r) => r.id === event.resource.reminder_id);
      if (reminder) {
        await updateReminder(reminder.id, { time: newTime });
        buildCalendarEvents();
        setSuccess('Time updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time');
    } finally {
      setSaving(false);
    }
  };

  // Handle note save
  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const newNote = await noteService.create({
        medication_id: event.resource.medication_id,
        content: noteContent.trim(),
      });
      setExistingNotes((prev) => [...prev, newNote]);
      setNoteContent('');
      setSuccess('Note saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Handle medication taken response
  const handleMedicationResponse = async (taken: boolean) => {
    setSubmittingResponse(true);
    setError(null);

    try {
      await logReminderResponse(
        event.resource.reminder_id,
        event.resource.medication_id,
        taken
      );
      setSuccess(taken ? 'Marked as taken!' : 'Marked as missed');
      // Close card after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log response');
      setSubmittingResponse(false);
    }
  };

  // Check if already responded (taken or missed)
  const alreadyResponded = event.resource.status === 'taken' || event.resource.status === 'missed';

  // Card style - centered on page
  const cardStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1300,
    width: 400,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    overflow: 'auto',
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1299,
        }}
      />

      {/* Card */}
      <Card sx={cardStyle} elevation={8}>
        {/* Header with close button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pb: 1,
            bgcolor: '#3174ad',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedicationIcon />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {event.resource.medication_name}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <CardContent sx={{ pt: 2 }}>
          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Have you taken your medicine? Section - Only for past/present events */}
          {showTakenSection && (
            <>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 2,
                  px: 1,
                  bgcolor: alreadyResponded
                    ? event.resource.status === 'taken'
                      ? 'success.50'
                      : 'error.50'
                    : 'grey.50',
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                {alreadyResponded ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {event.resource.status === 'taken' ? (
                      <>
                        <CheckCircleIcon color="success" />
                        <Typography variant="body1" color="success.main" fontWeight={600}>
                          Medication Taken
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CancelIcon color="error" />
                        <Typography variant="body1" color="error.main" fontWeight={600}>
                          Medication Missed
                        </Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Have you taken your medicine?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1.5 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={submittingResponse ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        onClick={() => handleMedicationResponse(true)}
                        disabled={submittingResponse}
                        sx={{ minWidth: 100 }}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={submittingResponse ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                        onClick={() => handleMedicationResponse(false)}
                        disabled={submittingResponse}
                        sx={{ minWidth: 100 }}
                      >
                        No
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {/* Medication Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Dosage Form
            </Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {medication?.dosage_form || 'N/A'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Scheduled Date
            </Typography>
            <Typography variant="body1">
              {moment(event.start).format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Change Time Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Reminder Time
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleTimeChange}
                disabled={saving || newTime === moment(event.start).format('HH:mm')}
                sx={{ minWidth: 80 }}
              >
                {saving ? <CircularProgress size={20} /> : 'Update'}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              This will update the reminder time for all scheduled days
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Notes Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NoteIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Notes
              </Typography>
            </Box>

            {/* Existing Notes */}
            {existingNotes.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 100, overflow: 'auto' }}>
                {existingNotes.map((note) => (
                  <Box
                    key={note.id}
                    sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    <Typography variant="body2">{note.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moment(note.created_at).format('MMM D, YYYY h:mm A')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Add New Note */}
            <TextField
              placeholder="Add a note about this medication..."
              multiline
              rows={2}
              fullWidth
              size="small"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              sx={{ mb: 1 }}
            />
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSaveNote}
            disabled={saving || !noteContent.trim()}
            fullWidth
          >
            Save Note
          </Button>
        </CardActions>
      </Card>
    </>
  );
};

export default EventDetailCard;
