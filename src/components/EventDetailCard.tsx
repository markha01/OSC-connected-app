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

  // Determine header color based on status
  const getHeaderGradient = () => {
    if (event.resource.status === 'taken') {
      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (event.resource.status === 'missed') {
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

  // Card style - centered on page
  const cardStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1300,
    width: 420,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 32px)',
    overflow: 'auto',
    borderRadius: 4,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
          bgcolor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1299,
        }}
      />

      {/* Card */}
      <Card sx={cardStyle}>
        {/* Header with close button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            background: getHeaderGradient(),
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              <MedicationIcon />
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {event.resource.medication_name}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <CardContent sx={{ pt: 2.5, pb: 2 }}>
          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Have you taken your medicine? Section - Only for past/present events */}
          {showTakenSection && (
            <>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 2.5,
                  px: 2,
                  bgcolor: alreadyResponded
                    ? event.resource.status === 'taken'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(99, 102, 241, 0.05)',
                  borderRadius: 3,
                  mb: 2.5,
                  border: '1px solid',
                  borderColor: alreadyResponded
                    ? event.resource.status === 'taken'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                }}
              >
                {alreadyResponded ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    {event.resource.status === 'taken' ? (
                      <>
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
                        <Typography variant="body1" sx={{ color: '#059669', fontWeight: 600 }}>
                          Medication Taken
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                        <Typography variant="body1" sx={{ color: '#dc2626', fontWeight: 600 }}>
                          Medication Missed
                        </Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: '#1e293b' }}>
                      Have you taken your medicine?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={submittingResponse ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        onClick={() => handleMedicationResponse(true)}
                        disabled={submittingResponse}
                        sx={{
                          minWidth: 110,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          },
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={submittingResponse ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                        onClick={() => handleMedicationResponse(false)}
                        disabled={submittingResponse}
                        sx={{
                          minWidth: 110,
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                          },
                        }}
                      >
                        No
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
              <Divider sx={{ mb: 2.5 }} />
            </>
          )}

          {/* Medication Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Dosage Form
              </Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, mt: 0.5 }}>
                {medication?.dosage_form || 'N/A'}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: '#f8fafc',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Scheduled Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {moment(event.start).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Change Time Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ScheduleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Reminder Time
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                sx={{ minWidth: 90, py: 1 }}
              >
                {saving ? <CircularProgress size={20} /> : 'Update'}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Updates reminder time for all scheduled days
            </Typography>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Notes Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <NoteIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Notes
              </Typography>
            </Box>

            {/* Existing Notes */}
            {existingNotes.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 120, overflow: 'auto' }}>
                {existingNotes.map((note) => (
                  <Box
                    key={note.id}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      bgcolor: 'rgba(245, 158, 11, 0.08)',
                      borderRadius: 2,
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{note.content}</Typography>
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
            />
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveNote}
            disabled={saving || !noteContent.trim()}
            fullWidth
            sx={{
              py: 1.25,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              },
            }}
          >
            Save Note
          </Button>
        </CardActions>
      </Card>
    </>
  );
};

export default EventDetailCard;
