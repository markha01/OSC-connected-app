// Date utility functions using date-fns
import { format, parseISO, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';

export const dateUtils = {
  // Format a date to a readable string
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  },

  // Format a date with time
  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy hh:mm a');
  },

  // Format time only
  formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'hh:mm a');
  },

  // Format time in 24-hour format (HH:mm)
  formatTime24(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  },

  // Get start of day
  getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
  },

  // Get end of day
  getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(dateObj);
  },

  // Add days to a date
  addDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
  },

  // Check if two dates are the same day
  isSameDay(date1: Date | string, date2: Date | string): boolean {
    const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
    const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(date1Obj, date2Obj);
  },

  // Parse time string (HH:mm) to today's date with that time
  parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  },

  // Get current time in HH:mm format
  getCurrentTime(): string {
    return format(new Date(), 'HH:mm');
  },

  // Get day of week from date
  getDayOfWeek(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'EEE'); // Returns 'Mon', 'Tue', etc.
  },

  // Convert day abbreviation to full name
  getDayFullName(dayAbbr: string): string {
    const dayMap: Record<string, string> = {
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    };
    return dayMap[dayAbbr] || dayAbbr;
  },

  // Get relative time description
  getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return this.formatDate(dateObj);
  },
};

export default dateUtils;
