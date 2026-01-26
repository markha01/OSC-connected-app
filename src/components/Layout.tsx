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
import { LocalHospital as MedicineIcon } from '@mui/icons-material';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: '120vh' }}>
      <AppBar position="static">
        <Toolbar>
          <MedicineIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Medication Manager
          </Typography>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ backgroundColor: 'primary.dark' }}
        >
          <Tab label="Medications" />
          <Tab label="Calendar" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Medication Manager - Track your medications and stay healthy
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
