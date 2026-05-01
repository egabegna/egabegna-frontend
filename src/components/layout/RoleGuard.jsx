import { useAuthContext } from '../../store/AuthContext'

function RoleGuard({ roles = [], children, fallback = null }) {
  const { role } = useAuthContext()
  if (!roles.includes(role)) return fallback
  return children
}

export default RoleGuard