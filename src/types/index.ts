// Type definitions for the Medication Management App

export type DosageForm =
  | 'capsules'
  | 'tablets'
  | 'oral liquid'
  | 'inhalers'
  | 'injections'
  | 'nasal spray'
  | 'cream'
  | 'ear drops'
  | 'eye drops'
  | 'lozenges';

export interface Medication {
  id: string;
  name: string;
  dosage_form: DosageForm;
  created_at: string;
  updated_at: string;
}

export type ReminderStatus = 'pending' | 'taken' | 'missed';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Reminder {
  id: string;
  medication_id: string;
  time: string; // Format: "HH:mm"
  days: DayOfWeek[];
  status: ReminderStatus;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  reminder_id: string;
  medication_id: string;
  scheduled_time: string; // ISO timestamp
  taken: boolean;
  logged_at: string; // ISO timestamp
}

export interface Note {
  id: string;
  medication_id: string;
  content: string;
  created_at: string;
}

// Calendar event type for React Big Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    reminder_id: string;
    medication_id: string;
    medication_name: string;
    taken?: boolean;
    status: 'pending' | 'taken' | 'missed';
  };
}

// Form types
export interface MedicationFormData {
  name: string;
  dosage_form: DosageForm;
}

export interface ReminderFormData {
  medication_id: string;
  time: string;
  days: DayOfWeek[];
}

export interface NoteFormData {
  medication_id: string;
  content: string;
}
