import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuthContext } from './store/AuthContext'
import { setupInterceptors } from './services/interceptors'
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute'

import ConnexionPage   from './pages/ConnexionPage'
import InscriptionPage from './pages/InscriptionPage'
import DashboardPage   from './pages/DashboardPage'

function AppRoutes() {
  const { logout, isLoading } = useAuthContext()

  useEffect(() => {
    setupInterceptors(logout)
  }, [logout])

  // Attendre la vérification du token avant de rendre quoi que ce soit
  if (isLoading) return null

  return (
    <Routes>
      <Route path="/connexion" element={
        <PublicRoute><ConnexionPage /></PublicRoute>
      } />
      <Route path="/inscription" element={
        <PublicRoute><InscriptionPage /></PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App