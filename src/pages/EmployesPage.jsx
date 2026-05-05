import { useState, useEffect, useCallback } from 'react'
import employeService from '../services/employeService'

const ROLES = [
  { value: 'manager',  label: 'Manager'  },
  { value: 'vendeur',  label: 'Vendeur'  },
  { value: 'ambulant', label: 'Ambulant' },
]

const INITIAL_FORM = {
  prenom: '', nom: '', email: '',
  telephone: '', role: 'vendeur',
}

// ─────────────────────────────────────────────
function EmployesPage() {
  const [employes, setEmployes]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(INITIAL_FORM)
  const [errors, setErrors]             = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [successMsg, setSuccessMsg]     = useState('')
  const [globalError, setGlobalError]   = useState('')
  const [renvoyant, setRenvoyant]       = useState(null)  // id en cours

  // ── Charger la liste ───────────────────────
  const chargerEmployes = useCallback(async () => {
    try {
      const res = await employeService.liste()
      setEmployes(res.data)
    } catch {
      setGlobalError('Erreur lors du chargement des employés.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { chargerEmployes() }, [chargerEmployes])

  // ── Validation ─────────────────────────────
  const valider = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email obligatoire.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format email invalide.'
    }
    if (['prenom', 'nom'].includes(name) && !value.trim()) return 'Ce champ est requis.'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name !== 'telephone') {
      setErrors(prev => ({ ...prev, [name]: valider(name, value) }))
    }
    setSuccessMsg('')
    setGlobalError('')
  }

  const isFormValid = () =>
    form.prenom && form.nom && form.email &&
    !errors.prenom && !errors.nom && !errors.email

  // ── Créer employé ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setGlobalError('')

    try {
      await employeService.creer({
        prenom:    form.prenom,
        nom:       form.nom,
        email:     form.email,
        telephone: form.telephone,
        role:      form.role,
      })

      setSuccessMsg(`Invitation envoyée à ${form.email}.`)
      setForm(INITIAL_FORM)
      setErrors({})
      setShowForm(false)
      await chargerEmployes()   // rafraîchir la liste

    } catch (err) {
      const data = err.response?.data
      if (data?.email)  setErrors(prev => ({ ...prev, email: data.email[0] }))
      else setGlobalError(data?.detail || 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Renvoyer invitation ────────────────────
  const handleRenvoyer = async (employe) => {
    setRenvoyant(employe.id)
    setSuccessMsg('')
    setGlobalError('')

    try {
      await employeService.renvoyerInvitation(employe.id)
      setSuccessMsg(`Invitation renvoyée à ${employe.email}.`)
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erreur lors du renvoi.')
    } finally {
      setRenvoyant(null)
    }
  }

  // ─────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employés</h1>
          <p style={styles.subtitle}>{employes.length} membre(s) dans votre boutique</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setSuccessMsg(''); setGlobalError('') }}
          style={styles.btnPrimary}>
          {showForm ? 'Annuler' : '+ Ajouter un employé'}
        </button>
      </div>

      {/* Messages */}
      {successMsg  && <div style={styles.alertSuccess}>{successMsg}</div>}
      {globalError && <div style={styles.alertError}>{globalError}</div>}

      {/* Formulaire création */}
      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Nouvel employé</h2>
          <form onSubmit={handleSubmit} noValidate>

            <div style={styles.row}>
              <Field label="Prénom *" name="prenom" value={form.prenom}
                onChange={handleChange} error={errors.prenom} />
              <Field label="Nom *" name="nom" value={form.nom}
                onChange={handleChange} error={errors.nom} />
            </div>

            <Field label="Email *" name="email" type="email"
              value={form.email} onChange={handleChange} error={errors.email} />

            <Field label="Téléphone (optionnel)" name="telephone" type="tel"
              value={form.telephone} onChange={handleChange} required={false} />

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Rôle *</label>
              <select name="role" value={form.role}
                onChange={handleChange} style={styles.select}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.formActions}>
              <button type="submit"
                disabled={submitting || !isFormValid()}
                style={{
                  ...styles.btnPrimary,
                  opacity: (submitting || !isFormValid()) ? 0.6 : 1,
                  cursor:  (submitting || !isFormValid()) ? 'not-allowed' : 'pointer',
                }}>
                {submitting ? 'Envoi en cours...' : 'Créer et envoyer l\'invitation'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Liste employés */}
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : employes.length === 0 ? (
        <div style={styles.empty}>
          <p>Aucun employé pour l'instant.</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Ajoutez votre premier employé en cliquant sur le bouton ci-dessus.
          </p>
        </div>
      ) : (
        <div style={styles.liste}>
          {employes.map(e => (
            <EmployeCard
              key={e.id}
              employe={e}
              renvoyant={renvoyant === e.id}
              onRenvoyer={() => handleRenvoyer(e)}
            />
          ))}
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
function EmployeCard({ employe, renvoyant, onRenvoyer }) {
  const enAttente = !employe.actif

  return (
    <div style={{
      ...styles.card,
      borderLeft: `4px solid ${enAttente ? '#f59e0b' : '#22c55e'}`,
    }}>
      <div style={styles.cardMain}>

        {/* Infos */}
        <div style={styles.cardInfo}>
          <div style={styles.cardNom}>{employe.nom_complet}</div>
          <div style={styles.cardEmail}>{employe.email}</div>
          <div style={styles.cardMeta}>
            <RoleBadge role={employe.role} />
            {enAttente
              ? <StatutBadge label="En attente" color="#92400e" bg="#fef3c7" />
              : <StatutBadge label="Actif"      color="#14532d" bg="#dcfce7" />
            }
          </div>
        </div>

        {/* Actions */}
        <div style={styles.cardActions}>
          {enAttente && (
            <button
              onClick={onRenvoyer}
              disabled={renvoyant}
              style={{
                ...styles.btnRenvoyer,
                opacity: renvoyant ? 0.6 : 1,
                cursor:  renvoyant ? 'not-allowed' : 'pointer',
              }}>
              {renvoyant ? 'Envoi...' : '↻ Renvoyer invitation'}
            </button>
          )}
        </div>

      </div>

      {/* Téléphone */}
      {employe.telephone && (
        <div style={styles.cardTel}>📞 {employe.telephone}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
function Field({ label, name, type = 'text', value, onChange, error, required = true }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange}
        required={required}
        style={{ ...styles.input, borderColor: error ? '#ef4444' : '#d1d5db' }} />
      {error && <span style={styles.errorMsg}>{error}</span>}
    </div>
  )
}

function RoleBadge({ role }) {
  const colors = {
    proprietaire: { bg: '#ede9fe', color: '#5b21b6' },
    manager:      { bg: '#dbeafe', color: '#1e40af' },
    vendeur:      { bg: '#f0fdf4', color: '#166534' },
    ambulant:     { bg: '#fff7ed', color: '#9a3412' },
  }
  const c = colors[role] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.color }}>
      {role}
    </span>
  )
}

function StatutBadge({ label, color, bg }) {
  return (
    <span style={{ ...styles.badge, backgroundColor: bg, color }}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
const styles = {
  page:    { padding: '32px 24px', maxWidth: 800, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between',
             alignItems: 'flex-start', marginBottom: 24 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },

  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                  color: '#15803d', borderRadius: 8, padding: '12px 16px',
                  marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  color: '#dc2626', borderRadius: 8, padding: '12px 16px',
                  marginBottom: 16, fontSize: 14 },

  formCard:    { backgroundColor: '#fff', border: '1px solid #e5e7eb',
                 borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle:   { fontSize: 16, fontWeight: 600, marginBottom: 20 },
  formActions: { marginTop: 8 },

  row:        { display: 'flex', gap: 12 },
  fieldGroup: { marginBottom: 16, flex: 1 },
  label:      { display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #d1d5db', fontSize: 14,
                boxSizing: 'border-box', outline: 'none' },
  select:     { width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1.5px solid #d1d5db', fontSize: 14,
                boxSizing: 'border-box', backgroundColor: '#fff' },
  errorMsg:   { color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' },

  btnPrimary: { backgroundColor: '#111827', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer' },

  loading: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  empty:   { textAlign: 'center', color: '#6b7280', padding: 48,
             backgroundColor: '#f9fafb', borderRadius: 12 },

  liste:      { display: 'flex', flexDirection: 'column', gap: 12 },
  card:       { backgroundColor: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 10, padding: '16px 20px' },
  cardMain:   { display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12 },
  cardInfo:   { flex: 1 },
  cardNom:    { fontSize: 15, fontWeight: 600, marginBottom: 2 },
  cardEmail:  { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardMeta:   { display: 'flex', gap: 8, flexWrap: 'wrap' },
  cardActions: { flexShrink: 0 },
  cardTel:    { fontSize: 12, color: '#9ca3af', marginTop: 10 },

  badge:      { padding: '3px 10px', borderRadius: 12, fontSize: 12,
                fontWeight: 600, display: 'inline-block' },

  btnRenvoyer: { backgroundColor: '#fef3c7', color: '#92400e',
                 border: '1px solid #fde68a', padding: '7px 14px',
                 borderRadius: 8, fontSize: 13, fontWeight: 600,
                 transition: 'opacity 0.2s' },
}

export default EmployesPage