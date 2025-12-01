# Quick Fix for "Server error" on Login

## The Problem
The error "next is not a function" occurs because the backend server is running old code. The User model was fixed, but the server needs to be restarted.

## Solution

### Step 1: Stop the Backend Server
1. Go to the terminal where the backend is running
2. Press `Ctrl+C` to stop it

### Step 2: Restart the Backend Server
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

### Step 3: Try Login Again
1. Go back to the admin panel (http://localhost:3000)
2. Login with:
   - **Email**: `admin@gmail.com`
   - **Password**: `123456`

## If It Still Doesn't Work

1. **Check MongoDB is running:**
   ```bash
   # Make sure MongoDB service is running
   ```

2. **Verify admin user exists:**
   ```bash
   cd backend
   npm run seed:admin
   ```

3. **Check backend logs** for any error messages

4. **Clear browser cache** and try again

## Expected Behavior
After restarting, the login should work and you'll be redirected to the dashboard.

