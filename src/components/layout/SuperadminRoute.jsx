import { Navigate } from 'react-router-dom'
import { useSuperadmin } from '../../store/SuperadminContext'

function SuperadminRoute({ children }) {
  const { isAuthenticated } = useSuperadmin()
  if (!isAuthenticated) return <Navigate to="/superadmin/login" replace />
  return children
}

export default SuperadminRoute