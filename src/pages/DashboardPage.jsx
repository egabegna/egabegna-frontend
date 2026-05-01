import { useAuthContext } from '../store/AuthContext'
import { useAuth } from '../hooks/useAuth'
import RoleGuard from '../components/layout/RoleGuard'

function DashboardPage() {
  const { role, nom_boutique } = useAuthContext()
  const { logout }             = useAuth()

  return (
    <div style={{ padding: 32 }}>
      <h1>Bienvenue — {nom_boutique}</h1>
      <p>Rôle : {role}</p>

      <RoleGuard roles={['proprietaire']}>
        <div style={{ marginTop: 16, padding: 12,
          backgroundColor: '#f0fdf4', borderRadius: 8 }}>
          Section visible uniquement pour le propriétaire
        </div>
      </RoleGuard>

      <button onClick={logout} style={{ marginTop: 24 }}>
        Se déconnecter
      </button>
    </div>
  )
}

export default DashboardPage