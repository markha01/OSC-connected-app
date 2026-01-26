// Medication Context - State management for medications
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Medication, MedicationFormData } from '../types';
import { medicationService } from '../services/oscDatabase';

interface MedicationContextType {
  medications: Medication[];
  loading: boolean;
  error: string | null;
  selectedMedication: Medication | null;
  fetchMedications: () => Promise<void>;
  getMedicationById: (id: string) => Promise<Medication | null>;
  createMedication: (data: MedicationFormData) => Promise<Medication | null>;
  updateMedication: (id: string, data: Partial<MedicationFormData>) => Promise<Medication | null>;
  deleteMedication: (id: string) => Promise<boolean>;
  setSelectedMedication: (medication: Medication | null) => void;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider: React.FC<MedicationProviderProps> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  // Fetch all medications
  const fetchMedications = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await medicationService.getAll();
      setMedications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medications');
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get medication by ID
  const getMedicationById = async (id: string): Promise<Medication | null> => {
    setLoading(true);
    setError(null);
    try {
      const medication = await medicationService.getById(id);
      setSelectedMedication(medication);
      return medication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medication');
      console.error('Error fetching medication:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new medication
  const createMedication = async (data: MedicationFormData): Promise<Medication | null> => {
    setLoading(true);
    setError(null);
    try {
      const newMedication = await medicationService.create(data);
      setMedications((prev) => [...prev, newMedication]);
      return newMedication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create medication');
      console.error('Error creating medication:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update medication
  const updateMedication = async (
    id: string,
    data: Partial<MedicationFormData>
  ): Promise<Medication | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedMedication = await medicationService.update(id, data);
      setMedications((prev) =>
        prev.map((med) => (med.id === id ? updatedMedication : med))
      );
      if (selectedMedication?.id === id) {
        setSelectedMedication(updatedMedication);
      }
      return updatedMedication;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medication');
      console.error('Error updating medication:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete medication
  const deleteMedication = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await medicationService.delete(id);
      setMedications((prev) => prev.filter((med) => med.id !== id));
      if (selectedMedication?.id === id) {
        setSelectedMedication(null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medication');
      console.error('Error deleting medication:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load medications on mount
  useEffect(() => {
    fetchMedications();
  }, []);

  const value: MedicationContextType = {
    medications,
    loading,
    error,
    selectedMedication,
    fetchMedications,
    getMedicationById,
    createMedication,
    updateMedication,
    deleteMedication,
    setSelectedMedication,
  };

  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
};

// Custom hook to use medication context
export const useMedication = (): MedicationContextType => {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};

export default MedicationContext;
