// Reminder Form Component
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Typography,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  InputBase,
} from '@mui/material';
import {
  Close as CloseIcon,
  Alarm as AlarmIcon,
  Add as AddIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import type { DayOfWeek, ReminderFormData, Reminder } from '../types';
import { useReminder } from '../contexts/ReminderContext';

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ITEM_H = 30;
const MIN_STEP = 5;

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputText, setInputText] = useState('09:00');
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editReminder) {
      setFormData({
        medication_id: editReminder.medication_id,
        time: editReminder.time,
        days: editReminder.days,
      });
      setInputText(editReminder.time);
    } else {
      setFormData({
        medication_id: medicationId,
        time: '09:00',
        days: [],
      });
      setInputText('09:00');
    }
    setError('');
    setInputWarning(null);
    setPickerOpen(false);
  }, [editReminder, medicationId, open]);

  // Scroll columns to selected values when dropdown opens
  useEffect(() => {
    if (pickerOpen) {
      const t = setTimeout(() => {
        const [h, m] = formData.time.split(':').map(Number);
        if (hourListRef.current) {
          hourListRef.current.scrollTop = h * ITEM_H;
        }
        if (minuteListRef.current) {
          minuteListRef.current.scrollTop = Math.floor(m / MIN_STEP) * ITEM_H;
        }
      }, 40);
      return () => clearTimeout(t);
    }
  }, [pickerOpen]);

  const commitTime = (value: string) => {
    setFormData((prev) => ({ ...prev, time: value }));
    setInputText(value);
    setInputWarning(null);
    setError('');
  };

  const handleInputChange = (rawValue: string) => {
    // Strip non-digits, cap at 4
    const digits = rawValue.replace(/\D/g, '').slice(0, 4);
    // Show colon only once we have 3+ digits so backspace feels natural
    const formatted = digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
    setInputText(formatted);

    let warning: string | null = null;

    // Validate hour as soon as 2 digits are present
    if (digits.length >= 2) {
      const h = parseInt(digits.slice(0, 2), 10);
      if (h > 23) {
        warning = 'Hour must be between 00 and 23';
      }
    }

    // Validate minute once all 4 digits are present
    if (!warning && digits.length === 4) {
      const m = parseInt(digits.slice(2, 4), 10);
      if (m > 59) {
        warning = 'Minute must be between 00 and 59';
      } else {
        // Fully valid — commit
        setFormData((prev) => ({ ...prev, time: `${digits.slice(0, 2)}:${digits.slice(2, 4)}` }));
        setError('');
      }
    }

    setInputWarning(warning);
  };

  const handleInputBlur = () => {
    // Snap back to last valid time if what was typed is incomplete/invalid
    setInputText(formData.time);
    setInputWarning(null);
  };

  const handlePickerHour = (h: number) => {
    const [, m] = formData.time.split(':');
    commitTime(`${h.toString().padStart(2, '0')}:${m}`);
  };

  const handlePickerMinute = (m: number) => {
    const [h] = formData.time.split(':');
    commitTime(`${h}:${m.toString().padStart(2, '0')}`);
  };

  const scrollHour = (dir: number) =>
    hourListRef.current?.scrollBy({ top: dir * ITEM_H, behavior: 'smooth' });

  const scrollMinute = (dir: number) =>
    minuteListRef.current?.scrollBy({ top: dir * ITEM_H, behavior: 'smooth' });

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.days.length === 0) {
      setError('Please select at least one day');
      return;
    }
    setSubmitting(true);
    try {
      if (editReminder) {
        await updateReminder(editReminder.id, formData);
      } else {
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
    setFormData({ medication_id: medicationId, time: '09:00', days: [] });
    setInputText('09:00');
    setError('');
    setInputWarning(null);
    setPickerOpen(false);
    onClose();
  };

  const [curHour, curMinute] = formData.time.split(':').map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.ceil(60 / MIN_STEP) }, (_, i) => i * MIN_STEP);

  // Shared styles for the up/down arrow rows
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

  // Shared styles for each number row in the scroll list
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
    '&:hover': {
      backgroundColor: selected ? 'rgba(16,185,129,0.15)' : '#f9fafb',
    },
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
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
              backgroundColor: 'rgba(255,255,255,0.2)',
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
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
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

            {/* ── Time Picker ── */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: inputWarning ? 0.5 : 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Reminder Time
              </Typography>

              {inputWarning && (
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#ef4444', fontWeight: 500 }}>
                  ⚠ {inputWarning}
                </Typography>
              )}

              <Box sx={{ position: 'relative' }}>
                {/* Click-outside backdrop */}
                {pickerOpen && (
                  <Box
                    sx={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setPickerOpen(false)}
                  />
                )}

                {/* ── Input bar ── */}
                <Paper
                  elevation={0}
                  onClick={() => !pickerOpen && setPickerOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
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
                  <AccessTimeIcon sx={{ color: '#9ca3af', fontSize: 19, flexShrink: 0 }} />

                  <InputBase
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    placeholder="--:-- (24-hour)"
                    inputProps={{ 'aria-label': 'time input', inputMode: 'numeric' }}
                    sx={{
                      flex: 1,
                      '& input': {
                        py: 1.4,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.04em',
                        caretColor: '#10b981',
                        cursor: 'text',
                      },
                    }}
                  />

                  {/* Chevron toggle */}
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickerOpen((o) => !o);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      '&:hover': { color: '#10b981' },
                      flexShrink: 0,
                    }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        fontSize: 22,
                        transition: 'transform 0.22s',
                        transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </Box>
                </Paper>

                {/* Helper hint */}
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 0.75, ml: 2, color: '#9ca3af', userSelect: 'none' }}
                >
                  Type directly, or click ▾ to scroll-pick
                </Typography>

                {/* ── Dropdown panel ── */}
                {pickerOpen && (
                  <Paper
                    elevation={6}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: 'calc(100% - 18px)',
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

                      {/* ── Hour column ── */}
                      <Box sx={{ flex: 1, borderRight: '1px solid #f3f4f6' }}>
                        <Typography
                          align="center"
                          sx={{
                            py: 0.9,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#6b7280',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            backgroundColor: '#f9fafb',
                            borderBottom: '1px solid #f3f4f6',
                          }}
                        >
                          HR
                        </Typography>

                        <Box sx={arrowRowSx('up')} onClick={() => scrollHour(-1)}>
                          <ArrowUpIcon fontSize="small" />
                        </Box>

                        <Box
                          ref={hourListRef}
                          sx={{
                            height: 120,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 4 },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                          }}
                        >
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

                      {/* ── Minute column ── */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          align="center"
                          sx={{
                            py: 0.9,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#6b7280',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            backgroundColor: '#f9fafb',
                            borderBottom: '1px solid #f3f4f6',
                          }}
                        >
                          MIN
                        </Typography>

                        <Box sx={arrowRowSx('up')} onClick={() => scrollMinute(-1)}>
                          <ArrowUpIcon fontSize="small" />
                        </Box>

                        <Box
                          ref={minuteListRef}
                          sx={{
                            height: 120,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 4 },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                          }}
                        >
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

            {/* ── Days of week ── */}
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
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      borderColor: '#10b981 !important',
                      color: '#059669',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: 'rgba(16,185,129,0.2)' },
                    },
                    '&:hover': { backgroundColor: '#f8fafc' },
                  },
                }}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <ToggleButton
                    key={day}
                    value={day}
                    aria-label={day}
                    sx={{ px: 2.5, py: 1, minWidth: { xs: 'calc(25% - 8px)', sm: 'auto' } }}
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
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
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
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
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
