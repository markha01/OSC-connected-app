// Reminder Checker - Background service to check and trigger reminders
import { useEffect, useRef } from 'react';
import { useReminder } from '../contexts/ReminderContext';
import { useMedication } from '../contexts/MedicationContext';
import { notificationService } from '../services/notificationService';
import type { Reminder, Medication } from '../types';

// Module-level set: lives outside the component so it is never reset by
// React Strict Mode's double-invoke, parent re-renders, or tab navigation.
const firedReminders = new Set<string>();

const ReminderChecker = (): null => {
  const { reminders, openReminderDialog } = useReminder();
  const { medications } = useMedication();

  // Keep refs in sync with the latest context values so the interval
  // (which only starts once) always reads fresh data without needing
  // to restart on every reminders/medications change.
  const remindersRef = useRef(reminders);
  const medicationsRef = useRef(medications);
  const openReminderDialogRef = useRef(openReminderDialog);

  useEffect(() => { remindersRef.current = reminders; }, [reminders]);
  useEffect(() => { medicationsRef.current = medications; }, [medications]);
  useEffect(() => { openReminderDialogRef.current = openReminderDialog; }, [openReminderDialog]);

  // Start the interval exactly once on mount.
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
      const todayKey = now.toDateString();

      // Purge entries from previous days to keep the set small
      for (const key of firedReminders) {
        if (!key.startsWith(todayKey)) {
          firedReminders.delete(key);
        }
      }

      remindersRef.current.forEach((reminder: Reminder) => {
        const shouldTrigger =
          reminder.time === currentTime &&
          reminder.days.includes(currentDay as any);

        if (!shouldTrigger) return;

        // Use '|' as separator so UUID hyphens in reminder.id never interfere
        const reminderKey = `${todayKey}|${reminder.id}`;

        if (firedReminders.has(reminderKey)) return; // already fired today

        firedReminders.add(reminderKey);

        const medication = medicationsRef.current.find(
          (m: Medication) => m.id === reminder.medication_id
        );

        if (medication) {
          notificationService.showNotification({
            medicationName: medication.name,
            time: reminder.time,
            reminderId: reminder.id,
            medicationId: medication.id,
          });

          openReminderDialogRef.current(reminder, medication.name);
        }
      });
    };

    checkReminders(); // immediate check on mount
    const checkInterval = setInterval(checkReminders, 60000);

    return () => clearInterval(checkInterval);
  }, []); // intentionally empty — refs keep the data current

  return null;
};

export default ReminderChecker;
