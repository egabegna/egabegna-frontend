import { useState, useEffect, useCallback } from 'react'
import employeService from '../services/employeService'
import {
  Plus, X, Users, Phone, Mail,
  RefreshCw, UserCheck, Clock, ShieldOff, ShieldCheck, Search,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'

const ROLES = [
  { value: 'manager',  label: 'Manager'  },
  { value: 'vendeur',  label: 'Vendeur'  },
  { value: 'ambulant', label: 'Ambulant' },
]

const INITIAL_FORM = {
  prenom: '', nom: '', email: '',
  telephone: '', role: 'vendeur',
}

const ROLE_CONFIG = {
  proprietaire: { bg: '#EEE9F8', color: '#5b21b6' },
  manager:      { bg: '#EEF1F8', color: NAVY       },
  vendeur:      { bg: '#EBF5EF', color: GREEN      },
  ambulant:     { bg: '#FEF8EC', color: '#9a3412'  },
}

// ─── Champ formulaire ─────────────────────────
function Field({ label, name, type = 'text', value, onChange, error, required = true }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <input
        name={name} type={type} value={value}
        onChange={onChange} required={required}
        style={{ ...s.input, borderColor: error ? '#c0392b' : BORDER }}
      />
      {error && <span style={s.errorMsg}>{error}</span>}
    </div>
  )
}

// ─── Badge rôle ───────────────────────────────
function RoleBadge({ role }) {
  const c = ROLE_CONFIG[role] || { bg: BG, color: NAVY }
  return <span style={{ ...s.badge, background: c.bg, color: c.color }}>{role}</span>
}

