// OSC Database Service - MCP Server Integration
import type { Medication, Reminder, ReminderLog, Note, MedicationFormData, ReminderFormData, NoteFormData } from '../types';

// Base URL for API - uses relative path when served from same server
const OSC_API_BASE = import.meta.env.VITE_OSC_API_URL || '/api';

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${OSC_API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Handle 204 No Content responses (e.g., DELETE requests)
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// ============================================================================
// Medication CRUD Operations
// ============================================================================

export const medicationService = {
  // Get all medications
  async getAll(): Promise<Medication[]> {
    return fetchAPI<Medication[]>('/medications');
  },

  // Get a single medication by ID
  async getById(id: string): Promise<Medication> {
    return fetchAPI<Medication>(`/medications/${id}`);
  },

  // Create a new medication
  async create(data: MedicationFormData): Promise<Medication> {
    return fetchAPI<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  },

  // Update an existing medication
  async update(id: string, data: Partial<MedicationFormData>): Promise<Medication> {
    return fetchAPI<Medication>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        updated_at: new Date().toISOString(),
      }),
    });
  },

  // Delete a medication
  async delete(id: string): Promise<void> {
    await fetchAPI(`/medications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Reminder CRUD Operations
// ============================================================================

export const reminderService = {
  // Get all reminders
  async getAll(): Promise<Reminder[]> {
    return fetchAPI<Reminder[]>('/reminders');
  },

  // Get reminders for a specific medication
  async getByMedicationId(medicationId: string): Promise<Reminder[]> {
    return fetchAPI<Reminder[]>(`/reminders?medication_id=${medicationId}`);
  },

  // Get a single reminder by ID
  async getById(id: string): Promise<Reminder> {
    return fetchAPI<Reminder>(`/reminders/${id}`);
  },

  // Create a new reminder
  async create(data: ReminderFormData): Promise<Reminder> {
    return fetchAPI<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
      }),
    });
  },

  // Update an existing reminder
  async update(id: string, data: Partial<ReminderFormData>): Promise<Reminder> {
    return fetchAPI<Reminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a reminder
  async delete(id: string): Promise<void> {
    await fetchAPI(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Reminder Log CRUD Operations
// ============================================================================

export const reminderLogService = {
  // Get all reminder logs
  async getAll(): Promise<ReminderLog[]> {
    return fetchAPI<ReminderLog[]>('/reminder-logs');
  },

  // Get logs for a specific date range
  async getByDateRange(startDate: string, endDate: string): Promise<ReminderLog[]> {
    return fetchAPI<ReminderLog[]>(`/reminder-logs?start=${startDate}&end=${endDate}`);
  },

  // Get logs for a specific reminder
  async getByReminderId(reminderId: string): Promise<ReminderLog[]> {
    return fetchAPI<ReminderLog[]>(`/reminder-logs?reminder_id=${reminderId}`);
  },

  // Create a new reminder log (when user confirms taking/missing medicine)
  async create(data: {
    reminder_id: string;
    medication_id: string;
    scheduled_time: string;
    taken: boolean;
  }): Promise<ReminderLog> {
    return fetchAPI<ReminderLog>('/reminder-logs', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        logged_at: new Date().toISOString(),
      }),
    });
  },

  // Update a reminder log
  async update(id: string, taken: boolean): Promise<ReminderLog> {
    return fetchAPI<ReminderLog>(`/reminder-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        taken,
        logged_at: new Date().toISOString(),
      }),
    });
  },

  // Delete a reminder log
  async delete(id: string): Promise<void> {
    await fetchAPI(`/reminder-logs/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Note CRUD Operations
// ============================================================================

export const noteService = {
  // Get all notes
  async getAll(): Promise<Note[]> {
    return fetchAPI<Note[]>('/notes');
  },

  // Get notes for a specific medication
  async getByMedicationId(medicationId: string): Promise<Note[]> {
    return fetchAPI<Note[]>(`/notes?medication_id=${medicationId}`);
  },

  // Get a single note by ID
  async getById(id: string): Promise<Note> {
    return fetchAPI<Note>(`/notes/${id}`);
  },

  // Create a new note
  async create(data: NoteFormData): Promise<Note> {
    return fetchAPI<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_at: new Date().toISOString(),
      }),
    });
  },

  // Update an existing note
  async update(id: string, content: string): Promise<Note> {
    return fetchAPI<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        content,
        created_at: new Date().toISOString(), // Update timestamp on edit
      }),
    });
  },

  // Delete a note
  async delete(id: string): Promise<void> {
    await fetchAPI(`/notes/${id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  medications: medicationService,
  reminders: reminderService,
  reminderLogs: reminderLogService,
  notes: noteService,
};
