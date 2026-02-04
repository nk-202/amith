import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { examGradeService, type FacultyExam, type StudentWithGrade } from '../../services/examGradeService';
import { facultyService } from '../../services/facultyService';
import { BookOpen, Users, Calendar, Award, Save, ArrowLeft, CheckCircle } from 'lucide-react';

export const StaffExamGrades = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState<FacultyExam[]>([]);
    const [selectedExam, setSelectedExam] = useState<FacultyExam | null>(null);
    const [students, setStudents] = useState<StudentWithGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [facultyId, setFacultyId] = useState<string>('');
    const [grades, setGrades] = useState<Record<string, { marks: number; remarks: string }>>({});

    useEffect(() => {
        fetchFacultyProfile();
    }, [user]);

    useEffect(() => {
        if (facultyId) {
            fetchExams();
        }
    }, [facultyId]);

    const fetchFacultyProfile = async () => {
        if (!user?.email) return;

        try {
            const allFaculty = await facultyService.getAll();
            const faculty = allFaculty.find((f: any) => f.email === user.email);
            if (faculty) {
                setFacultyId(faculty.id);
            }
        } catch (error) {
            console.error('Failed to fetch faculty profile:', error);
        }
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const examsData = await examGradeService.getFacultyExams(facultyId);
            setExams(examsData);
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExamSelect = async (exam: FacultyExam) => {
        setSelectedExam(exam);
        setLoading(true);
        try {
            const studentsData = await examGradeService.getExamStudents(exam.id);
            setStudents(studentsData);

            // Initialize grades state with existing grades
            const initialGrades: Record<string, { marks: number; remarks: string }> = {};
            studentsData.forEach((student: StudentWithGrade) => {
                if (student.hasGrade) {
                    initialGrades[student.id] = {
                        marks: student.marksObtained || 0,
                        remarks: student.remarks || ''
                    };
                }
            });
            setGrades(initialGrades);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarksChange = (studentId: string, marks: string) => {
        const marksNum = marks === '' ? 0 : Number(marks);
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                marks: marksNum,
                remarks: prev[studentId]?.remarks || ''
            }
        }));
    };

    const handleRemarksChange = (studentId: string, remarks: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                marks: prev[studentId]?.marks || 0,
                remarks
            }
        }));
    };

    const handleSaveAll = async () => {
        if (!selectedExam) return;

        setSaving(true);
        try {
            const gradeData = Object.entries(grades)
                .filter(([_, data]) => data.marks !== undefined)
                .map(([studentId, data]) => ({
                    studentId,
                    examId: selectedExam.id,
                    marksObtained: data.marks,
                    remarks: data.remarks,
                    facultyId
                }));

            if (gradeData.length === 0) {
                alert('Please enter marks for at least one student');
                return;
            }

            await examGradeService.submitBulkGrades(selectedExam.id, gradeData, facultyId);
            alert('Grades saved successfully!');

            // Refresh data
            await handleExamSelect(selectedExam);
            await fetchExams();
        } catch (error: any) {
            console.error('Failed to save grades:', error);
            alert(error.response?.data?.error || 'Failed to save grades');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        setSelectedExam(null);
        setStudents([]);
        setGrades({});
    };

    const getProgressPercentage = (exam: FacultyExam) => {
        if (exam.totalStudents === 0) return 0;
        return Math.round((exam.gradedCount / exam.totalStudents) * 100);
    };

    const getStatusColor = (percentage: number) => {
        if (percentage === 100) return 'text-green-600 bg-green-50';
        if (percentage >= 50) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    if (selectedExam) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{selectedExam.examName}</h1>
                            <p className="text-gray-500">
                                {selectedExam.className} - {selectedExam.subject}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving || Object.keys(grades).length === 0}
                        className="bg-primary hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save All Grades'}
                    </button>
                </div>

                {/* Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">Maximum Marks</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedExam.maxMarks}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-600 font-medium">Passing Marks</p>
                        <p className="text-2xl font-bold text-amber-900">{selectedExam.minMarks}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-purple-900">{selectedExam.totalStudents}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Graded</p>
                        <p className="text-2xl font-bold text-green-900">
                            {selectedExam.gradedCount}/{selectedExam.totalStudents}
                        </p>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">USN</th>
                                    <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Student Name</th>
                                    <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Marks Obtained</th>
                                    <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Remarks</th>
                                    <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Loading students...</td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((student) => {
                                        const currentMarks = grades[student.id]?.marks;
                                        const isPassing = currentMarks !== undefined && currentMarks >= selectedExam.minMarks;

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4">
                                                    <span className="font-mono text-sm text-gray-700">{student.usn}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-medium text-gray-900">
                                                        {student.firstName} {student.lastName}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={selectedExam.maxMarks}
                                                        value={grades[student.id]?.marks ?? ''}
                                                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        placeholder="0"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-500">/ {selectedExam.maxMarks}</span>
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={grades[student.id]?.remarks ?? ''}
                                                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        placeholder="Optional remarks"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    {currentMarks !== undefined ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {isPassing ? 'Pass' : 'Fail'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Not graded</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-400">
                                            No students found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Exam Grades</h1>
                <p className="text-gray-500">Enter and manage grades for your exams</p>
            </header>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading exams...</div>
                ) : exams.length > 0 ? (
                    exams.map((exam) => {
                        const progress = getProgressPercentage(exam);
                        return (
                            <div
                                key={exam.id}
                                onClick={() => handleExamSelect(exam)}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-5 w-5 text-amber-500" />
                                        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                            {exam.examName}
                                        </h3>
                                    </div>
                                    {progress === 100 && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{exam.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span>{exam.className} - Section {exam.classSection}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Progress</span>
                                        <span className={`font-bold ${getStatusColor(progress)}`}>
                                            {exam.gradedCount}/{exam.totalStudents} ({progress}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' :
                                                    progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                        Max: {exam.maxMarks} | Min: {exam.minMarks}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No exams assigned yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};
