import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, BookOpen, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface TimetableEntry {
    id: string;
    day: string;
    period: string;
    subject: string;
    facultyName: string;
    roomNumber: string;
}

export const StudentDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
    const [attendancePercentage, setAttendancePercentage] = useState(0);
    const [averageMarks, setAverageMarks] = useState(0);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = daysOfWeek[new Date().getDay()];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch timetable
            try {
                const ttResponse = await api.get('/timetable');
                setTimetable(ttResponse.data || []);

                // Filter today's classes
                const todaySchedule = (ttResponse.data || []).filter(
                    (entry: TimetableEntry) => entry.day === today
                );
                setTodayClasses(todaySchedule);
            } catch (error) {
                console.log('Timetable not available');
                setTimetable([]);
                setTodayClasses([]);
            }

            // Fetch attendance percentage (placeholder)
            setAttendancePercentage(85); // Default value

            // Fetch average marks (placeholder)
            setAverageMarks(75); // Default value

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 85) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getMarksColor = (marks: number) => {
        if (marks >= 75) return 'text-green-600 bg-green-50 border-green-200';
        if (marks >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user?.name || user?.email}!</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendance Card */}
                <div className={`p-6 rounded-xl shadow-sm border ${getAttendanceColor(attendancePercentage)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium opacity-80">Overall Attendance</p>
                            <p className="text-4xl font-bold mt-2">{attendancePercentage}%</p>
                            <p className="text-xs mt-1 opacity-70">
                                {attendancePercentage >= 85 ? '✅ Good standing' : '⚠️ Needs improvement'}
                            </p>
                        </div>
                        <div className="h-16 w-16 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
                            {attendancePercentage >= 85 ? (
                                <CheckCircle size={32} />
                            ) : attendancePercentage >= 75 ? (
                                <AlertCircle size={32} />
                            ) : (
                                <XCircle size={32} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Marks Card */}
                <div className={`p-6 rounded-xl shadow-sm border ${getMarksColor(averageMarks)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium opacity-80">Average Marks</p>
                            <p className="text-4xl font-bold mt-2">{averageMarks}%</p>
                            <p className="text-xs mt-1 opacity-70">
                                {averageMarks >= 75 ? '🎉 Excellent' : averageMarks >= 50 ? '📚 Keep going' : '⚠️ Need help'}
                            </p>
                        </div>
                        <div className="h-16 w-16 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
                            <TrendingUp size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar size={24} />
                        Today's Classes ({today})
                    </h2>
                </div>
                <div className="p-6">
                    {todayClasses.length > 0 ? (
                        <div className="space-y-3">
                            {todayClasses.map((classItem, index) => (
                                <div
                                    key={classItem.id || index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Clock className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{classItem.subject}</p>
                                            <p className="text-sm text-gray-600">
                                                Period {classItem.period} • {classItem.facultyName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700">Room {classItem.roomNumber}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">No classes scheduled for today</p>
                            <p className="text-sm text-gray-400 mt-1">Enjoy your day off! 🎉</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Timetable */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen size={24} />
                        Weekly Timetable
                    </h2>
                </div>
                <div className="p-6">
                    {timetable.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Faculty</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {timetable.map((entry, index) => (
                                        <tr
                                            key={entry.id || index}
                                            className={`hover:bg-gray-50 ${entry.day === today ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {entry.day}
                                                {entry.day === today && (
                                                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                                        Today
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.period}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.subject}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.facultyName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.roomNumber}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">No timetable available</p>
                            <p className="text-sm text-gray-400 mt-1">Contact your department for schedule</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
