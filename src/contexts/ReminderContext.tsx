// Reminder Context - State management for reminders and reminder logs
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Reminder, ReminderLog, ReminderFormData, CalendarEvent } from '../types';
import { reminderService, reminderLogService } from '../services/oscDatabase';
import { useMedication } from './MedicationContext';

interface ReminderContextType {
  reminders: Reminder[];
  reminderLogs: ReminderLog[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  activeReminderDialog: {
    open: boolean;
    reminder: Reminder | null;
    medication: { id: string; name: string } | null;
  };
  fetchReminders: () => Promise<void>;
  getRemindersByMedicationId: (medicationId: string) => Promise<Reminder[]>;
  createReminder: (data: ReminderFormData) => Promise<Reminder | null>;
  updateReminder: (id: string, data: Partial<ReminderFormData>) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<boolean>;
  fetchReminderLogs: (startDate?: string, endDate?: string) => Promise<void>;
  logReminderResponse: (
    reminderId: string,
    medicationId: string,
    taken: boolean
  ) => Promise<void>;
  openReminderDialog: (reminder: Reminder, medicationName: string) => void;
  closeReminderDialog: () => void;
  buildCalendarEvents: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

interface ReminderProviderProps {
  children: ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReminderDialog, setActiveReminderDialog] = useState<{
    open: boolean;
    reminder: Reminder | null;
    medication: { id: string; name: string } | null;
  }>({ open: false, reminder: null, medication: null });

  const { medications } = useMedication();

  // Fetch all reminders
  const fetchReminders = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await reminderService.getAll();
      setReminders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get reminders by medication ID
  const getRemindersByMedicationId = async (medicationId: string): Promise<Reminder[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await reminderService.getByMedicationId(medicationId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
      console.error('Error fetching reminders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create new reminder
  const createReminder = async (data: ReminderFormData): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);
    try {
      const newReminder = await reminderService.create(data);
      setReminders((prev) => [...prev, newReminder]);
      return newReminder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
      console.error('Error creating reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update reminder
  const updateReminder = async (
    id: string,
    data: Partial<ReminderFormData>
  ): Promise<Reminder | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedReminder = await reminderService.update(id, data);
      setReminders((prev) => prev.map((rem) => (rem.id === id ? updatedReminder : rem)));
      return updatedReminder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
      console.error('Error updating reminder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete reminder
  const deleteReminder = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await reminderService.delete(id);
      setReminders((prev) => prev.filter((rem) => rem.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
      console.error('Error deleting reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch reminder logs
  const fetchReminderLogs = async (
    startDate?: string,
    endDate?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = startDate && endDate
        ? await reminderLogService.getByDateRange(startDate, endDate)
        : await reminderLogService.getAll();
      setReminderLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminder logs');
      console.error('Error fetching reminder logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Log reminder response (taken or not taken)
  const logReminderResponse = async (
    reminderId: string,
    medicationId: string,
    taken: boolean
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const log = await reminderLogService.create({
        reminder_id: reminderId,
        medication_id: medicationId,
        scheduled_time: new Date().toISOString(),
        taken,
      });
      setReminderLogs((prev) => [...prev, log]);
      await fetchReminderLogs(); // Refresh logs
      buildCalendarEvents(); // Rebuild calendar events
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log reminder response');
      console.error('Error logging reminder response:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open reminder dialog
  const openReminderDialog = (reminder: Reminder, medicationName: string): void => {
    setActiveReminderDialog({
      open: true,
      reminder,
      medication: { id: reminder.medication_id, name: medicationName },
    });
  };

  // Close reminder dialog
  const closeReminderDialog = (): void => {
    setActiveReminderDialog({ open: false, reminder: null, medication: null });
  };

  // Build calendar events from reminders and logs
  const buildCalendarEvents = (): void => {
    const events: CalendarEvent[] = [];
    const today = new Date();
    const daysToShow = 30; // Show 30 days of events

    reminders.forEach((reminder) => {
      const medication = medications.find((m) => m.id === reminder.medication_id);
      if (!medication) return;

      // Generate events for the next 30 days
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

        // Check if reminder is scheduled for this day
        if (reminder.days.includes(dayName as any)) {
          const [hours, minutes] = reminder.time.split(':').map(Number);
          const eventStart = new Date(date);
          eventStart.setHours(hours, minutes, 0, 0);
          const eventEnd = new Date(eventStart);
          eventEnd.setMinutes(eventEnd.getMinutes() + 15); // 15-minute event

          // Check if there's a log for this specific time
          const log = reminderLogs.find(
            (l) =>
              l.reminder_id === reminder.id &&
              new Date(l.scheduled_time).toDateString() === date.toDateString()
          );

          const status = log ? (log.taken ? 'taken' : 'missed') : 'pending';

          events.push({
            id: `${reminder.id}-${date.toISOString()}`,
            title: medication.name,
            start: eventStart,
            end: eventEnd,
            resource: {
              reminder_id: reminder.id,
              medication_id: medication.id,
              medication_name: medication.name,
              taken: log?.taken,
              status,
            },
          });
        }
      }
    });

    setCalendarEvents(events);
  };

  // Load reminders and logs on mount
  useEffect(() => {
    fetchReminders();
    fetchReminderLogs();
  }, []);

  // Rebuild calendar events when reminders, logs, or medications change
  useEffect(() => {
    if (reminders.length > 0 && medications.length > 0) {
      buildCalendarEvents();
    }
  }, [reminders, reminderLogs, medications]);

  // Set up notification listener
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { reminderId, medicationName } = customEvent.detail;
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        openReminderDialog(reminder, medicationName);
      }
    };

    window.addEventListener('notification-clicked', handleNotificationClick);
    return () => window.removeEventListener('notification-clicked', handleNotificationClick);
  }, [reminders]);

  const value: ReminderContextType = {
    reminders,
    reminderLogs,
    calendarEvents,
    loading,
    error,
    activeReminderDialog,
    fetchReminders,
    getRemindersByMedicationId,
    createReminder,
    updateReminder,
    deleteReminder,
    fetchReminderLogs,
    logReminderResponse,
    openReminderDialog,
    closeReminderDialog,
    buildCalendarEvents,
  };

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
};

// Custom hook to use reminder context
export const useReminder = (): ReminderContextType => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminder must be used within a ReminderProvider');
  }
  return context;
};

export default ReminderContext;
