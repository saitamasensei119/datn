import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";

// Admin Components
import AdminDashboard from "./pages/admin/AdminDashboard";
import Subjects from "./pages/admin/Subjects";
import Departments from "./pages/admin/Departments";
import Lecturers from "./pages/admin/Lecturers";
import Semesters from "./pages/admin/Semesters";
import Students from "./pages/admin/Students";

// Teacher Components
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherGrades from "./pages/teacher/TeacherGrades";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";

// Student Components
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentEnroll from "./pages/student/StudentEnroll";
import StudentMyCourses from "./pages/student/StudentMyCourses";
import StudentMyGrades from "./pages/student/StudentMyGrades";
import StudentTranscript from "./pages/student/StudentTranscript";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

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
