import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getPasswordStrength } from '../utils/passwordStrength'

const INITIAL_FORM = {
  prenom: '', nom: '', email: '', telephone: '',
  nom_boutique: '', mot_de_passe: '', confirmation_mdp: '',
}

const INITIAL_ERRORS = { ...INITIAL_FORM, global: '' }

function InscriptionPage() {
  const { inscription }       = useAuth()
  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState(INITIAL_ERRORS)
  const [loading, setLoading] = useState(false)
  const [showMdp, setShowMdp] = useState(false)

  const strength = getPasswordStrength(form.mot_de_passe)

  // ── Validation temps réel ─────────────────────────────────────────
  const validate = (name, value) => {
    switch (name) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? '' : 'Email invalide.'
      case 'mot_de_passe':
        return value.length >= 8
          ? '' : 'Minimum 8 caractères.'
      case 'confirmation_mdp':
        return value === form.mot_de_passe
          ? '' : 'Les mots de passe ne correspondent pas.'
      default:
        return value.trim() ? '' : 'Ce champ est requis.'
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Champs requis (pas telephone)
    if (name !== 'telephone') {
      setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    }

    // Re-valider confirmation si mdp change
    if (name === 'mot_de_passe' && form.confirmation_mdp) {
      setErrors(prev => ({
        ...prev,
        confirmation_mdp: form.confirmation_mdp === value
          ? '' : 'Les mots de passe ne correspondent pas.',
      }))
    }
  }

  const isFormValid = () => {
    return (
      form.prenom && form.nom && form.email && form.nom_boutique &&
      form.mot_de_passe && form.confirmation_mdp &&
      !errors.email && !errors.mot_de_passe && !errors.confirmation_mdp
    )
  }

  // ── Soumission ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors(INITIAL_ERRORS)

    try {
      await inscription({
        nom:             form.nom,
        prenom:          form.prenom,
        email:           form.email,
        telephone:       form.telephone,
        nom_boutique:    form.nom_boutique,
        mot_de_passe:    form.mot_de_passe,
        confirmation_mdp: form.confirmation_mdp,
      })
    } catch (err) {
      const data = err.response?.data

      if (data?.email)            setErrors(prev => ({ ...prev, email: data.email[0] }))
      if (data?.confirmation_mdp) setErrors(prev => ({ ...prev, confirmation_mdp: data.confirmation_mdp[0] }))
      if (data?.non_field_errors) setErrors(prev => ({ ...prev, global: data.non_field_errors[0] }))
      if (data?.detail)           setErrors(prev => ({ ...prev, global: data.detail }))

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
          <p style={styles.subtitle}>Créer votre boutique</p>
        </div>

        {/* Erreur globale */}
        {errors.global && (
          <div style={styles.alertError}>{errors.global}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Prénom + Nom */}
          <div style={styles.row}>
            <Field label="Prénom" name="prenom" value={form.prenom}
              onChange={handleChange} error={errors.prenom} />
            <Field label="Nom" name="nom" value={form.nom}
              onChange={handleChange} error={errors.nom} />
          </div>

          {/* Email */}
          <Field label="Email" name="email" type="email" value={form.email}
            onChange={handleChange} error={errors.email} />

          {/* Téléphone */}
          <Field label="Téléphone (optionnel)" name="telephone" type="tel"
            value={form.telephone} onChange={handleChange} required={false} />

          {/* Nom boutique */}
          <Field label="Nom de la boutique" name="nom_boutique"
            value={form.nom_boutique} onChange={handleChange} error={errors.nom_boutique} />

          {/* Mot de passe */}
          <div style={styles.fieldGroup}>
            <Field label="Mot de passe" name="mot_de_passe"
              type={showMdp ? 'text' : 'password'}
              value={form.mot_de_passe} onChange={handleChange} error={errors.mot_de_passe} />

            {/* Indicateur force */}
            {form.mot_de_passe && (
              <div style={styles.strengthWrapper}>
                <div style={styles.strengthBar}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      ...styles.strengthSegment,
                      backgroundColor: i <= strength.score ? strength.color : '#e5e7eb',
                    }} />
                  ))}
                </div>
                <span style={{ color: strength.color, fontSize: 12 }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <Field label="Confirmer le mot de passe" name="confirmation_mdp"
            type={showMdp ? 'text' : 'password'}
            value={form.confirmation_mdp} onChange={handleChange}
            error={errors.confirmation_mdp} />

          {/* Toggle affichage mdp */}
          <label style={styles.showMdp}>
            <input type="checkbox" checked={showMdp}
              onChange={() => setShowMdp(v => !v)} />
            {' '}Afficher les mots de passe
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
            {loading ? 'Création en cours...' : 'Créer ma boutique'}
          </button>

        </form>

        <p style={styles.loginLink}>
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>

      </div>
    </div>
  )
}

// ── Composant Field réutilisable ──────────────────────────────────────
function Field({ label, name, type = 'text', value, onChange, error, required = true }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          ...styles.input,
          borderColor: error ? '#ef4444' : '#d1d5db',
        }}
      />
      {error && <span style={styles.errorMsg}>{error}</span>}
    </div>
  )
}

// ── Styles inline ─────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f9fafb', padding: '24px 16px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: '40px 36px', width: '100%', maxWidth: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: { textAlign: 'center', marginBottom: 28 },
  title:  { fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: '#6b7280', marginTop: 4 },
  alertError: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 14,
  },
  row: { display: 'flex', gap: 12 },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #d1d5db', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  errorMsg: { color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' },
  strengthWrapper: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar: { display: 'flex', gap: 4, flex: 1 },
  strengthSegment: { height: 4, flex: 1, borderRadius: 2, transition: 'background-color 0.3s' },
  showMdp: { fontSize: 13, color: '#6b7280', cursor: 'pointer', marginBottom: 20, display: 'block' },
  btn: {
    width: '100%', padding: '12px', borderRadius: 8,
    backgroundColor: '#111827', color: '#fff',
    border: 'none', fontSize: 15, fontWeight: 600,
    marginTop: 8, transition: 'opacity 0.2s',
  },
  loginLink: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' },
}

export default InscriptionPage