import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import InterviewConfigurator from './pages/InterviewConfigurator'
import Interview from './pages/Interview'
import Results from './pages/Results'

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/interview-configurator" element={<InterviewConfigurator />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}
