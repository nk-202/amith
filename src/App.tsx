import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { Academics } from './pages/admin/Academics';
import { HodDashboard } from './pages/hod/Dashboard';
import { MySchedule } from './pages/staff/MySchedule';
import { Attendance } from './pages/staff/Attendance';
import { MarksEntry } from './pages/staff/MarksEntry';
import { StudentDashboard } from './pages/student/Dashboard';
import { DeptOverview } from './pages/hod/DeptOverview';
import { FacultySearch } from './pages/hod/FacultySearch';
import { FacultyList } from './pages/admin/FacultyList';
import { StudentList } from './pages/admin/StudentList';
import { AdminTimetable } from './pages/admin/AdminTimetable';
import { Settings } from './pages/admin/Settings';
import { StaffDashboard } from './pages/staff/Dashboard';
import { ExamManagement } from './pages/admin/ExamManagement';
import { StaffExamGrades } from './pages/staff/ExamGrades';
import { Profile } from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<Layout />}>
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin/timetable" element={<AdminTimetable />} />
              <Route path="admin/exams" element={<ExamManagement />} />
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/faculty" element={<FacultyList />} />
              <Route path="admin/students" element={<StudentList />} />
              <Route path="admin/academics" element={<Academics />} />
              <Route path="admin/settings" element={<Settings />} />
              <Route path="admin/profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            {/* HOD Routes */}
            <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
              <Route path="hod" element={<HodDashboard />} />
              <Route path="hod/overview" element={<DeptOverview />} />
              <Route path="hod/faculty" element={<FacultySearch />} />
              <Route path="hod/profile" element={<Profile />} />
            </Route>

            {/* Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
              <Route path="staff" element={<StaffDashboard />} />
              <Route path="staff/dashboard" element={<StaffDashboard />} />
              <Route path="staff/schedule" element={<MySchedule />} />
              <Route path="staff/exam-grades" element={<StaffExamGrades />} />
              <Route path="staff/attendance" element={<Attendance />} />
              <Route path="staff/marks" element={<MarksEntry />} />
              <Route path="staff/profile" element={<Profile />} />
            </Route>

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="student" element={<StudentDashboard />} />
              <Route path="student/profile" element={<StudentDashboard />} />
              <Route path="student/settings" element={<Profile />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
