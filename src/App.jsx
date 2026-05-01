import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { setupInterceptors } from './services/interceptors'
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute'

import ConnexionPage   from './pages/ConnexionPage'
import InscriptionPage from './pages/InscriptionPage'
import DashboardPage   from './pages/DashboardPage'

function AppRoutes() {
  const navigate = useNavigate()

  useEffect(() => {
    setupInterceptors(navigate)
  }, [navigate])

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/connexion" element={
        <PublicRoute><ConnexionPage /></PublicRoute>
      } />
      <Route path="/inscription" element={
        <PublicRoute><InscriptionPage /></PublicRoute>
      } />

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