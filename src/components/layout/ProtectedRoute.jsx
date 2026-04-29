import { Navigate } from 'react-router-dom'
import authStore from '../../store/authStore'

function ProtectedRoute({ children }) {
  const token = authStore.getAccessToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute