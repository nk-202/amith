import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import facultyRoutes from './routes/faculty.js';
import classRoutes from './routes/classes.js';
import settingsRoutes from './routes/settings.js';
import attendanceRoutes from './routes/attendance.js';
import marksRoutes from './routes/marks.js';
import notificationsRoutes from './routes/notifications.js';
import timetableRoutes from './routes/timetable.js';
import examRoutes from './routes/exams.js';
import examGradesRoutes from './routes/examGrades.js';
import profileRoutes from './routes/profile.js';

import connectDB from './config/database.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'https://amith-93zp.onrender.com', // Your deployed frontend
            process.env.FRONTEND_URL // Any other dynamic URL
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // For now, in development/testing, let's be permissive if it looks like our frontend
            // or just allow it to fix the immediate blocker, but standard practice is specific origins.
            // Let's stick to the specific list + env var to be safe but effective.
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                // For the user request, we simply want to ADD their new URL.
                // If the origin is not in the list, technically we should block it, 
                // but checking if it includes 'onrender.com' might be a temporary safety net? 
                // No, let's just stick to the specific allowed array.
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-grades', examGradesRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SIET CSE ERP Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res, next) => {
    // If the request is for an API route and didn't match, return 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Route not found' });
    }
    next();
});

// Serve static files from the frontend build directory
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust the path to where your frontend build is located
// Assuming it's in the root 'dist' folder (one level up from server)
const buildPath = path.join(__dirname, '../dist');

app.use(express.static(buildPath));

// Handle SPA routing: return index.html for any non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});
