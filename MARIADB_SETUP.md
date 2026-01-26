# MariaDB Setup Guide for osaas.io

This guide will help you connect your Medication Management App to a MariaDB database hosted on osaas.io.

## Prerequisites

- Access to a MariaDB instance on osaas.io
- Database credentials (host, port, username, password, database name)
- Node.js v16 or higher installed

## Setup Steps

### Step 1: Configure Database Connection

1. Navigate to the server directory:
```bash
cd server
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Edit `server/.env` with your osaas.io MariaDB credentials:
```env
# MariaDB Configuration for osaas.io
DB_HOST=https://maryam01-medication.linuxserver-docker-mariadb.auto.prod.osaas.io
DB_PORT=3306
DB_USER=maryam
DB_PASSWORD=1234
DB_NAME=medication-app

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (your frontend URL)
FRONTEND_URL=http://localhost:5173
```

**How to get your osaas.io credentials:**
- Log in to your osaas.io account
- Navigate to your MariaDB service
- Copy the connection details:
  - **DB_HOST**: Usually something like `mysql-xxxxx.osaas.io`
  - **DB_PORT**: Default is `3306`
  - **DB_USER**: Your database username
  - **DB_PASSWORD**: Your database password
  - **DB_NAME**: The name of your database (you can create a new database called `medication_db`)

### Step 2: Install Server Dependencies

Still in the `server` directory, install the required packages:
```bash
npm install
```

This will install:
- `express` - Web server framework
- `mariadb` - MariaDB client for Node.js
- `cors` - Enable CORS for frontend communication
- `dotenv` - Environment variable management
- `uuid` - Generate unique IDs
- `nodemon` - Development server with auto-restart

### Step 3: Initialize the Database

Run the database initialization script to create all required tables:
```bash
npm run init-db
```

This script will create the following tables in your MariaDB database:
- `medications` - Store medication information
- `reminders` - Store medication reminders
- `reminder_logs` - Track when medications were taken
- `notes` - Store notes about medications

You should see output like:
```
🔄 Initializing database tables...
✅ Database tables created successfully!

Tables created:
  - medications
  - reminders
  - reminder_logs
  - notes
```

### Step 4: Start the Backend Server

Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

You should see:
```
✅ Successfully connected to MariaDB on osaas.io
🚀 Server running on port 3000
📡 API available at http://localhost:3000/api
```

### Step 5: Verify Database Connection

Test that the server is running and connected:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-20T..."}
```

Test the medications endpoint:
```bash
curl http://localhost:3000/api/medications
```

Expected response (initially empty):
```json
[]
```

### Step 6: Start the Frontend

Open a new terminal window and navigate to the project root:
```bash
cd ..  # Go back to project root
npm run dev
```

The frontend will start at `http://localhost:5173` and connect to your backend server.

## API Endpoints

The backend server provides the following REST API endpoints:

### Medications
- `GET /api/medications` - Get all medications
- `POST /api/medications` - Create a new medication
- `GET /api/medications/:id` - Get a specific medication
- `PUT /api/medications/:id` - Update a medication
- `DELETE /api/medications/:id` - Delete a medication

### Reminders
- `GET /api/reminders` - Get all reminders
- `GET /api/reminders?medication_id=xxx` - Get reminders for a medication
- `POST /api/reminders` - Create a new reminder
- `GET /api/reminders/:id` - Get a specific reminder
- `PUT /api/reminders/:id` - Update a reminder
- `DELETE /api/reminders/:id` - Delete a reminder

### Reminder Logs
- `GET /api/reminder-logs` - Get all logs
- `GET /api/reminder-logs?reminder_id=xxx` - Get logs for a reminder
- `GET /api/reminder-logs?start=xxx&end=xxx` - Get logs in date range
- `POST /api/reminder-logs` - Create a log entry
- `PUT /api/reminder-logs/:id` - Update a log
- `DELETE /api/reminder-logs/:id` - Delete a log

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes?medication_id=xxx` - Get notes for a medication
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

## Troubleshooting

### Connection Refused Error
If you see `ECONNREFUSED` error:
- Verify your MariaDB host and port are correct
- Check if your osaas.io database service is running
- Ensure your IP address is whitelisted in osaas.io security settings

### Authentication Failed
If you see authentication errors:
- Double-check your username and password
- Ensure the database user has proper permissions
- Verify the database name exists

### Table Creation Failed
If tables aren't created:
- Check that the database exists
- Ensure your user has CREATE TABLE permissions
- Look at the error message for specific SQL issues

### CORS Errors in Frontend
If you see CORS errors in the browser console:
- Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
- Restart the backend server after changing environment variables

### Database Name Not Found
If the database doesn't exist:
- Log in to your osaas.io MariaDB admin panel
- Create a new database named `medication_db` (or your chosen name)
- Update `DB_NAME` in `server/.env`

## Database Schema

### Medications Table
```sql
CREATE TABLE medications (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dosage_form ENUM(...) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Reminders Table
```sql
CREATE TABLE reminders (
  id VARCHAR(36) PRIMARY KEY,
  medication_id VARCHAR(36),
  time VARCHAR(5),
  days JSON,
  status ENUM('pending', 'taken', 'missed'),
  created_at TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);
```

### Reminder Logs Table
```sql
CREATE TABLE reminder_logs (
  id VARCHAR(36) PRIMARY KEY,
  reminder_id VARCHAR(36),
  medication_id VARCHAR(36),
  scheduled_time TIMESTAMP,
  taken BOOLEAN,
  logged_at TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id),
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id VARCHAR(36) PRIMARY KEY,
  medication_id VARCHAR(36),
  content TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);
```

## Running Both Servers

For development, you'll need to run both servers:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Production Deployment

For production:

1. Set `NODE_ENV=production` in `server/.env`
2. Build the frontend:
```bash
npm run build
```
3. Serve the frontend build with a static server
4. Run the backend with:
```bash
cd server
npm start
```

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for your database
- Enable SSL/TLS for database connections in production
- Keep your osaas.io credentials secure
- Regularly update dependencies for security patches

## Support

For issues with:
- **osaas.io database**: Contact osaas.io support
- **Application bugs**: Check the main README.md
- **API errors**: Check server logs in the terminal

## Next Steps

Once connected:
1. Open the app at `http://localhost:5173`
2. Add your first medication
3. Set up reminders
4. Enable browser notifications
5. Start tracking your medications!
