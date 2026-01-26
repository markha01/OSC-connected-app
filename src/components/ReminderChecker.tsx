// Reminder Checker - Background service to check and trigger reminders
import { useEffect, useRef } from 'react';
import { useReminder } from '../contexts/ReminderContext';
import { useMedication } from '../contexts/MedicationContext';
import { notificationService } from '../services/notificationService';
import type { Reminder, Medication } from '../types';

const ReminderChecker = (): null => {
  const { reminders, openReminderDialog } = useReminder();
  const { medications } = useMedication();
  const checkedRemindersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Check reminders every minute
    const checkInterval = setInterval(() => {
      checkReminders();
    }, 60000); // 60 seconds

    // Also check immediately on mount
    checkReminders();

    // Cleanup
    return () => clearInterval(checkInterval);
  }, [reminders, medications]);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentDateKey = now.toDateString();

    reminders.forEach((reminder: Reminder) => {
      // Check if this reminder should trigger now
      const shouldTrigger =
        reminder.time === currentTime &&
        reminder.days.includes(currentDay as any);

      if (shouldTrigger) {
        // Create unique key for this reminder instance (date + reminder ID)
        const reminderKey = `${currentDateKey}-${reminder.id}`;

        // Check if we've already triggered this reminder today
        if (!checkedRemindersRef.current.has(reminderKey)) {
          // Mark as checked
          checkedRemindersRef.current.add(reminderKey);

          // Find medication
          const medication = medications.find((m: Medication) => m.id === reminder.medication_id);

          if (medication) {
            // Show notification
            notificationService.showNotification({
              medicationName: medication.name,
              time: reminder.time,
              reminderId: reminder.id,
              medicationId: medication.id,
            });

            // Open dialog
            openReminderDialog(reminder, medication.name);
          }
        }
      }
    });

    // Clean up old checked reminders (older than 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cleanupKeys = Array.from(checkedRemindersRef.current).filter((key) => {
      const [dateStr] = key.split('-');
      const reminderDate = new Date(dateStr);
      return reminderDate < twoDaysAgo;
    });
    cleanupKeys.forEach((key) => checkedRemindersRef.current.delete(key));
  };

  // This component doesn't render anything
  return null;
};

export default ReminderChecker;
