// Medication List Component
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Chip,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocalHospital as MedicineIcon,
} from '@mui/icons-material';
import { useMedication } from '../contexts/MedicationContext';
import type { Medication } from '../types';
import MedicationForm from './MedicationForm';

interface MedicationListProps {
  onSelectMedication: (medication: Medication) => void;
}

const MedicationList: React.FC<MedicationListProps> = ({ onSelectMedication }) => {
  const { medications, loading, error, deleteMedication } = useMedication();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      await deleteMedication(id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMedication(null);
  };

  if (loading && medications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          My Medications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add Medication
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {medications.length === 0 && !loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MedicineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No medications yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first medication to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
            >
              Add Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {medications.map((medication) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={medication.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent onClick={() => onSelectMedication(medication)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {medication.name}
                      </Typography>
                      <Chip
                        label={medication.dosage_form}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(medication);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(medication.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <MedicationForm
        open={formOpen}
        onClose={handleCloseForm}
        editMedication={editingMedication}
      />
    </Box>
  );
};

export default MedicationList;
