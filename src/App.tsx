// Main App Component
import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';
import { MedicationProvider } from './contexts/MedicationContext';
import { ReminderProvider } from './contexts/ReminderContext';
import Layout from './components/Layout';
import MedicationList from './components/MedicationList';
import MedicationDetail from './components/MedicationDetail';
import ReminderCalendar from './components/ReminderCalendar';
import ReminderNotification from './components/ReminderNotification';
import ReminderChecker from './components/ReminderChecker';
import type { Medication } from './types';
import { notificationService } from './services/notificationService';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.95rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Request notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      const granted = await notificationService.requestPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
    };
    requestPermission();
  }, []);

  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
    setSelectedMedication(null); // Clear selection when changing tabs
  };

  const handleSelectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
  };

  const handleBackToList = () => {
    setSelectedMedication(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MedicationProvider>
        <ReminderProvider>
          <Layout currentTab={currentTab} onTabChange={handleTabChange}>
            {/* Notification permission snackbar 
            <Snackbar
              open={notificationPermission === 'denied'}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert severity="warning" sx={{ width: '100%' }}>
                Browser notifications are disabled. Please enable them to receive medication reminders.
              </Alert>
            </Snackbar>*/}

            {/* Tab 0: Medications */}
            {currentTab === 0 && (
              <Box>
                {selectedMedication ? (
                  <MedicationDetail
                    medication={selectedMedication}
                    onBack={handleBackToList}
                  />
                ) : (
                  <MedicationList onSelectMedication={handleSelectMedication} />
                )}
              </Box>
            )}

            {/* Tab 1: Calendar */}
            {currentTab === 1 && (
              <Box>
                <ReminderCalendar />
              </Box>
            )}

            {/* Reminder Notification Dialog */}
            <ReminderNotification />

            {/* Background Reminder Checker */}
            <ReminderChecker />
          </Layout>
        </ReminderProvider>
      </MedicationProvider>
    </ThemeProvider>
  );
}

export default App;
