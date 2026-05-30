
import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Subjects from './pages/admin/Subjects'
import Departments from './pages/admin/Departments'
import Lecturers from './pages/admin/Lecturers'
import Semesters from './pages/admin/Semesters'
import Students from './pages/admin/Students'

function App() {


  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/departments" element={<Departments />} />
      <Route path="/subjects" element={<Subjects />} />
      <Route path="/semesters" element={<Semesters />} />
      <Route path="/lecturers" element={<Lecturers />} />
      <Route path="/students" element={<Students />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App
