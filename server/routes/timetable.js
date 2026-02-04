import express from 'express';
import Class from '../models/Class.js';
import Timetable from '../models/Timetable.js';
import Faculty from '../models/Faculty.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get All Timetable Entries
router.get('/', authMiddleware, async (req, res) => {
    try {
        const timetable = await Timetable.find()
            .populate('classId', 'name section year semester')
            .populate('facultyId', 'firstName lastName');

        const response = timetable.map(t => ({
            id: t._id,
            day: t.day,
            period: t.period,
            subject: t.subject,
            facultyId: t.facultyId?._id,
            facultyName: t.facultyId ? `${t.facultyId.firstName} ${t.facultyId.lastName}` : 'Unassigned',
            classId: t.classId?._id,
            className: t.classId?.name,
            section: t.classId?.section,
            roomNumber: t.roomNumber
        }));

        res.json(response);
    } catch (error) {
        console.error('Get all timetable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Timetable for Faculty
router.get('/faculty/:facultyId', authMiddleware, async (req, res) => {
    try {
        const { facultyId } = req.params;
        // In Mongoose facultyId is the _id in Faculty collection
        // Timetable entries store facultyId

        const timetable = await Timetable.find({ facultyId }).populate('classId', 'name section');

        // Map to frontend expectation
        const response = timetable.map(t => ({
            day_of_week: t.day,
            period_number: t.period,
            subject: t.subject,
            faculty_id: t.facultyId,
            room_number: t.roomNumber,
            class_id: t.classId?._id,
            // @ts-ignore
            class_name: t.classId?.name,
            // @ts-ignore
            section: t.classId?.section
        }));

        res.json(response);
    } catch (error) {
        console.error('Get faculty timetable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Timetable for Class (Student View)
router.get('/class/:classId', authMiddleware, async (req, res) => {
    try {
        const { classId } = req.params;

        const timetable = await Timetable.find({ classId }).populate('facultyId', 'firstName lastName');

        // Map to frontend expectation
        const response = timetable.map(t => ({
            day_of_week: t.day,
            period_number: t.period,
            subject: t.subject,
            faculty_id: t.facultyId?._id,
            faculty_name: t.facultyId ? `${t.facultyId.firstName} ${t.facultyId.lastName}` : 'Unknown',
            room_number: t.roomNumber,
            class_id: t.classId
        }));

        res.json(response);
    } catch (error) {
        console.error('Get class timetable error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Timetable Entry
router.post('/', authMiddleware, roleMiddleware('admin', 'hod'), async (req, res) => {
    try {
        const { class_id, day_of_week, period_number, subject, faculty_id, room_number } = req.body;

        const fid = (faculty_id && faculty_id !== '') ? faculty_id : null;

        // Check conflicts
        const existing = await Timetable.findOne({
            classId: class_id,
            day: day_of_week,
            period: period_number
        });

        if (existing) {
            // Update
            existing.subject = subject;
            existing.facultyId = fid;
            existing.roomNumber = room_number;
            await existing.save();
            return res.json({ message: 'Timetable updated' });
        }

        const newEntry = await Timetable.create({
            classId: class_id,
            day: day_of_week,
            period: period_number,
            subject,
            facultyId: fid,
            roomNumber: room_number
        });

        res.status(201).json({ id: newEntry._id, message: 'Timetable entry created' });

    } catch (error) {
        console.error('Create timetable error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

export default router;
