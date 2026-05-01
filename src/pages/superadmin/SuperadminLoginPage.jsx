import { useState } from 'react'
import { useSuperadmin } from '../../store/SuperadminContext'
import superadminService from '../../services/superadminService'

function SuperadminLoginPage() {
  const { saLogin }           = useSuperadmin()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await superadminService.login(form.username, form.password)
      saLogin(res.data.access, res.data.refresh)
    } catch {
      setError('Identifiants incorrects ou accès non autorisé.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>SUPERADMIN</span>
          <h1 style={styles.title}>Egabégna</h1>
          <p style={styles.subtitle}>Interface d'administration</p>
        </div>

        {error && <div style={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input name="username" value={form.username}
              onChange={handleChange} style={styles.input}
              autoComplete="username" />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input name="password" type="password" value={form.password}
              onChange={handleChange} style={styles.input}
              autoComplete="current-password" />
          </div>

          <button type="submit" disabled={loading || !form.username || !form.password}
            style={{
              ...styles.btn,
              opacity: (loading || !form.username || !form.password) ? 0.6 : 1,
              cursor: (loading || !form.username || !form.password) ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'Connexion...' : 'Accéder au panneau'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#0f172a', padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: '40px 36px',
    width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  header: { textAlign: 'center', marginBottom: 28 },
  badge: { backgroundColor: '#7c3aed', color: '#fff', fontSize: 11,
    fontWeight: 700, letterSpacing: 2, padding: '4px 10px',
    borderRadius: 4, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '12px 0 4px' },
  subtitle: { color: '#94a3b8', fontSize: 14 },
  alertError: { backgroundColor: '#450a0a', border: '1px solid #991b1b',
    color: '#fca5a5', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 14 },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 500,
    marginBottom: 6, color: '#cbd5e1' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #334155', backgroundColor: '#0f172a',
    color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: 12, borderRadius: 8,
    backgroundColor: '#7c3aed', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 600, marginTop: 8 },
}

export default SuperadminLoginPage