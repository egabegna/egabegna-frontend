import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuthContext } from './store/AuthContext'
import { SuperadminProvider } from './store/SuperadminContext'
import { setupInterceptors } from './services/interceptors'
import { usePushNotifications } from './hooks/usePushNotifications'
import AppLayout from './components/layout/AppLayout'
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute'
import SuperadminRoute from './components/layout/SuperadminRoute'

// Pages auth
import ConnexionPage    from './pages/ConnexionPage'
import InscriptionPage  from './pages/InscriptionPage'
import InvitationPage   from './pages/InvitationPage'
import DeuxFacteursLoginPage from './pages/DeuxFacteursLoginPage'
import MotDePasseOubliePage from './pages/MotDePasseOubliePage'
import ResetPasswordPage    from './pages/ResetPasswordPage'

// Pages app
import DashboardPage    from './pages/DashboardPage'
import VentesPage       from './pages/VentesPage'
import ProduitsPage     from './pages/ProduitsPage'
import CategoriesPage   from './pages/CategoriesPage'
import EmployesPage     from './pages/EmployesPage'
import FournisseursPage from './pages/FournisseursPage'
import ReceptionsPage   from './pages/ReceptionsPage'
import AmbulantPage     from './pages/AmbulantPage'
import FinancesPage     from './pages/FinancesPage'
import ChoisirBoutiquePage from './pages/ChoisirBoutiquePage'
import RapportsPage     from './pages/RapportsPage'
import SignalementsPage from './pages/SignalementsPage'
import ParametresPage   from './pages/ParametresPage'
import ProfilPage        from './pages/ProfilPage'
import ConfirmerEmailPage from './pages/ConfirmerEmailPage'

// Pages superadmin
import SuperadminLoginPage          from './pages/superadmin/SuperadminLoginPage'
import SuperadminBoutiquesPage      from './pages/superadmin/SuperadminBoutiquesPage'
import SuperadminBoutiqueDetailPage from './pages/superadmin/SuperadminBoutiqueDetailPage'


function ProtectedWithLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}


function AppRoutes() {
  const { logout, isLoading } = useAuthContext()
  usePushNotifications()

  useEffect(() => {
    setupInterceptors(logout)
  }, [logout])

  if (isLoading) return null

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/connexion"   element={<PublicRoute><ConnexionPage /></PublicRoute>} />
      <Route path="/inscription" element={<PublicRoute><InscriptionPage /></PublicRoute>} />
      <Route path="/invitation/:token" element={<InvitationPage />} />
      <Route path="/2fa-login" element={<DeuxFacteursLoginPage />} />
      <Route path="/mot-de-passe-oublie"   element={<MotDePasseOubliePage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/choisir-boutique" element={<ChoisirBoutiquePage />} />
      <Route path="/confirmer-email/:token" element={<ConfirmerEmailPage />} />


      {/* Routes protégées avec Sidebar */}
      <Route path="/dashboard"    element={<ProtectedWithLayout><DashboardPage /></ProtectedWithLayout>} />
      <Route path="/ventes"       element={<ProtectedWithLayout><VentesPage /></ProtectedWithLayout>} />
      <Route path="/produits"     element={<ProtectedWithLayout><ProduitsPage /></ProtectedWithLayout>} />
      <Route path="/categories"   element={<ProtectedWithLayout><CategoriesPage /></ProtectedWithLayout>} />
      <Route path="/employes"     element={<ProtectedWithLayout><EmployesPage /></ProtectedWithLayout>} />
      <Route path="/fournisseurs" element={<ProtectedWithLayout><FournisseursPage /></ProtectedWithLayout>} />
      <Route path="/receptions"   element={<ProtectedWithLayout><ReceptionsPage /></ProtectedWithLayout>} />
      <Route path="/ambulant"     element={<ProtectedWithLayout><AmbulantPage /></ProtectedWithLayout>} />
      <Route path="/finances"     element={<ProtectedWithLayout><FinancesPage /></ProtectedWithLayout>} />
      <Route path="/rapports"     element={<ProtectedWithLayout><RapportsPage /></ProtectedWithLayout>} />
      <Route path="/signalements" element={<ProtectedWithLayout><SignalementsPage /></ProtectedWithLayout>} />
      <Route path="/parametres"   element={<ProtectedWithLayout><ParametresPage /></ProtectedWithLayout>} />
      <Route path="/profil" element={<ProtectedWithLayout><ProfilPage /></ProtectedWithLayout>} />


      {/* Routes superadmin */}
      <Route path="/superadmin/login"         element={<SuperadminLoginPage />} />
      <Route path="/superadmin/boutiques"     element={<SuperadminRoute><SuperadminBoutiquesPage /></SuperadminRoute>} />
      <Route path="/superadmin/boutiques/:id" element={<SuperadminRoute><SuperadminBoutiqueDetailPage /></SuperadminRoute>} />

      {/* Redirect racine */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SuperadminProvider>
          <AppRoutes />
        </SuperadminProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App