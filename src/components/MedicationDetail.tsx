// Medication Detail Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Alarm as AlarmIcon,
  Note as NoteIcon,
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ flex: 1 }}>
          {medication.name}
        </Typography>
        <Button
          startIcon={<EditIcon />}
          variant="outlined"
          onClick={() => setEditFormOpen(true)}
        >
          Edit
        </Button>
      </Box>

      {medicationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {medicationError}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Medication Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Dosage Form
            </Typography>
            <Chip
              label={medication.dosage_form}
              color="primary"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Added
            </Typography>
            <Typography variant="body1">
              {dateUtils.formatDate(medication.created_at)}
            </Typography>
          </Box>
          {medication.updated_at !== medication.created_at && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {dateUtils.formatDate(medication.updated_at)}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <AlarmIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Reminders
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setReminderFormOpen(true)}
          >
            Add Reminder
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {medicationReminders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No reminders set for this medication
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {medicationReminders.map((reminder) => (
              <Box
                key={reminder.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {reminder.time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reminder.days.join(', ')}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteReminder(reminder.id)}
                  aria-label="Delete reminder"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <NoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Notes
        </Typography>
        <Divider sx={{ mb: 2 }} />
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
