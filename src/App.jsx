import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import ClientsPage from './pages/ClientsPage'
import ServicesPage from './pages/ServicesPage'
import NewSchedulingPage from './pages/NewSchedulingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServicesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedulings/new"
          element={
            <ProtectedRoute>
              <NewSchedulingPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/schedule" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App