import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import TeacherLayout from "./components/TeacherLayout";
import StudentLayout from "./components/StudentLayout";

// Admin Components
import AdminDashboard from "./pages/admin/AdminDashboard";
import Subjects from "./pages/admin/Subjects";
import Departments from "./pages/admin/Departments";
import Lecturers from "./pages/admin/Lecturers";
import Semesters from "./pages/admin/Semesters";
import Students from "./pages/admin/Students";
import Courses from "./pages/admin/Courses";
import Infrastructure from "./pages/admin/Infrastructure";

// Teacher Components
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherGrades from "./pages/teacher/TeacherGrades";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";

// Student Components
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentEnroll from "./pages/student/StudentEnroll";
import StudentMyCourses from "./pages/student/StudentMyCourses";
import StudentCourseDetails from "./pages/student/StudentCourseDetails";
import StudentMyGrades from "./pages/student/StudentMyGrades";
import StudentTranscript from "./pages/student/StudentTranscript";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentPreRegistration from "./pages/student/StudentPreRegistration";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Profile Routes */}
      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherLayout>
              <ProfilePage />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
              <ProfilePage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Departments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Subjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/semesters"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Semesters />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/lecturers"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Lecturers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/infrastructure"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Infrastructure />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute requiredRole="TEACHER">
            <TeacherAttendance />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/enroll"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentEnroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-courses"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentMyCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-courses/:id"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentCourseDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-grades"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentMyGrades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/transcript"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentTranscript />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/pre-registration"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentPreRegistration />
          </ProtectedRoute>
        }
      />

      {/* Fallback Routes (for backward compatibility) */}
      <Route
        path="/departments"
        element={<Navigate to="/admin/departments" replace />}
      />
      <Route
        path="/subjects"
        element={<Navigate to="/admin/subjects" replace />}
      />
      <Route
        path="/semesters"
        element={<Navigate to="/admin/semesters" replace />}
      />
      <Route
        path="/lecturers"
        element={<Navigate to="/admin/lecturers" replace />}
      />
      <Route
        path="/students"
        element={<Navigate to="/admin/students" replace />}
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
