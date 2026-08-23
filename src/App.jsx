import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'
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
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/schedulings/new" element={<NewSchedulingPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/schedule" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App