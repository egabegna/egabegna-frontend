import { Navigate } from 'react-router-dom'
import authStore from '../../store/authStore'

export function ProtectedRoute({ children }) {
  const token = authStore.getAccessToken()
  if (!token) return <Navigate to="/connexion" replace />
  return children
}

export function PublicRoute({ children }) {
  const token = authStore.getAccessToken()
  if (token) return <Navigate to="/dashboard" replace />
  return children
}