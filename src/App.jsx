import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateSchedule from './pages/CreateSchedule.jsx'
import EditSchedule from './pages/EditSchedule.jsx'
import Schedule from './pages/Schedule.jsx'
import Assistant from './pages/Assistant.jsx'
import ViewSchedules from './pages/ViewSchedules.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-schedule" element={<CreateSchedule />} />
        <Route path="/edit-schedule/:id" element={<EditSchedule />} />
        <Route path="/schedule/:id" element={<Schedule />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/view-schedules" element={<ViewSchedules />} />
      </Routes>
    </>
  );
}

export default App;