import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, '../dist');

console.log('Server starting...');
console.log('Build path resolved to:', buildPath);
if (fs.existsSync(buildPath)) {
    console.log('Build directory exists.');
    console.log('Contents:', fs.readdirSync(buildPath));
} else {
    console.error('WARNING: Build directory does not exist at', buildPath);
}

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'https://amith-93zp.onrender.com',
            process.env.FRONTEND_URL
        ];

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            // Allow all for now to prevent issues, but log it
            console.log('Allowed blocked origin for compatibility:', origin);
            callback(null, true);
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - define early
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SIET CSE ERP Server is running' });
});

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

// API 404 handler - Only for /api requests that fell through
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Route not found' });
});

// Serve static files from the frontend build directory
app.use(express.static(buildPath));

// Handle SPA routing: return index.html for any non-API route
app.get('*', (req, res, next) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error('index.html not found at:', indexPath);
        return res.status(500).send('Application build not found. Please check deployment logs.');
    }
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            next(err);
        }
    });
});

// Global Error handling middleware (MUST be last)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});
