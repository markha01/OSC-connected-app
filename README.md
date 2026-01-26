# Medication Management App

A comprehensive medication tracking application built with React, TypeScript, and Material-UI. This app helps users manage their medications, set reminders, track medication intake, and maintain notes about their medications.

## Features

### Medication Management
- Add, edit, and delete medications
- Support for 10 different dosage forms:
  - Capsules
  - Tablets
  - Oral liquid
  - Inhalers
  - Injections
  - Nasal spray
  - Cream
  - Ear drops
  - Eye drops
  - Lozenges

### Reminder System
- Create reminders for medications with specific times
- Set recurring reminders for specific days of the week
- Browser notifications when it's time to take medication
- Interactive dialog to confirm whether medication was taken

### Calendar View
- Visual calendar showing all medication reminders
- Color-coded events:
  - **Blue**: Pending (not yet taken)
  - **Green**: Taken (confirmed)
  - **Red**: Missed (not taken)
- Monthly, weekly, and daily views
- Click on events to log medication intake

### Notes System
- Add notes for each medication
- Track side effects, positive effects, and helpful methods
- Timestamped notes with edit and delete capabilities
- Notes displayed in chronological order

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **Calendar**: React Big Calendar
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Database**: OSC via MCP server
- **Notifications**: Browser Notification API

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MariaDB database (recommended: osaas.io)

## Installation

### Option 1: Using MariaDB on osaas.io (Recommended)

**See [MARIADB_SETUP.md](MARIADB_SETUP.md) for detailed instructions.**

Quick setup:
1. Configure your MariaDB credentials in `server/.env`
2. Install server dependencies: `cd server && npm install`
3. Initialize database: `npm run init-db`
4. Start backend server: `npm run dev`
5. Start frontend: `cd .. && npm run dev`

### Option 2: Using Custom Backend

1. Clone or navigate to the project directory:
```bash
cd OSC-connected-app
```

2. Install frontend dependencies:
```bash
npm install
```

3. Configure the API connection:
   - Copy `.env.example` to `.env`
   - Update `VITE_OSC_API_URL` with your backend server URL

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_OSC_API_URL=http://localhost:3000/api
```

## Database Schema

The app expects the following tables in your OSC database:

### Medications Table
```sql
- id (UUID, primary key)
- name (string)
- dosage_form (enum)
- created_at (timestamp)
- updated_at (timestamp)
```

### Reminders Table
```sql
- id (UUID, primary key)
- medication_id (UUID, foreign key)
- time (string, format: HH:mm)
- days (array of strings: Mon, Tue, Wed, etc.)
- status (enum: pending, taken, missed)
- created_at (timestamp)
```

### Reminder Logs Table
```sql
- id (UUID, primary key)
- reminder_id (UUID, foreign key)
- medication_id (UUID, foreign key)
- scheduled_time (timestamp)
- taken (boolean)
- logged_at (timestamp)
```

### Notes Table
```sql
- id (UUID, primary key)
- medication_id (UUID, foreign key)
- content (text)
- created_at (timestamp)
```

## Running the App

### Development Mode
```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Usage Guide

### Adding a Medication
1. Click "Add Medication" button on the Medications tab
2. Enter medication name
3. Select dosage form from dropdown
4. Click "Add Medication" to save

### Setting Up Reminders
1. Click on a medication to view details
2. In the Reminders section, click "Add Reminder"
3. Set the time for the reminder
4. Select the days of the week when you need to take the medication
5. Click "Add Reminder" to save

### Enabling Browser Notifications
- When you first open the app, allow notifications when prompted
- If you denied notifications, you can enable them in your browser settings
- Notifications will appear when it's time to take your medication

### Logging Medication Intake
When a reminder notification appears:
1. Click on the notification or the dialog in the app
2. Select "Yes" if you took the medication
3. Select "No" if you missed it
4. The calendar will update with the appropriate color

### Adding Notes
1. Open a medication's detail page
2. Scroll to the Notes section
3. Click "Add Note"
4. Write your note (side effects, positive effects, methods, etc.)
5. Click "Save Note"

### Using the Calendar
1. Navigate to the "Calendar" tab
2. View all medication reminders in monthly, weekly, or daily view
3. Click on any event to log whether you took the medication
4. Color coding helps track your medication adherence

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (notifications may require additional permission)
- Mobile browsers: Supported (notification support varies)

## Troubleshooting

### Notifications Not Working
- Check if notifications are allowed in browser settings
- Ensure the app is served over HTTPS (required for service workers)
- Try refreshing the page and allowing notifications again

### Database Connection Issues
- Verify the OSC MCP server URL in `.env` file
- Check if the OSC server is running
- Ensure the database tables are created with the correct schema

### Build Errors
- Delete `node_modules` and run `npm install` again
- Clear build cache: `rm -rf dist`
- Check for TypeScript errors: `npm run type-check`

## Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # Context providers for state management
├── services/           # API and notification services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

### Key Files
- `src/services/oscDatabase.ts` - OSC database integration
- `src/services/notificationService.ts` - Browser notification handling
- `src/contexts/MedicationContext.tsx` - Medication state management
- `src/contexts/ReminderContext.tsx` - Reminder state management

## Contributing

This is a custom medication management application. For issues or feature requests, please contact the development team.

## License

Private - All rights reserved

## Support

For support, please reach out to your OSC administrator or development team.
