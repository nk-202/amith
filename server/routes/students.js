import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all students (with filters)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { year, semester, section } = req.query;
        let query = {};

        if (year) query.year = year;
        if (semester) query.semester = semester;
        if (section) query.section = section;

        const students = await Student.find(query).populate('user', 'email');

        const response = students.map(s => ({
            id: s._id,
            name: `${s.firstName} ${s.lastName}`,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.user ? s.user.email : 'N/A', // Assuming populate works
            usn: s.usn,
            year: s.year,
            semester: s.semester,
            section: s.section,
            phone: s.phone,
            parentName: s.parentName,
            parentPhone: s.parentPhone
        }));

        res.json(response);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate('user', 'email');

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const response = {
            id: student._id,
            name: `${student.firstName} ${student.lastName}`,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.user ? student.user.email : 'N/A',
            usn: student.usn,
            year: student.year,
            semester: student.semester,
            section: student.section,
            phone: student.phone,
            parentName: student.parentName,
            parentPhone: student.parentPhone
        };

        res.json(response);
    } catch (error) {
        console.error('Get student by ID error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Student
router.post('/', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const { firstName, lastName, email, usn, phone, parentName, parentPhone, year, semester, section, classId, newPassword } = req.body;

        console.log('📝 Creating student:', { firstName, lastName, email, usn, year, semester, section, classId });

        // Validate required fields
        if (!firstName || !lastName || !email || !usn || !year || !semester || !section) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate password
        if (!newPassword) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Check duplicates
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('❌ Email already exists:', email);
            return res.status(400).json({ error: 'Email already exists' });
        }

        const usnExists = await Student.findOne({ usn: usn.toUpperCase() });
        if (usnExists) {
            console.log('❌ USN already exists:', usn);
            return res.status(400).json({ error: 'USN already exists' });
        }

        // Create User with provided password
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const newUser = await User.create({
            name: `${firstName} ${lastName}`,
            email,
            password: hashedPassword,
            role: 'student',
            department: 'CSE'
        });

        console.log('✅ User created:', newUser._id);

        const studentData = {
            user: newUser._id,
            usn: usn.toUpperCase(),
            firstName,
            lastName,
            phone: phone || '',
            parentName: parentName || '',
            parentPhone: parentPhone || '',
            year: Number(year),
            semester: Number(semester),
            section: section.toUpperCase()
        };

        // Add classId if provided
        if (classId) {
            studentData.classId = classId;
            console.log('✅ ClassId provided:', classId);
        } else {
            console.log('⚠️ No classId provided - student will not be linked to a class');
        }

        console.log('📋 Final student data:', studentData);

        const newStudent = await Student.create(studentData);

        console.log('✅ Student created:', newStudent._id);

        res.status(201).json({
            message: 'Student created successfully',
            id: newStudent._id
        });

    } catch (error) {
        console.error('❌ Create student error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Server error',
            details: error.message
        });
    }
});

// Delete Student
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        await User.findByIdAndDelete(student.user);
        await Student.findByIdAndDelete(student._id);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
