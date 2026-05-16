import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect }    from 'react'
import { AuthProvider, useAuthContext } from './store/AuthContext'
import { SuperadminProvider }           from './store/SuperadminContext'
import { setupInterceptors }            from './services/interceptors'
import { useAuth }                      from './hooks/useAuth'
import { usePushNotifications }         from './hooks/usePushNotifications'
import AppLayout                        from './components/layout/AppLayout'
import { ProtectedRoute, PublicRoute }  from './components/layout/ProtectedRoute'
import SuperadminRoute                  from './components/layout/SuperadminRoute'


// Pages auth
import ConnexionPage    from './pages/ConnexionPage'
import InscriptionPage  from './pages/InscriptionPage'
import InvitationPage   from './pages/InvitationPage'

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

// Pages superadmin
import SuperadminLoginPage          from './pages/superadmin/SuperadminLoginPage'
import SuperadminBoutiquesPage      from './pages/superadmin/SuperadminBoutiquesPage'
import SuperadminBoutiqueDetailPage from './pages/superadmin/SuperadminBoutiqueDetailPage'
import SuperadminStatsPage          from './pages/superadmin/SuperadminStatsPage'



// ── Wrapper routes protégées avec AppLayout ───
function ProtectedWithLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
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
      {/* ── Routes publiques ── */}
      <Route path="/connexion"   element={<PublicRoute><ConnexionPage /></PublicRoute>} />
      <Route path="/inscription" element={<PublicRoute><InscriptionPage /></PublicRoute>} />
      <Route path="/invitation/:token" element={<InvitationPage />} />
      

      {/* ── Routes protégées avec Sidebar ── */}
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
      <Route path="/choisir-boutique" element={<ChoisirBoutiquePage />} />

      {/* ── Routes superadmin — thème sombre inchangé ── */}
      <Route path="/superadmin/login"           element={<SuperadminLoginPage />} />
      <Route path="/superadmin/boutiques"       element={<SuperadminRoute><SuperadminBoutiquesPage /></SuperadminRoute>} />
      <Route path="/superadmin/boutiques/:id"   element={<SuperadminRoute><SuperadminBoutiqueDetailPage /></SuperadminRoute>} />
      <Route path="/superadmin/stats"           element={<SuperadminRoute><SuperadminStatsPage /></SuperadminRoute>} />

      {/* ── Redirect racine ── */}
      <Route path="/" element={<Navigate to="/connexion" replace />} />
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