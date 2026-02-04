import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Timetable from '../models/Timetable.js';
import whatsappService from '../services/whatsappService.js';
import { sendAttendanceEmail } from '../services/emailService.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Mark Attendance
router.post('/mark', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const { student_id, timetable_id, date, status, send_notification, class_id } = req.body;

        console.log('📝 Marking attendance:', { student_id, date, status, send_notification });

        let query = { studentId: student_id, date: new Date(date) };
        if (timetable_id) query.timetableId = timetable_id;

        const existing = await Attendance.findOne(query);

        if (existing) {
            existing.status = status;
            await existing.save();
        } else {
            await Attendance.create({
                studentId: student_id,
                classId: class_id,
                timetableId: timetable_id,
                date: new Date(date),
                status,
                markedBy: req.user.id
            });
        }

        // Send email notification if requested
        if (send_notification) {
            try {
                // Fetch student details
                const student = await Student.findById(student_id).populate('user', 'email');

                if (!student || !student.user || !student.user.email) {
                    console.log('⚠️ Student email not found, skipping notification');
                } else {
                    // Fetch faculty details
                    const faculty = await Faculty.findOne({ user: req.user.id });
                    const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Faculty';

                    // Fetch subject from timetable if available
                    let subject = 'Class';
                    if (timetable_id) {
                        const timetable = await Timetable.findById(timetable_id);
                        if (timetable) {
                            subject = timetable.subject;
                        }
                    }

                    // Send email
                    await sendAttendanceEmail({
                        studentEmail: student.user.email,
                        studentName: `${student.firstName} ${student.lastName}`,
                        subject: subject,
                        date: date,
                        status: status,
                        facultyName: facultyName
                    });

                    console.log('✅ Attendance email sent to:', student.user.email);
                }
            } catch (emailError) {
                console.error('❌ Failed to send attendance email:', emailError);
                // Don't fail the attendance marking if email fails
            }
        }

        res.json({ message: 'Attendance marked successfully' });

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Bulk mark attendance
router.post('/mark-bulk', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const { attendance_records, send_notifications } = req.body;
        // attendance_records: [{ student_id, date, status, timetable_id, class_id }]

        console.log(`📝 Bulk marking attendance for ${attendance_records.length} students`);

        const results = {
            success: 0,
            failed: 0,
            emailsSent: 0
        };

        for (const record of attendance_records) {
            try {
                const { student_id, date, status, timetable_id, class_id } = record;

                let query = { studentId: student_id, date: new Date(date) };
                if (timetable_id) query.timetableId = timetable_id;

                const existing = await Attendance.findOne(query);

                if (existing) {
                    existing.status = status;
                    await existing.save();
                } else {
                    await Attendance.create({
                        studentId: student_id,
                        classId: class_id,
                        timetableId: timetable_id,
                        date: new Date(date),
                        status,
                        markedBy: req.user.id
                    });
                }

                results.success++;

                // Send email if notifications enabled
                if (send_notifications) {
                    try {
                        const student = await Student.findById(student_id).populate('user', 'email');

                        if (student && student.user && student.user.email) {
                            const faculty = await Faculty.findOne({ user: req.user.id });
                            const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Faculty';

                            let subject = 'Class';
                            if (timetable_id) {
                                const timetable = await Timetable.findById(timetable_id);
                                if (timetable) subject = timetable.subject;
                            }

                            await sendAttendanceEmail({
                                studentEmail: student.user.email,
                                studentName: `${student.firstName} ${student.lastName}`,
                                subject: subject,
                                date: date,
                                status: status,
                                facultyName: facultyName
                            });

                            results.emailsSent++;
                        }
                    } catch (emailError) {
                        console.error('Email error for student:', student_id, emailError.message);
                    }
                }

            } catch (error) {
                console.error('Failed to mark attendance for student:', record.student_id, error);
                results.failed++;
            }
        }

        console.log(`✅ Bulk attendance complete: ${results.success} marked, ${results.emailsSent} emails sent, ${results.failed} failed`);

        res.json({
            message: 'Bulk attendance marked',
            results
        });

    } catch (error) {
        console.error('Bulk mark attendance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
