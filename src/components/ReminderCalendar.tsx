// Reminder Calendar Component
import { useMemo, useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { useReminder } from '../contexts/ReminderContext';
import type { CalendarEvent } from '../types';
import EventDetailCard from './EventDetailCard';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const ReminderCalendar = () => {
  const { calendarEvents } = useReminder();

  // Controlled state for calendar navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // State for EventDetailCard
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showTakenSection, setShowTakenSection] = useState(false);

  // Handle navigation (Back, Next, Today buttons)
  const handleNavigate = useCallback((newDate: Date, _view: View, _action: NavigateAction) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change (Month, Week, Day buttons)
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Check if a date is today or in the past
  const isTodayOrPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate <= today;
  };

  // Custom event style based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad'; // Default blue (pending)

    if (event.resource.status === 'taken') {
      backgroundColor = '#4caf50'; // Green
    } else if (event.resource.status === 'missed') {
      backgroundColor = '#f44336'; // Red
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // Show "taken" section only for today or past events
    setShowTakenSection(isTodayOrPast(event.start));
  };

  // Close event detail card
  const handleCloseEventDetail = () => {
    setSelectedEvent(null);
    setShowTakenSection(false);
  };

  // Custom components
  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEvent }) => (
        <Box sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
          <div>{event.title}</div>
          <div style={{ fontSize: '0.75rem' }}>
            {moment(event.start).format('h:mm A')}
          </div>
        </Box>
      ),
    }),
    []
  );

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Medication Calendar
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label="Pending"
              sx={{ backgroundColor: '#3174ad', color: 'white' }}
              size="small"
            />
            <Chip
              label="Taken"
              sx={{ backgroundColor: '#4caf50', color: 'white' }}
              size="small"
            />
            <Chip
              label="Missed"
              sx={{ backgroundColor: '#f44336', color: 'white' }}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ height: 600 }}>
          <Calendar<CalendarEvent>
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            components={components}
            views={['month', 'week', 'day']}
            view={currentView}
            date={currentDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            popup
          />
        </Box>
      </Paper>

      {/* Event Detail Card */}
      {selectedEvent && (
        <EventDetailCard
          event={selectedEvent}
          onClose={handleCloseEventDetail}
          showTakenSection={showTakenSection}
        />
      )}
    </>
  );
};

export default ReminderCalendar;
