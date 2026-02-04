import { useAuth } from '../../context/AuthContext';
import TimetableCard from '../../components/dashboard/TimetableCard';
import { BookOpen, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { timetableService } from '../../services/timetableService';
import { studentService } from '../../services/studentService';
import { facultyService } from '../../services/facultyService';
import type { Student } from '../../types';

export const StaffDashboard = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        todayClasses: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        if (!user?.email) return;

        try {
            setLoading(true);

            // Get faculty profile to get faculty ID
            const allFaculty = await facultyService.getAll();
            const facultyProfile = allFaculty.find((f: any) => f.email === user.email);

            if (!facultyProfile) {
                setLoading(false);
                return;
            }

            // Get faculty's timetable to find assigned classes
            const timetable = await timetableService.getByFaculty(facultyProfile.id);

            // Extract unique class IDs
            const classIds = [...new Set(timetable.map((t: any) => t.classId).filter(Boolean))];

            // Fetch students from all assigned classes
            let allStudents: Student[] = [];
            for (const classId of classIds) {
                const classStudents = await studentService.getAll({ classId: classId as string });
                allStudents = [...allStudents, ...classStudents];
            }

            // Remove duplicates based on student ID
            const uniqueStudents = Array.from(
                new Map(allStudents.map(s => [s.id, s])).values()
            );

            setStudents(uniqueStudents);

            // Calculate stats
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayClasses = timetable.filter((t: any) => t.day === today).length;

            setStats({
                totalStudents: uniqueStudents.length,
                totalClasses: classIds.length,
                todayClasses
            });

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Faculty Dashboard</h1>
                <p className="text-gray-500">Welcome, {user?.name}. Manage your classes and students.</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Students</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalStudents}</p>
                        </div>
                        <div className="bg-blue-200 p-3 rounded-full">
                            <GraduationCap className="h-6 w-6 text-blue-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Assigned Classes</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{stats.totalClasses}</p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-full">
                            <BookOpen className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Today's Classes</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">{stats.todayClasses}</p>
                        </div>
                        <div className="bg-purple-200 p-3 rounded-full">
                            <TrendingUp className="h-6 w-6 text-purple-700" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Schedule Column */}
                <div className="lg:col-span-2 space-y-6">
                    <TimetableCard role="faculty" facultyId={user?.profileId} />

                    {/* My Students Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                My Students ({students.length})
                            </h3>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading students...</div>
                            ) : students.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {students.slice(0, 10).map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {student.firstName} {student.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{student.usn}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-700">
                                                    Year {student.year} - Sem {student.semester}
                                                </p>
                                                <p className="text-xs text-gray-500">Section {student.section}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {students.length > 10 && (
                                        <p className="text-center text-sm text-gray-500 pt-2">
                                            +{students.length - 10} more students
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No students assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Stats Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex flex-col items-center gap-2">
                                <Users className="h-5 w-5" />
                                Attendance
                            </button>
                            <button className="p-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium flex flex-col items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Marks Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
