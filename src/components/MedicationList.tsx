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
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocalHospital as MedicineIcon,
  Medication as MedicationIcon,
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            My Medications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {medications.length} medication{medications.length !== 1 ? 's' : ''} tracked
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{
            px: 3,
            py: 1.5,
            fontSize: '0.95rem',
          }}
        >
          Add Medication
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {medications.length === 0 && !loading ? (
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '2px dashed #e2e8f0',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <MedicineIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              No medications yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 300, mx: 'auto' }}>
              Start tracking your medications to stay on top of your health routine
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              size="large"
            >
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {medications.map((medication, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={medication.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)',
                    '& .medication-icon': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
                <CardContent
                  onClick={() => onSelectMedication(medication)}
                  sx={{ flexGrow: 1, p: 3 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      className="medication-icon"
                      sx={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <MedicationIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {medication.name}
                      </Typography>
                      <Chip
                        label={medication.dosage_form}
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                          color: '#6366f1',
                          fontWeight: 500,
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    px: 2,
                    pb: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 1.5,
                    mt: 'auto',
                  }}
                >
                  <Tooltip title="Edit medication">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(medication);
                      }}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete medication">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(medication.id);
                      }}
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
