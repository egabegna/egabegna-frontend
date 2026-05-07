import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuthContext } from './store/AuthContext'
import { setupInterceptors } from './services/interceptors'
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute'

import ConnexionPage   from './pages/ConnexionPage'
import InscriptionPage from './pages/InscriptionPage'
import DashboardPage   from './pages/DashboardPage'
import EmployesPage from './pages/EmployesPage'
import InvitationPage from './pages/InvitationPage'
import ProduitsPage   from './pages/ProduitsPage'
import CategoriesPage from './pages/CategoriesPage'
import VentesPage from './pages/VentesPage'
import FournisseursPage from './pages/FournisseursPage'
import ReceptionsPage   from './pages/ReceptionsPage'
import AmbulantPage     from './pages/AmbulantPage'

import { SuperadminProvider } from './store/SuperadminContext'
import SuperadminRoute from './components/layout/SuperadminRoute'
import SuperadminLoginPage from './pages/superadmin/SuperadminLoginPage'
import SuperadminBoutiquesPage from './pages/superadmin/SuperadminBoutiquesPage'
import SuperadminBoutiqueDetailPage from './pages/superadmin/SuperadminBoutiqueDetailPage'

function AppRoutes() {
  const { logout, isLoading } = useAuthContext()

  useEffect(() => {
    setupInterceptors(logout)
  }, [logout])

  // Attendre la vérification du token avant de rendre quoi que ce soit
  if (isLoading) return null

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/connexion"   element={<PublicRoute><ConnexionPage /></PublicRoute>} />
      <Route path="/inscription" element={<PublicRoute><InscriptionPage /></PublicRoute>} />
      

      {/* Routes protégées */}
      <Route path="/invitation/:token" element={<InvitationPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/employes" element={<ProtectedRoute><EmployesPage /></ProtectedRoute>} />
      <Route path="/produits"   element={<ProtectedRoute><ProduitsPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
      <Route path="/ventes" element={<ProtectedRoute><VentesPage /></ProtectedRoute>} />
      <Route path="/fournisseurs" element={<ProtectedRoute><FournisseursPage /></ProtectedRoute>} />
      <Route path="/receptions"   element={<ProtectedRoute><ReceptionsPage /></ProtectedRoute>} />
      <Route path="/ambulant"     element={<ProtectedRoute><AmbulantPage /></ProtectedRoute>} />
      
      {/* Routes superadmin */}
      <Route path="/superadmin/login" element={<SuperadminLoginPage />} />
      <Route path="/superadmin/boutiques" element={
        <SuperadminRoute><SuperadminBoutiquesPage /></SuperadminRoute>
      } />
      <Route path="/superadmin/boutiques/:id" element={
        <SuperadminRoute><SuperadminBoutiqueDetailPage /></SuperadminRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SuperadminProvider>   {/* ← wrapper autour de AppRoutes */}
          <AppRoutes />
        </SuperadminProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App