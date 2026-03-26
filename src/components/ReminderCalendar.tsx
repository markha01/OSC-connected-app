// Reminder Calendar Component
import { useMemo, useState, useCallback, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
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

  // Ref for animation restart trick
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  // Restart CSS animation on the calendar wrapper
  const triggerCalendarAnimation = useCallback(() => {
    const el = calendarWrapperRef.current;
    if (!el) return;
    el.classList.remove('calendar-transition');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('calendar-transition');
  }, []);

  // Handle navigation (Back, Next, Today buttons)
  const handleNavigate = useCallback((newDate: Date, _view: View, _action: NavigateAction) => {
    setCurrentDate(newDate);
    triggerCalendarAnimation();
  }, [triggerCalendarAnimation]);

  // Handle view change (Month, Week, Day buttons)
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
    triggerCalendarAnimation();
  }, [triggerCalendarAnimation]);

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
    let background = 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'; // Default purple (pending)
    let boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';

    if (event.resource.status === 'taken') {
      background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'; // Green
      boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
    } else if (event.resource.status === 'missed') {
      background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'; // Red
      boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    }

    return {
      style: {
        background,
        borderRadius: '8px',
        color: 'white',
        border: 'none',
        display: 'block',
        boxShadow,
        padding: '2px 6px',
        fontSize: '0.8rem',
        fontWeight: 500,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', py: '1px' }}>
          {/* Status dot */}
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.8)',
              flexShrink: 0,
              mt: '1px',
            }}
          />
          <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </div>
            <div style={{ fontSize: '0.70rem', opacity: 0.85, letterSpacing: '0.01em' }}>
              {moment(event.start).format('h:mm A')}
            </div>
          </Box>
        </Box>
      ),
    }),
    []
  );

  return (
    <>
      <Paper
        className="calendar-entrance"
        sx={{
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.08)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.55)',
                },
                '@keyframes avatarFloat': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-3px)' },
                },
                animation: 'avatarFloat 3.5s ease-in-out infinite',
              }}
            >
              <CalendarIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your medication schedule
              </Typography>
            </Box>
          </Box>

          {/* Legend */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Chip
              label="Pending"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: 'white',
                fontWeight: 500,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' },
              }}
            />
            <Chip
              label="Taken"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: 'white',
                fontWeight: 500,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' },
              }}
            />
            <Chip
              label="Missed"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                color: 'white',
                fontWeight: 500,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' },
              }}
            />
          </Box>
        </Box>

        {/* Calendar Container */}
        <Box
          sx={{
            height: { xs: 450, sm: 550, md: 600 },
            '& .rbc-calendar': {
              fontFamily: 'inherit',
            },
          }}
        >
          <div ref={calendarWrapperRef} className="calendar-transition" style={{ height: '100%' }}>
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
          </div>
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
