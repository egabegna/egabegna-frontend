import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../store/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext()
  if (isLoading)       return null
  if (!isAuthenticated) return <Navigate to="/connexion" replace />
  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext()
  if (isLoading)      return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}