# Attendance System

A comprehensive attendance management system with role-based access control, featuring an Admin Panel (React), Student Mobile App (Flutter), and a robust Node.js backend.

## Features

### User & Authentication
- ✅ Role-based accounts: Admin / Teacher / Student
- ✅ Single active session login (new login kills old token)
- ✅ Secure authentication using JWT + password hashing (bcrypt)
- ✅ Forgot password / Reset password functionality

### Admin Panel (React)
- ✅ Add / update / delete students, teachers, subjects
- ✅ Generate login credentials (ID + password)
- ✅ Assign subjects to teachers
- ✅ Dashboard with real-time statistics:
  - Total students
  - Attendance percentage overall
  - Today's attendance status summary
- ✅ Export attendance in CSV
- ✅ View attendance logs per date / subject / student
- ✅ Bulk operations (mark holiday / mark full class present)
- ✅ Upload student list via Excel (JSON format)

### Teacher Features
- ✅ Mark attendance per subject
- ✅ Present / Absent / Late status
- ✅ Filter by date, batch, subject
- ✅ Lock after submission to avoid tampering
- ✅ View attendance history for classes they handle
- ✅ Ability to update mistakenly marked attendance within time window

### Student Mobile App (Flutter)
- ✅ Login with credentials given by admin
- ✅ View attendance percentage per subject
- ✅ Detailed record of every day's status
- ✅ Monthly and overall attendance analytics
- ✅ Profile & account settings
- ✅ Session lock to prevent sharing login

### Attendance Engine / System Logic
- ✅ Attendance stored date-wise per subject
- ✅ Auto calculation:
  - Total classes
  - Present count
  - Attendance percentage
- ✅ Audit trail / change logs
- ✅ Prevent duplicate entries

### Security / Stability
- ✅ Token validation with session key
- ✅ CORS config
- ✅ Sanitization and validation on API input
- ✅ Protected admin/teacher/student routes

### Future Features (Scaffolding Added)
- 🔜 Face recognition attendance (AI)
- 🔜 QR scan per class
- 🔜 Push notifications for absent alerts
- 🔜 Student leave request and teacher approval
- 🔜 GPS location validation for attendance
- 🔜 Mark attendance even offline (sync when online)

## Project Structure

```
attendance-system/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & validation
│   │   └── utils/       # Utilities & future features
│   └── server.js
├── admin-panel/         # React Admin Dashboard
│   └── src/
│       ├── pages/      # Page components
│       ├── components/ # Reusable components
│       ├── api/        # API service layer
│       └── context/    # React Context
└── mobile_app/          # Flutter Student App
    └── lib/
        ├── screens/    # App screens
        ├── api/        # API service
        ├── models/     # Data models
        └── providers/  # State management
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm start
```

### Admin Panel Setup

1. Navigate to admin-panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

### Mobile App Setup

1. Navigate to mobile_app directory:
```bash
cd mobile_app
```

2. Install dependencies:
```bash
flutter pub get
```

3. Update API URL in `lib/api/api_service.dart`:
```dart
static const String baseUrl = 'http://YOUR_BACKEND_URL/api';
```

4. Run the app:
```bash
flutter run
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Admin Routes
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create student
- `PUT /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Delete student
- `POST /api/admin/students/:id/generate-credentials` - Generate credentials
- Similar routes for teachers and subjects

### Teacher Routes
- `GET /api/teacher/subjects` - Get assigned subjects
- `POST /api/teacher/attendance/mark` - Mark attendance
- `GET /api/teacher/attendance/history` - View history

### Student Routes
- `GET /api/student/attendance` - Get attendance records
- `GET /api/student/attendance/stats` - Get statistics
- `GET /api/student/attendance/daily` - Get daily record

### Dashboard Routes
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/logs` - Get attendance logs
- `GET /api/dashboard/export/csv` - Export CSV

## Database Models

### User
- userId, name, email, password, role, batch, subjects, assignedSubjects, activeToken

### Subject
- code, name, description, teacher, students

### Attendance
- studentId, subjectId, date, status, markedBy, isLocked, changes (audit trail)

### AuditLog
- action, entity, entityId, performedBy, changes, timestamp

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Single Session**: New login invalidates old tokens
3. **Password Hashing**: bcrypt for password security
4. **Input Sanitization**: Automatic trimming and validation
5. **CORS Protection**: Configured for specific origins
6. **Role-Based Access**: Middleware checks user roles
7. **Audit Trail**: All actions are logged

## Future Enhancements

The system includes scaffolding for:
- Face recognition attendance
- QR code scanning
- GPS location validation
- Push notifications
- Leave request system
- Offline sync capability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.


