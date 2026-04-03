// Event Detail Card - Shows medication info for calendar events
import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  InputBase,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Note as NoteIcon,
  Medication as MedicationIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import type { CalendarEvent, Note } from '../types';
import { useReminder } from '../contexts/ReminderContext';
import { useMedication } from '../contexts/MedicationContext';
import { noteService } from '../services/oscDatabase';
import moment from 'moment';

const ITEM_H = 30;
const MIN_STEP = 5;

interface EventDetailCardProps {
  event: CalendarEvent;
  onClose: () => void;
  showTakenSection?: boolean;
}

const EventDetailCard: React.FC<EventDetailCardProps> = ({
  event,
  onClose,
  showTakenSection = false,
}) => {
  const { updateReminder, reminders, buildCalendarEvents, logReminderResponse } = useReminder();
  const { medications } = useMedication();

  const initialTime = moment(event.start).format('HH:mm');
  const [newTime, setNewTime] = useState(initialTime);
  const [noteContent, setNoteContent] = useState('');
  const [existingNotes, setExistingNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Time picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputText, setInputText] = useState(initialTime);
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const medication = medications.find((m) => m.id === event.resource.medication_id);

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

  // Scroll columns to selected values when dropdown opens
  useEffect(() => {
    if (pickerOpen) {
      const t = setTimeout(() => {
        const [h, m] = newTime.split(':').map(Number);
        if (hourListRef.current) hourListRef.current.scrollTop = h * ITEM_H;
        if (minuteListRef.current) minuteListRef.current.scrollTop = Math.floor(m / MIN_STEP) * ITEM_H;
      }, 40);
      return () => clearTimeout(t);
    }
  }, [pickerOpen]);

  // ── Time picker helpers ──
  const commitTime = (value: string) => {
    setNewTime(value);
    setInputText(value);
    setInputWarning(null);
  };

  const handleInputChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
    setInputText(formatted);

    let warning: string | null = null;
    if (digits.length >= 2) {
      const h = parseInt(digits.slice(0, 2), 10);
      if (h > 23) warning = 'Hour must be between 00 and 23';
    }
    if (!warning && digits.length === 4) {
      const m = parseInt(digits.slice(2, 4), 10);
      if (m > 59) {
        warning = 'Minute must be between 00 and 59';
      } else {
        setNewTime(`${digits.slice(0, 2)}:${digits.slice(2, 4)}`);
      }
    }
    setInputWarning(warning);
  };

  const handleInputBlur = () => {
    setInputText(newTime);
    setInputWarning(null);
  };

  const handlePickerHour = (h: number) => {
    const [, m] = newTime.split(':');
    commitTime(`${h.toString().padStart(2, '0')}:${m}`);
  };

  const handlePickerMinute = (m: number) => {
    const [h] = newTime.split(':');
    commitTime(`${h}:${m.toString().padStart(2, '0')}`);
  };

  const scrollHour = (dir: number) =>
    hourListRef.current?.scrollBy({ top: dir * ITEM_H, behavior: 'smooth' });

  const scrollMinute = (dir: number) =>
    minuteListRef.current?.scrollBy({ top: dir * ITEM_H, behavior: 'smooth' });

  const [curHour, curMinute] = newTime.split(':').map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / MIN_STEP) }, (_, i) => i * MIN_STEP);

  const arrowRowSx = (dir: 'up' | 'down') => ({
    display: 'flex',
    justifyContent: 'center',
    py: 0.25,
    cursor: 'pointer',
    color: '#9ca3af',
    borderTop: dir === 'down' ? '1px solid #f3f4f6' : undefined,
    borderBottom: dir === 'up' ? '1px solid #f3f4f6' : undefined,
    '&:hover': { color: '#10b981', backgroundColor: '#f0fdf9' },
  });

  const itemSx = (selected: boolean) => ({
    height: ITEM_H,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '0.875rem',
    fontWeight: selected ? 700 : 400,
    color: selected ? '#059669' : '#374151',
    backgroundColor: selected ? 'rgba(16,185,129,0.09)' : 'transparent',
    borderLeft: `3px solid ${selected ? '#10b981' : 'transparent'}`,
    transition: 'background 0.12s',
    '&:hover': { backgroundColor: selected ? 'rgba(16,185,129,0.15)' : '#f9fafb' },
  });

  // ── Backend handlers ──
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

  const handleMedicationResponse = async (taken: boolean) => {
    setSubmittingResponse(true);
    setError(null);
    try {
      await logReminderResponse(event.resource.reminder_id, event.resource.medication_id, taken);
      setSuccess(taken ? 'Marked as taken!' : 'Marked as missed');
      setTimeout(() => { onClose(); }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log response');
      setSubmittingResponse(false);
    }
  };

  const [changingChoice, setChangingChoice] = useState(false);

  const alreadyResponded = event.resource.status === 'taken' || event.resource.status === 'missed';

  const getHeaderGradient = () => {
    if (event.resource.status === 'taken') return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (event.resource.status === 'missed') return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

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
    animation: 'modalSpringIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1299,
          animation: 'backdropFadeIn 0.2s ease both',
        }}
      />

      {/* Card */}
      <Card sx={cardStyle}>
        {/* Header */}
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
                width: 40, height: 40, borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', transform: 'scale(1.1)' },
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <CardContent sx={{ pt: 2.5, pb: 2 }}>
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

          {/* Have you taken your medicine? */}
          {showTakenSection && (
            <>
              {alreadyResponded && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setChangingChoice((prev) => !prev)}
                    sx={{
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      borderColor: 'rgba(99,102,241,0.4)',
                      color: '#6366f1',
                      '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.05)' },
                    }}
                  >
                    {changingChoice ? 'Cancel' : 'Change Choice'}
                  </Button>
                </Box>
              )}
              <Box
                sx={{
                  textAlign: 'center', py: 2.5, px: 2,
                  bgcolor: alreadyResponded && !changingChoice
                    ? event.resource.status === 'taken' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
                    : 'rgba(99,102,241,0.05)',
                  borderRadius: 3, mb: 2.5,
                  border: '1px solid',
                  borderColor: alreadyResponded && !changingChoice
                    ? event.resource.status === 'taken' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                    : 'rgba(99,102,241,0.1)',
                }}
              >
                {alreadyResponded && !changingChoice ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    {event.resource.status === 'taken' ? (
                      <>
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
                        <Typography variant="body1" sx={{ color: '#059669', fontWeight: 600 }}>Medication Taken</Typography>
                      </>
                    ) : (
                      <>
                        <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                        <Typography variant="body1" sx={{ color: '#dc2626', fontWeight: 600 }}>Medication Missed</Typography>
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
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
                          '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(16,185,129,0.45)' },
                          '&:active': { transform: 'scale(0.95)' },
                        }}
                      >Yes</Button>
                      <Button
                        variant="contained"
                        startIcon={submittingResponse ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                        onClick={() => handleMedicationResponse(false)}
                        disabled={submittingResponse}
                        sx={{
                          minWidth: 110,
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
                          '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(239,68,68,0.45)' },
                          '&:active': { transform: 'scale(0.95)' },
                        }}
                      >No</Button>
                    </Box>
                  </>
                )}
              </Box>
              <Divider sx={{ mb: 2.5 }} />
            </>
          )}

          {/* Medication Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Dosage Form</Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, mt: 0.5 }}>
                {medication?.dosage_form || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Scheduled Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {moment(event.start).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Reminder Time / Custom Picker ── */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: inputWarning ? 0.5 : 1.5 }}>
              <ScheduleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>Reminder Time</Typography>
            </Box>

            {inputWarning && (
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#ef4444', fontWeight: 500 }}>
                ⚠ {inputWarning}
              </Typography>
            )}

            <Box sx={{ position: 'relative' }}>
              {/* Click-outside backdrop */}
              {pickerOpen && (
                <Box sx={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setPickerOpen(false)} />
              )}

              {/* Input bar + Update button */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 0.75 }}>
                <Paper
                  elevation={0}
                  onClick={() => !pickerOpen && setPickerOpen(true)}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    gap: 1,
                    border: '1.5px solid',
                    borderColor: pickerOpen ? '#10b981' : '#d1d5db',
                    borderRadius: '999px',
                    position: 'relative',
                    zIndex: 11,
                    cursor: 'text',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: pickerOpen ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
                    '&:hover': { borderColor: '#10b981' },
                  }}
                >
                  <AccessTimeIcon sx={{ color: '#9ca3af', fontSize: 17, flexShrink: 0 }} />
                  <InputBase
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    placeholder="--:-- (24-hour)"
                    inputProps={{ 'aria-label': 'time input', inputMode: 'numeric' }}
                    sx={{
                      flex: 1,
                      '& input': {
                        py: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.04em',
                        caretColor: '#10b981',
                      },
                    }}
                  />
                  <Box
                    onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o); }}
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#9ca3af', '&:hover': { color: '#10b981' }, flexShrink: 0 }}
                  >
                    <ExpandMoreIcon sx={{ fontSize: 20, transition: 'transform 0.22s', transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </Box>
                </Paper>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleTimeChange}
                  disabled={saving || newTime === initialTime}
                  sx={{
                    minWidth: 90, py: 1,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' },
                    '&:active': { transform: 'scale(0.95)' },
                  }}
                >
                  {saving ? <CircularProgress size={20} /> : 'Update'}
                </Button>
              </Box>

              {/* Helper hint */}
              <Typography variant="caption" sx={{ display: 'block', ml: 2, color: '#9ca3af', userSelect: 'none' }}>
                Type directly, or click ▾ to scroll-pick
              </Typography>

              {/* Dropdown panel */}
              {pickerOpen && (
                <Paper
                  elevation={6}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    top: 'calc(100% - 12px)',
                    left: 0,
                    width: 168,
                    zIndex: 20,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1.5px solid #e5e7eb',
                    mt: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex' }}>
                    {/* Hour column */}
                    <Box sx={{ flex: 1, borderRight: '1px solid #f3f4f6' }}>
                      <Typography align="center" sx={{ py: 0.9, fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        HR
                      </Typography>
                      <Box sx={arrowRowSx('up')} onClick={() => scrollHour(-1)}>
                        <ArrowUpIcon fontSize="small" />
                      </Box>
                      <Box ref={hourListRef} sx={{ height: 120, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 4 }, '&::-webkit-scrollbar-track': { background: 'transparent' } }}>
                        {hours.map((h) => (
                          <Box key={h} sx={itemSx(h === curHour)} onClick={() => handlePickerHour(h)}>
                            {h.toString().padStart(2, '0')}
                          </Box>
                        ))}
                      </Box>
                      <Box sx={arrowRowSx('down')} onClick={() => scrollHour(1)}>
                        <ArrowDownIcon fontSize="small" />
                      </Box>
                    </Box>

                    {/* Minute column */}
                    <Box sx={{ flex: 1 }}>
                      <Typography align="center" sx={{ py: 0.9, fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        MIN
                      </Typography>
                      <Box sx={arrowRowSx('up')} onClick={() => scrollMinute(-1)}>
                        <ArrowUpIcon fontSize="small" />
                      </Box>
                      <Box ref={minuteListRef} sx={{ height: 120, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 4 }, '&::-webkit-scrollbar-track': { background: 'transparent' } }}>
                        {minutes.map((m) => {
                          const snapped = Math.floor(curMinute / MIN_STEP) * MIN_STEP;
                          return (
                            <Box key={m} sx={itemSx(m === snapped)} onClick={() => handlePickerMinute(m)}>
                              {m.toString().padStart(2, '0')}
                            </Box>
                          );
                        })}
                      </Box>
                      <Box sx={arrowRowSx('down')} onClick={() => scrollMinute(1)}>
                        <ArrowDownIcon fontSize="small" />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Notes Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <NoteIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>Notes</Typography>
            </Box>

            {existingNotes.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 120, overflow: 'auto' }}>
                {existingNotes.map((note) => (
                  <Box
                    key={note.id}
                    sx={{ p: 1.5, mb: 1, bgcolor: 'rgba(245,158,11,0.08)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.15)' }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{note.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moment(note.created_at).format('MMM D, YYYY h:mm A')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

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
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
              '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(245,158,11,0.4)' },
              '&:active': { transform: 'scale(0.98)' },
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
