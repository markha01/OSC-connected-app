// Layout Component
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LocalHospital as MedicineIcon,
  Medication as MedicationTabIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: number;
  onTabChange: (newValue: number) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange }) => {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          borderBottom: 'none',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MedicineIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                MedTracker
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.85,
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Your health companion
              </Typography>
            </Box>
          </Box>
        </Toolbar>
        <Box sx={{ px: 2, pb: 1 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            textColor="inherit"
            TabIndicatorProps={{
              sx: {
                backgroundColor: '#fff',
                height: 3,
                borderRadius: '3px 3px 0 0',
              }
            }}
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                borderRadius: '12px 12px 0 0',
                mx: 0.5,
                px: 3,
                transition: 'all 0.2s',
                opacity: 0.8,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  opacity: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
          >
            <Tab
              icon={<MedicationTabIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Medications"
            />
            <Tab
              icon={<CalendarIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Calendar"
            />
          </Tabs>
        </Box>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 0,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: { xs: 3, sm: 4 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2.5,
          px: 2,
          mt: 'auto',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: '#94a3b8',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <MedicineIcon sx={{ fontSize: 18, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              MedTracker
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              - Stay on track with your medications
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
