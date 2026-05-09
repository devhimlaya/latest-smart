import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import RegistrarLoginPage from './pages/RegistrarLoginPage'
import TeacherLayout from './layouts/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import ClassRecordsList from './pages/teacher/ClassRecordsList'
import ClassRecordView from './pages/teacher/ClassRecordView'
import MyAdvisory from './pages/teacher/MyAdvisory'
import StudentGradeProfile from './pages/teacher/StudentGradeProfile'
import Attendance from './pages/teacher/Attendance'
import AttendanceReports from './pages/teacher/AttendanceReports'
import RegistrarLayout from './layouts/RegistrarLayout'
import RegistrarDashboard from './pages/registrar/Dashboard'
import StudentRecords from './pages/registrar/StudentRecords'
import Enrollment from './pages/registrar/Enrollment'
import SchoolForms from './pages/registrar/SchoolForms'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import AuditLogs from './pages/admin/AuditLogs'
import GradingConfig from './pages/admin/GradingConfig'
import SystemSettings from './pages/admin/SystemSettings'
import TemplateManager from './pages/admin/TemplateManager'

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes - Login pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/login/registrar" element={<RegistrarLoginPage />} />
      
      {/* Teacher routes */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<ClassRecordsList />} />
        <Route path="records" element={<ClassRecordsList />} />
        <Route path="records/:classAssignmentId" element={<ClassRecordView />} />
        <Route path="advisory" element={<MyAdvisory />} />
        <Route path="advisory/student/:studentId" element={<StudentGradeProfile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance-reports" element={<AttendanceReports />} />
      </Route>

      {/* Registrar routes */}
      <Route path="/registrar" element={<RegistrarLayout />}>
        <Route index element={<RegistrarDashboard />} />
        <Route path="students" element={<StudentRecords />} />
        <Route path="enrollment" element={<Enrollment />} />
        <Route path="forms" element={<SchoolForms />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="grading" element={<GradingConfig />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="templates" element={<TemplateManager />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </ThemeProvider>
  )
}

export default App