// ─── Badge statut ─────────────────────────────
function StatutBadge({ employe }) {
  if (employe.bloque)
    return (
      <span style={{ ...s.badge, background: '#FEF1F1', color: '#c0392b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <ShieldOff size={10} strokeWidth={2} /> Bloqué
      </span>
    )
  if (employe.actif)
    return (
      <span style={{ ...s.badge, background: '#EBF5EF', color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <UserCheck size={10} strokeWidth={2} /> Actif
      </span>
    )
  return (
    <span style={{ ...s.badge, background: '#FBF5E9', color: GOLD, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Clock size={10} strokeWidth={2} /> En attente
    </span>
  )
}

// ─── Page principale ──────────────────────────
function EmployesPage() {
  const [employes, setEmployes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(INITIAL_FORM)
  const [errors, setErrors]           = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [successMsg, setSuccessMsg]   = useState('')
  const [globalError, setGlobalError] = useState('')
  const [renvoyant, setRenvoyant]     = useState(null)
  const [desactivant, setDesactivant] = useState(null)
  const [activant, setActivant]       = useState(null)
  const [search, setSearch]           = useState('')

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

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 3500)
    return () => clearTimeout(t)
  }, [successMsg])

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
    if (name !== 'telephone') setErrors(prev => ({ ...prev, [name]: valider(name, value) }))
    setSuccessMsg('')
    setGlobalError('')
  }

  const isFormValid = () =>
    form.prenom && form.nom && form.email &&
    !errors.prenom && !errors.nom && !errors.email

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setGlobalError('')
    try {
      await employeService.creer({
        prenom: form.prenom, nom: form.nom, email: form.email,
        telephone: form.telephone, role: form.role,
      })
      setSuccessMsg(`Invitation envoyée à ${form.email}.`)
      setForm(INITIAL_FORM)
      setErrors({})
      setShowForm(false)
      await chargerEmployes()
    } catch (err) {
      const data = err.response?.data
      if (data?.email) setErrors(prev => ({ ...prev, email: data.email[0] }))
      else setGlobalError(data?.detail || 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRenvoyer = async (employe) => {
    setRenvoyant(employe.id)
    setSuccessMsg('')
    setGlobalError('')
    try {
      await employeService.renvoyerInvitation(employe.id)
      setSuccessMsg(`Invitation renvoyée à ${employe.email}.`)
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erreur lors du renvoi.')
    } finally { setRenvoyant(null) }
  }

  const handleDesactiver = async (employe) => {
    if (!window.confirm(`Bloquer ${employe.nom_complet} ?`)) return
    setDesactivant(employe.id)
    setSuccessMsg('')
    setGlobalError('')
    try {
      await employeService.desactiver(employe.id)
      setSuccessMsg(`${employe.nom_complet} a été bloqué.`)
      await chargerEmployes()
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erreur.')
    } finally { setDesactivant(null) }
  }

  const handleActiver = async (employe) => {
    if (!window.confirm(`Réactiver ${employe.nom_complet} ?`)) return
    setActivant(employe.id)
    setSuccessMsg('')
    setGlobalError('')
    try {
      await employeService.activer(employe.id)
      setSuccessMsg(`${employe.nom_complet} a été réactivé.`)
      await chargerEmployes()
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erreur.')
    } finally { setActivant(null) }
  }

  // Filtrage local par recherche
  const filtered = employes.filter(e => {
    const q = search.toLowerCase()
    return (
      e.nom_complet?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q) ||
      e.telephone?.toLowerCase().includes(q)
    )
  })

  const actifs    = employes.filter(e => e.actif && !e.bloque)
  const enAttente = employes.filter(e => !e.actif && !e.bloque)
  const bloques   = employes.filter(e => e.bloque)

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Gestion</p>
          <h1 style={s.title}>Employés</h1>
          <div style={s.titleUnderline} />
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setSuccessMsg(''); setGlobalError('') }}
          style={showForm ? s.btnSecondary : s.btnPrimary}
        >
          {showForm
            ? <><X size={15} strokeWidth={2.5} /><span>Annuler</span></>
            : <><Plus size={15} strokeWidth={2.5} /><span>Ajouter un employé</span></>
          }
        </button>
      </div>

      {/* ── STATS ── */}
      <div style={s.statsRow}>
        {[
          { label: 'Actifs',     val: actifs.length,    Icon: UserCheck,  bg: '#EBF5EF', color: GREEN      },
          { label: 'En attente', val: enAttente.length, Icon: Clock,      bg: '#FBF5E9', color: GOLD       },
          { label: 'Bloqués',    val: bloques.length,   Icon: ShieldOff,  bg: '#FEF1F1', color: '#c0392b'  },
          { label: 'Total',      val: employes.length,  Icon: Users,      bg: '#EEF1F8', color: NAVY       },
        ].map(({ label, val, Icon, bg, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Icon size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      {successMsg  && <div style={s.alertSuccess}>{successMsg}</div>}
      {globalError && <div style={s.alertError}>{globalError}</div>}

      {/* ── FORMULAIRE ── */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <span style={s.formTitle}>Nouvel employé</span>
          </div>
          <div style={s.formDivider} />
          <form onSubmit={handleSubmit} noValidate>
            <div style={s.row}>
              <Field label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} error={errors.prenom} />
              <Field label="Nom *"    name="nom"    value={form.nom}    onChange={handleChange} error={errors.nom}    />
            </div>
            <Field label="Email *"               name="email"     type="email" value={form.email}     onChange={handleChange} error={errors.email} />
            <Field label="Téléphone (optionnel)" name="telephone" type="tel"   value={form.telephone} onChange={handleChange} required={false} />
            <div style={s.fieldGroup}>
              <label style={s.label}>Rôle *</label>
              <select name="role" value={form.role} onChange={handleChange} style={s.select}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={s.formActions}>
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                style={{ ...s.btnPrimary, opacity: (submitting || !isFormValid()) ? 0.5 : 1, cursor: (submitting || !isFormValid()) ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Envoi en cours...' : "Créer et envoyer l'invitation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TABLEAU ── */}
      <div style={s.tableCard}>

        {/* Barre de recherche */}
        <div style={s.tableToolbar}>
          <div style={s.searchWrap}>
            <Search size={14} color={MUTED} strokeWidth={1.8} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, rôle..."
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.clearBtn}>
                <X size={13} color={MUTED} strokeWidth={2} />
              </button>
            )}
          </div>
          <span style={s.resultCount}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <p style={s.loading}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Users size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucun employé pour l\'instant.'}
            </p>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Employé</th>
                <th style={s.th}>Contact</th>
                <th style={s.th}>Rôle</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const initiales = e.nom_complet
                  ? e.nom_complet.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  : '?'
                const isActif    = e.actif && !e.bloque
                const isBloque   = e.bloque
                const isAttente  = !e.actif && !e.bloque

                return (
                  <tr
                    key={e.id}
                    style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                    onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                    onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                  >
                    {/* Employé */}
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          ...s.avatar,
                          background: isBloque ? '#FEF1F1' : isActif ? '#EBF5EF' : '#FBF5E9',
                          color:      isBloque ? '#c0392b' : isActif ? GREEN : GOLD,
                        }}>
                          {initiales}
                        </div>
                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
                          {e.nom_complet}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={s.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ ...s.metaItem }}>
                          <Mail size={11} color={MUTED} strokeWidth={1.8} />
                          {e.email}
                        </span>
                        {e.telephone && (
                          <span style={{ ...s.metaItem }}>
                            <Phone size={11} color={MUTED} strokeWidth={1.8} />
                            {e.telephone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rôle */}
                    <td style={s.td}>
                      <RoleBadge role={e.role} />
                    </td>

                    {/* Statut */}
                    <td style={s.td}>
                      <StatutBadge employe={e} />
                    </td>

                    {/* Actions */}
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {isAttente && (
                          <button
                            onClick={() => handleRenvoyer(e)}
                            disabled={renvoyant === e.id}
                            style={{ ...s.btnAction, background: '#FBF5E9', color: GOLD, border: `1px solid #E8D5A3`, opacity: renvoyant === e.id ? 0.6 : 1 }}
                          >
                            <RefreshCw size={12} strokeWidth={2} />
                            <span>{renvoyant === e.id ? 'Envoi...' : 'Renvoyer'}</span>
                          </button>
                        )}
                        {isActif && (
                          <button
                            onClick={() => handleDesactiver(e)}
                            disabled={desactivant === e.id}
                            style={{ ...s.btnAction, background: '#FEF1F1', color: '#c0392b', border: '1px solid #FBBCBC', opacity: desactivant === e.id ? 0.6 : 1 }}
                          >
                            <ShieldOff size={12} strokeWidth={2} />
                            <span>{desactivant === e.id ? '...' : 'Bloquer'}</span>
                          </button>
                        )}
                        {isBloque && (
                          <button
                            onClick={() => handleActiver(e)}
                            disabled={activant === e.id}
                            style={{ ...s.btnAction, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, opacity: activant === e.id ? 0.6 : 1 }}
                          >
                            <ShieldCheck size={12} strokeWidth={2} />
                            <span>{activant === e.id ? '...' : 'Réactiver'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────
const s = {
  page:    { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },

  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  btnPrimary:  { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ display: 'flex', alignItems: 'center', gap: 8, background: BG,   color: NAVY,  border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },

  statsRow: { display: 'flex', gap: 12, marginBottom: 24 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:  { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:{ fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },

  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:   { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },

  formCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:  { marginBottom: 14 },
  formTitle:   { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider: { height: 1, background: BORDER, marginBottom: 18 },
  formActions: { marginTop: 8 },

  row:        { display: 'flex', gap: 12 },
  fieldGroup: { marginBottom: 16, flex: 1 },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:      { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  select:     { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', background: WHITE },
  errorMsg:   { color: '#c0392b', fontSize: 11, marginTop: 4, display: 'block' },

  tableCard:    { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  tableToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  searchWrap:   { display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '8px 14px', minWidth: 280 },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', flex: 1 },
  clearBtn:     { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  resultCount:  { fontSize: 12, color: MUTED, fontWeight: 500 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th:    { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  tr:    { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:    { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },

  avatar:   { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', flexShrink: 0 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED },
  badge:    { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  btnAction: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },

  loading: { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:   { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default EmployesPage