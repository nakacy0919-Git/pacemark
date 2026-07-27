import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './pages/Settings';
import TeacherView from './pages/TeacherView';
import StudentView from './pages/StudentView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Settings />} />
        <Route path="/teacher" element={<TeacherView />} />
        <Route path="/student" element={<StudentView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;