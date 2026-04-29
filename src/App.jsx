import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { setupInterceptors } from './services/interceptors'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages (stubs pour l'instant)
import LoginPage      from './pages/LoginPage'
import InscriptionPage from './pages/InscriptionPage'
import DashboardPage  from './pages/DashboardPage'

function AppRoutes() {
  const navigate = useNavigate()

  useEffect(() => {
    setupInterceptors(navigate)
  }, [navigate])

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/inscription" element={<InscriptionPage />} />

      {/* Routes protégées */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* Redirect racine */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App