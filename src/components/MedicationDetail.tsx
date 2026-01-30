// Medication Detail Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Alert,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Alarm as AlarmIcon,
  Note as NoteIcon,
  Medication as MedicationIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Medication, Reminder } from '../types';
import { useMedication } from '../contexts/MedicationContext';
import { useReminder } from '../contexts/ReminderContext';
import MedicationForm from './MedicationForm';
import ReminderForm from './ReminderForm';
import NotesSection from './NotesSection';
import { dateUtils } from '../utils/dateUtils';

interface MedicationDetailProps {
  medication: Medication;
  onBack: () => void;
}

const MedicationDetail: React.FC<MedicationDetailProps> = ({ medication, onBack }) => {
  const { error: medicationError } = useMedication();
  const { getRemindersByMedicationId, deleteReminder } = useReminder();
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [medicationReminders, setMedicationReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    loadReminders();
  }, [medication.id]);

  const loadReminders = async () => {
    const reminders = await getRemindersByMedicationId(medication.id);
    setMedicationReminders(reminders);
  };

  const handleReminderFormClose = () => {
    setReminderFormOpen(false);
    loadReminders(); // Refresh reminders after adding/editing
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      const success = await deleteReminder(reminderId);
      if (success) {
        loadReminders();
      }
    }
  };

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Tooltip title="Back to list">
          <IconButton
            onClick={onBack}
            sx={{
              backgroundColor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                backgroundColor: 'background.paper',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            }}
          >
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <MedicationIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              {medication.name}
            </Typography>
            <Chip
              label={medication.dosage_form}
              size="small"
              sx={{
                mt: 1,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                color: '#6366f1',
                fontWeight: 500,
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            />
          </Box>
        </Box>
        <Button
          startIcon={<EditIcon />}
          variant="outlined"
          onClick={() => setEditFormOpen(true)}
          sx={{
            borderWidth: 2,
            px: 3,
            '&:hover': { borderWidth: 2 },
          }}
        >
          Edit
        </Button>
      </Box>

      {medicationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {medicationError}
        </Alert>
      )}

      {/* Info Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        {/* Medication Information */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MedicationIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Medication Info
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Added
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {dateUtils.formatDate(medication.created_at)}
                </Typography>
              </Box>
            </Box>
            {medication.updated_at !== medication.created_at && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {dateUtils.formatDate(medication.updated_at)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Reminders Section */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlarmIcon sx={{ fontSize: 20, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Reminders
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setReminderFormOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Add
            </Button>
          </Box>
          {medicationReminders.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
                borderRadius: 2,
                border: '2px dashed #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <AlarmIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No reminders set yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {medicationReminders.map((reminder) => (
                <Box
                  key={reminder.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ScheduleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {reminder.time}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reminder.days.join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Delete reminder">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Notes Section - Full Width */}
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NoteIcon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notes
          </Typography>
        </Box>
        <NotesSection medicationId={medication.id} />
      </Paper>

      <MedicationForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        editMedication={medication}
      />

      <ReminderForm
        open={reminderFormOpen}
        onClose={handleReminderFormClose}
        medicationId={medication.id}
      />
    </Box>
  );
};

export default MedicationDetail;
