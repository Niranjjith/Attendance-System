# Troubleshooting Guide

## "Server error" on Login

If you're getting a "Server error" when trying to login, follow these steps:

### 1. Check if Backend Server is Running

Open a terminal in the `backend` directory and run:
```bash
cd backend
npm start
```

You should see:
```
✅ Environment variables loaded
🔌 Connecting to MongoDB...
✅ Database connected successfully
🚀 Server running on port 5000
```

### 2. Check MongoDB Connection

Make sure MongoDB is running:
- If installed locally: MongoDB service should be running
- If using MongoDB Atlas: Check your connection string in `.env`

### 3. Verify Backend is Accessible

Test the backend health endpoint:
```bash
curl http://localhost:5000/api/health
```

Or open in browser: http://localhost:5000/api/health

Should return: `{"status":"ok","timestamp":"..."}`

### 4. Check Admin User Exists

Make sure you've seeded the admin user:
```bash
cd backend
npm run seed:admin
```

### 5. Verify Credentials

Default admin credentials:
- **Email/User ID**: `admin@gmail.com`
- **Password**: `123456`

### 6. Check Browser Console

Open browser DevTools (F12) and check:
- Console tab for any errors
- Network tab to see if requests are being made
- Check if requests are going to `http://localhost:5000/api/auth/login`

### 7. CORS Issues

If you see CORS errors:
- Make sure `FRONTEND_URL` in backend `.env` matches your React app URL (usually `http://localhost:3000`)
- Restart the backend server after changing `.env`

### 8. Common Issues

**Port Already in Use:**
```bash
# Windows: Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**MongoDB Not Running:**
- Start MongoDB service
- Or update `.env` with MongoDB Atlas connection string

**Environment Variables Not Loaded:**
- Make sure `.env` file exists in `backend` directory
- Check that `MONGO_URI` and `JWT_SECRET` are set

## Still Having Issues?

1. Check backend terminal for error messages
2. Check browser console for detailed error messages
3. Verify all dependencies are installed: `npm install` in both backend and admin-panel
4. Make sure you're using the correct credentials

