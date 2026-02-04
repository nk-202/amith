import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, X, User, Clock, Calendar, BookOpen, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { studentService } from '../../services/studentService';
import { facultyService } from '../../services/facultyService';
import { timetableService } from '../../services/timetableService';
import { classService } from '../../services/classService';
import api from '../../services/api';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface StudentAttendance {
    id: string;
    name: string;
    usn: string;
    email: string;
    status: AttendanceStatus;
}

interface TimetableEntry {
    id: string;
    subject: string;
    className: string;
    classId: string;
    day: string;
    period: number;
    roomNumber: string;
    year: number;
    semester: number;
    section: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Attendance = () => {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [facultyId, setFacultyId] = useState('');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);

    // Fetch faculty timetable
    useEffect(() => {
        const fetchTimetable = async () => {
            if (!user?.email) return;

            try {
                console.log('🔍 Fetching timetable for:', user.email);

                const allFaculty = await facultyService.getAll();
                const faculty = allFaculty.find((f: any) => f.email === user.email);

                if (!faculty) {
                    console.log('❌ Faculty not found');
                    setLoading(false);
                    return;
                }

                console.log('✅ Faculty found:', faculty.id, faculty.name);
                setFacultyId(faculty.id);

                // Get timetable entries
                const allTimetable = await timetableService.getAll();
                const facultyTimetable = allTimetable.filter((t: any) => t.facultyId === faculty.id);

                console.log('📅 Timetable entries:', facultyTimetable.length);

                // Get all classes
                const allClasses = await classService.getAll();

                // Map timetable with class details
                const timetableWithDetails: TimetableEntry[] = facultyTimetable.map((tt: any) => {
                    const classInfo = allClasses.find((c: any) => c.id === tt.classId);
                    return {
                        id: tt.id,
                        subject: tt.subject,
                        className: classInfo?.name || 'Unknown',
                        classId: tt.classId,
                        day: tt.day,
                        period: tt.period,
                        roomNumber: tt.roomNumber || 'N/A',
                        year: classInfo?.year || 0,
                        semester: classInfo?.semester || 0,
                        section: classInfo?.section || ''
                    };
                });

                // Sort by day and period
                timetableWithDetails.sort((a, b) => {
                    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
                    if (dayDiff !== 0) return dayDiff;
                    return a.period - b.period;
                });

                setTimetable(timetableWithDetails);
            } catch (error) {
                console.error('❌ Failed to fetch timetable:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [user]);

    // Fetch students when entry is selected
    const handleAddAttendance = async (entry: TimetableEntry) => {
        setSelectedEntry(entry);
        setLoading(true);
        setShowAttendanceModal(true);

        try {
            console.log('📖 Fetching students for:', entry.subject, entry.className);

            const allStudents = await studentService.getAll();

            // Filter students by class
            let classStudents = allStudents.filter((s: any) => s.classId === entry.classId);

            if (classStudents.length === 0) {
                classStudents = allStudents.filter((s: any) =>
                    s.year === entry.year &&
                    s.semester === entry.semester &&
                    s.section === entry.section
                );
            }

            console.log('👥 Students found:', classStudents.length);

            const attendanceData: StudentAttendance[] = classStudents.map((s: any) => ({
                id: s.id,
                name: s.name || `${s.firstName} ${s.lastName}`,
                usn: s.usn,
                email: s.email,
                status: 'present' as AttendanceStatus
            }));

            setStudents(attendanceData);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, status } : s
        ));
    };

    const markAll = (status: AttendanceStatus) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    const saveAttendance = async () => {
        if (!selectedEntry) return;

        setSaving(true);
        try {
            const attendanceRecords = students.map(student => ({
                student_id: student.id,
                date: attendanceDate,
                status: student.status,
                class_id: selectedEntry.classId,
                timetable_id: selectedEntry.id
            }));

            // Save all attendance
            const response = await api.post('/attendance/mark-bulk', {
                attendance_records: attendanceRecords,
                send_notifications: false
            });

            // Send emails only for late/absent
            const studentsToNotify = students.filter(s => s.status === 'absent' || s.status === 'late');
            if (studentsToNotify.length > 0) {
                const notificationRecords = studentsToNotify.map(student => ({
                    student_id: student.id,
                    date: attendanceDate,
                    status: student.status,
                    class_id: selectedEntry.classId,
                    timetable_id: selectedEntry.id
                }));

                await api.post('/attendance/mark-bulk', {
                    attendance_records: notificationRecords,
                    send_notifications: true
                });
            }

            const results = response.data.results;
            alert(`Attendance saved for ${selectedEntry.subject}!\n\n✅ ${results.success} students marked\n📧 ${studentsToNotify.length} emails sent\n❌ ${results.failed} failed`);

            setShowAttendanceModal(false);
            setSelectedEntry(null);
        } catch (error: any) {
            console.error('Failed to save attendance:', error);
            alert(error.response?.data?.error || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const lateCount = students.filter(s => s.status === 'late').length;

    if (loading && timetable.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading your timetable...</div>
            </div>
        );
    }

    if (timetable.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-500 mb-2">No timetable entries found.</p>
                    <p className="text-sm text-gray-400">Please contact the administrator to add you to the timetable.</p>
                </div>
            </div>
        );
    }

    // Group timetable by day
    const timetableByDay = DAYS.reduce((acc, day) => {
        acc[day] = timetable.filter(t => t.day === day);
        return acc;
    }, {} as Record<string, TimetableEntry[]>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Timetable & Attendance</h1>
                    <p className="text-gray-500 text-sm">View your schedule and mark attendance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-gray-500" />
                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="space-y-4">
                {DAYS.map(day => {
                    const dayEntries = timetableByDay[day];
                    if (!dayEntries || dayEntries.length === 0) return null;

                    return (
                        <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-bold text-gray-900">{day}</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {dayEntries.map(entry => (
                                    <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold text-sm">
                                                    Period {entry.period}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen size={18} className="text-gray-500" />
                                                        <h4 className="font-semibold text-gray-900">{entry.subject}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Users size={14} />
                                                            {entry.className}
                                                        </span>
                                                        <span>Room: {entry.roomNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddAttendance(entry)}
                                                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                                            >
                                                Add Attendance
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Attendance Modal */}
            {showAttendanceModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedEntry.subject}</h2>
                                    <p className="text-gray-600 mt-1">
                                        {selectedEntry.className} • {selectedEntry.day} • Period {selectedEntry.period} • {new Date(attendanceDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAttendanceModal(false);
                                        setSelectedEntry(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-medium">Total</p>
                                <p className="text-xl font-bold text-blue-900">{students.length}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-xs text-green-600 font-medium">Present</p>
                                <p className="text-xl font-bold text-green-900">{presentCount}</p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-600 font-medium">Late</p>
                                <p className="text-xl font-bold text-amber-900">{lateCount}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <p className="text-xs text-red-600 font-medium">Absent</p>
                                <p className="text-xl font-bold text-red-900">{absentCount}</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Quick Actions:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => markAll('present')}
                                    className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                    All Present
                                </button>
                                <button
                                    onClick={() => markAll('late')}
                                    className="text-xs font-medium px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                                >
                                    All Late
                                </button>
                                <button
                                    onClick={() => markAll('absent')}
                                    className="text-xs font-medium px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    All Absent
                                </button>
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading students...</div>
                            ) : students.length > 0 ? (
                                students.map((student, index) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-400 font-mono w-8">{(index + 1).toString().padStart(2, '0')}</span>
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.usn}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className={clsx(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer border-2",
                                                student.status === 'present'
                                                    ? "bg-green-100 text-green-700 border-green-500"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={student.status === 'present'}
                                                    onChange={() => setStudentStatus(student.id, 'present')}
                                                    className="sr-only"
                                                />
                                                <Check size={18} />
                                                <span className="text-sm">Present</span>
                                            </label>

                                            <label className={clsx(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer border-2",
                                                student.status === 'late'
                                                    ? "bg-amber-100 text-amber-700 border-amber-500"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={student.status === 'late'}
                                                    onChange={() => setStudentStatus(student.id, 'late')}
                                                    className="sr-only"
                                                />
                                                <Clock size={18} />
                                                <span className="text-sm">Late</span>
                                            </label>

                                            <label className={clsx(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer border-2",
                                                student.status === 'absent'
                                                    ? "bg-red-100 text-red-700 border-red-500"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={student.status === 'absent'}
                                                    onChange={() => setStudentStatus(student.id, 'absent')}
                                                    className="sr-only"
                                                />
                                                <X size={18} />
                                                <span className="text-sm">Absent</span>
                                            </label>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-gray-400">
                                    No students found in this class
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                📧 Emails will be sent only to Absent and Late students
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAttendanceModal(false);
                                        setSelectedEntry(null);
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveAttendance}
                                    disabled={saving || students.length === 0}
                                    className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg hover:bg-green-600 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Attendance'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
