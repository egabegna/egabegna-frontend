import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const INITIAL_FORM   = { email: '', mot_de_passe: '' }
const INITIAL_ERRORS = { email: '', mot_de_passe: '', global: '' }

function ConnexionPage() {
  const { login }             = useAuth()
  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState(INITIAL_ERRORS)
  const [loading, setLoading] = useState(false)
  const [showMdp, setShowMdp] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '', global: '' }))
  }

  const isFormValid = () => form.email.trim() && form.mot_de_passe.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors(INITIAL_ERRORS)

    try {
      await login({
        email:        form.email.trim(),
        mot_de_passe: form.mot_de_passe,
      })
    } catch (err) {
      const data = err.response?.data

      // 401 générique — ne pas révéler si l'email existe
      const message =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        'Email ou mot de passe incorrect.'

      setErrors(prev => ({ ...prev, global: message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Egabégna</h1>
          <p style={styles.subtitle}>Connexion à votre boutique</p>
        </div>

        {/* Erreur globale */}
        {errors.global && (
          <div style={styles.alertError}>{errors.global}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              style={styles.input}
              autoComplete="email"
            />
          </div>

          {/* Mot de passe */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              name="mot_de_passe"
              type={showMdp ? 'text' : 'password'}
              value={form.mot_de_passe}
              onChange={handleChange}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {/* Toggle mdp */}
          <label style={styles.showMdp}>
            <input
              type="checkbox"
              checked={showMdp}
              onChange={() => setShowMdp(v => !v)}
            />
            {' '}Afficher le mot de passe
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            style={{
              ...styles.btn,
              opacity: (loading || !isFormValid()) ? 0.6 : 1,
              cursor:  (loading || !isFormValid()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

        </form>

        <p style={styles.registerLink}>
          Pas encore de compte ?{' '}
          <Link to="/inscription">S'inscrire</Link>
        </p>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f9fafb', padding: '24px 16px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: '40px 36px', width: '100%', maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header:   { textAlign: 'center', marginBottom: 28 },
  title:    { fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: '#6b7280', marginTop: 4 },
  alertError: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 14,
  },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  },
  showMdp: {
    fontSize: 13, color: '#6b7280',
    cursor: 'pointer', marginBottom: 20, display: 'block',
  },
  btn: {
    width: '100%', padding: '12px', borderRadius: 8,
    backgroundColor: '#111827', color: '#fff',
    border: 'none', fontSize: 15, fontWeight: 600,
    marginTop: 8, transition: 'opacity 0.2s',
  },
  registerLink: {
    textAlign: 'center', marginTop: 20,
    fontSize: 14, color: '#6b7280',
  },
}

export default ConnexionPage