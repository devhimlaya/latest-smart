import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import TeacherLayout from './layouts/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import ClassRecordsList from './pages/teacher/ClassRecordsList'
import ClassRecordView from './pages/teacher/ClassRecordView'
import MyAdvisory from './pages/teacher/MyAdvisory'
import StudentGradeProfile from './pages/teacher/StudentGradeProfile'
import RegistrarLayout from './layouts/RegistrarLayout'
import RegistrarDashboard from './pages/registrar/Dashboard'
import StudentRecords from './pages/registrar/StudentRecords'
import Enrollment from './pages/registrar/Enrollment'
import SchoolForms from './pages/registrar/SchoolForms'
import PrintCenter from './pages/registrar/PrintCenter'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import AuditLogs from './pages/admin/AuditLogs'
import GradingConfig from './pages/admin/GradingConfig'
import SystemSettings from './pages/admin/SystemSettings'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Teacher routes */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<ClassRecordsList />} />
        <Route path="records" element={<ClassRecordsList />} />
        <Route path="records/:classAssignmentId" element={<ClassRecordView />} />
        <Route path="advisory" element={<MyAdvisory />} />
        <Route path="advisory/student/:studentId" element={<StudentGradeProfile />} />
      </Route>

      {/* Registrar routes */}
      <Route path="/registrar" element={<RegistrarLayout />}>
        <Route index element={<RegistrarDashboard />} />
        <Route path="students" element={<StudentRecords />} />
        <Route path="enrollment" element={<Enrollment />} />
        <Route path="forms" element={<SchoolForms />} />
        <Route path="print" element={<PrintCenter />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="grading" element={<GradingConfig />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
