# Quick Start Guide - MariaDB on osaas.io

Get your Medication Management App running with MariaDB in 5 minutes!

## Step-by-Step Setup

### 1. Get Your osaas.io MariaDB Credentials

Log in to your osaas.io account and locate your MariaDB connection details:
- Host (e.g., `mysql-xxxxx.osaas.io`)
- Port (usually `3306`)
- Username
- Password
- Database name (create one if needed, e.g., `medication_db`)

### 2. Configure the Backend

Edit `server/.env`:
```env
DB_HOST=your-host.osaas.io
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=medication_db
```

### 3. Initialize the Database

```bash
cd server
npm run init-db
```

You should see:
```
✅ Database tables created successfully!
```

### 4. Start the Backend Server

```bash
npm run dev
```

You should see:
```
✅ Successfully connected to MariaDB on osaas.io
🚀 Server running on port 3000
```

### 5. Start the Frontend

Open a new terminal:
```bash
cd OSC-connected-app
npm run dev
```

### 6. Open the App

Navigate to `http://localhost:5174` in your browser.

## You're Ready!

✅ Backend connected to MariaDB
✅ Frontend connected to backend
✅ Database tables created

Now you can:
1. Add your first medication
2. Create reminders
3. Enable browser notifications
4. Start tracking!

## Troubleshooting

**Can't connect to database?**
- Verify your osaas.io credentials in `server/.env`
- Check if your IP is whitelisted in osaas.io settings
- Ensure the database exists

**Tables not created?**
- Make sure the database user has CREATE permissions
- Check the database name is correct

**CORS errors?**
- Backend is running on port 3000
- Frontend is running on port 5174
- Check `server/.env` has `FRONTEND_URL=http://localhost:5174`

**Need help?**
See detailed troubleshooting in [MARIADB_SETUP.md](MARIADB_SETUP.md)

## What's Running?

- **Backend API**: `http://localhost:3000`
- **Frontend App**: `http://localhost:5174`
- **Database**: Your MariaDB on osaas.io

## Next Steps

Check out the main [README.md](README.md) for:
- Feature overview
- Usage guide
- Browser compatibility
- Development info
