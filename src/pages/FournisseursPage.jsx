import { useState, useEffect } from 'react'
import fournisseurService from '../services/fournisseurService'
import {
  Plus, X, Truck, Phone, Mail, MapPin,
  ShoppingCart, Pencil, Trash2, Search,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'

const FORM_INIT = { nom: '', telephone: '', adresse: '', email: '' }

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

function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [form, setForm]                 = useState(FORM_INIT)
  const [errors, setErrors]             = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [msg, setMsg]                   = useState({ type: '', text: '' })
  const [search, setSearch]             = useState('')
  const [deletingId, setDeletingId]     = useState(null)

  const charger = async () => {
    try {
      const res = await fournisseurService.liste()
      setFournisseurs(res.data)
    } catch {
      setMsg({ type: 'error', text: 'Erreur de chargement.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  useEffect(() => {
    if (!msg.text) return
    const t = setTimeout(() => setMsg({ type: '', text: '' }), 3500)
    return () => clearTimeout(t)
  }, [msg.text])

  const ouvrirForm = (item = null) => {
    setEditItem(item)
    setForm(item
      ? { nom: item.nom, telephone: item.telephone, adresse: item.adresse, email: item.email }
      : FORM_INIT
    )
    setErrors({})
    setShowForm(true)
    setMsg({ type: '', text: '' })
  }

  const fermerForm = () => {
    setShowForm(false)
    setEditItem(null)
    setErrors({})
  }

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
    setMsg({ type: '', text: '' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setErrors({ nom: 'Nom requis.' }); return }
    setSubmitting(true)
    try {
      if (editItem) await fournisseurService.modifier(editItem.id, form)
      else          await fournisseurService.creer(form)
      setMsg({ type: 'success', text: editItem ? 'Fournisseur modifié.' : 'Fournisseur créé.' })
      fermerForm()
      await charger()
    } catch (err) {
      const d = err.response?.data
      if (d?.nom) setErrors({ nom: d.nom[0] })
      else        setErrors({ global: d?.detail || 'Erreur.' })
    } finally { setSubmitting(false) }
  }

  const handleDesactiver = async (f) => {
    if (!window.confirm(`Désactiver «${f.nom}» ?`)) return
    setDeletingId(f.id)
    try {
      await fournisseurService.desactiver(f.id)
      setMsg({ type: 'success', text: `«${f.nom}» a été désactivé.` })
      await charger()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur.' })
    } finally { setDeletingId(null) }
  }

  const filtered = fournisseurs.filter(f => {
    const q = search.toLowerCase()
    return (
      f.nom?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.telephone?.toLowerCase().includes(q) ||
      f.adresse?.toLowerCase().includes(q)
    )
  })

  const totalAchats = fournisseurs.reduce((acc, f) => acc + Number(f.total_achats || 0), 0)

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Gestion</p>
          <h1 style={s.title}>Fournisseurs</h1>
          <div style={s.titleUnderline} />
        </div>
        <button
          onClick={() => showForm ? fermerForm() : ouvrirForm()}
          style={showForm ? s.btnSecondary : s.btnPrimary}
        >
          {showForm
            ? <><X size={15} strokeWidth={2.5} /><span>Annuler</span></>
            : <><Plus size={15} strokeWidth={2.5} /><span>Nouveau fournisseur</span></>
          }
        </button>
      </div>

      {/* STATS */}
      <div style={s.statsRow}>
        {[
          { label: 'Total fournisseurs', val: fournisseurs.length,                                Icon: Truck,        bg: '#EEF1F8', color: NAVY  },
          { label: 'Total achats',       val: `${Number(totalAchats).toLocaleString()} FCFA`,    Icon: ShoppingCart, bg: '#EBF5EF', color: GREEN },
          { label: 'Résultats filtrés',  val: filtered.length,                                   Icon: Search,       bg: '#FBF5E9', color: GOLD  },
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

      {/* MESSAGES */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* FORMULAIRE */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <span style={s.formTitle}>{editItem ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</span>
          </div>
          <div style={s.formDivider} />
          <form onSubmit={handleSubmit} noValidate>
            <div style={s.row}>
              <Field label="Nom *"     name="nom"       value={form.nom}       onChange={handleChange} error={errors.nom} />
              <Field label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} type="tel" required={false} />
            </div>
            <div style={s.row}>
              <Field label="Email"   name="email"   value={form.email}   onChange={handleChange} type="email" required={false} />
              <Field label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} required={false} />
            </div>
            {errors.global && <p style={{ color: '#c0392b', fontSize: 12, marginBottom: 12 }}>{errors.global}</p>}
            <div style={s.formActions}>
              <button
                type="submit"
                disabled={submitting || !form.nom.trim()}
                style={{
                  ...s.btnPrimary,
                  opacity: (submitting || !form.nom.trim()) ? 0.5 : 1,
                  cursor: (submitting || !form.nom.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Enregistrement...' : editItem ? 'Enregistrer les modifications' : 'Créer le fournisseur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLEAU */}
      <div style={s.tableCard}>
        <div style={s.tableToolbar}>
          <div style={s.searchWrap}>
            <Search size={14} color={MUTED} strokeWidth={1.8} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone..."
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

        {loading ? (
          <p style={s.loading}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Truck size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              {search ? 'Aucun résultat pour cette recherche.' : "Aucun fournisseur pour l'instant."}
            </p>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Fournisseur', 'Contact', 'Adresse', 'Total achats', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const initiales = f.nom
                  ? f.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  : '?'
                return (
                  <tr
                    key={f.id}
                    style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                    onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                    onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                  >
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ ...s.avatar, background: '#EEF1F8', color: NAVY }}>{initiales}</div>
                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{f.nom}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {f.email
                          ? <span style={s.metaItem}><Mail size={11} color={MUTED} strokeWidth={1.8} />{f.email}</span>
                          : <span style={{ ...s.metaItem, color: BORDER }}>—</span>}
                        {f.telephone && (
                          <span style={s.metaItem}><Phone size={11} color={MUTED} strokeWidth={1.8} />{f.telephone}</span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}>
                      {f.adresse
                        ? <span style={s.metaItem}><MapPin size={11} color={MUTED} strokeWidth={1.8} />{f.adresse}</span>
                        : <span style={{ color: MUTED, fontSize: 12 }}>—</span>}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: '#EBF5EF', color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShoppingCart size={10} strokeWidth={2} />
                        {Number(f.total_achats || 0).toLocaleString()} FCFA
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => ouvrirForm(f)}
                          style={{ ...s.btnAction, background: '#EEF1F8', color: NAVY, border: `1px solid ${BORDER}` }}
                        >
                          <Pencil size={12} strokeWidth={2} /><span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDesactiver(f)}
                          disabled={deletingId === f.id}
                          style={{ ...s.btnAction, background: '#FEF1F1', color: '#c0392b', border: '1px solid #FBBCBC', opacity: deletingId === f.id ? 0.6 : 1 }}
                        >
                          <Trash2 size={12} strokeWidth={2} /><span>{deletingId === f.id ? '...' : 'Désactiver'}</span>
                        </button>
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

const s = {
  page:          { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:       { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:         { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  btnPrimary:    { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:  { display: 'flex', alignItems: 'center', gap: 8, background: BG, color: NAVY, border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  statsRow:      { display: 'flex', gap: 12, marginBottom: 24 },
  statCard:      { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon:      { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:       { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:     { fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },
  alertSuccess:  { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:    { background: '#FEF1F1', border: '1px solid #FBBCBC', color: '#c0392b', borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },
  formCard:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:    { marginBottom: 14 },
  formTitle:     { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider:   { height: 1, background: BORDER, marginBottom: 18 },
  formActions:   { marginTop: 8 },
  row:           { display: 'flex', gap: 12 },
  fieldGroup:    { marginBottom: 16, flex: 1 },
  label:         { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:         { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  errorMsg:      { color: '#c0392b', fontSize: 11, marginTop: 4, display: 'block' },
  tableCard:     { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  tableToolbar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  searchWrap:    { display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '8px 14px', minWidth: 280 },
  searchInput:   { border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', flex: 1 },
  clearBtn:      { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  resultCount:   { fontSize: 12, color: MUTED, fontWeight: 500 },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  tr:            { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:            { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },
  avatar:        { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', flexShrink: 0 },
  metaItem:      { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED },
  badge:         { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnAction:     { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
  loading:       { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:         { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default FournisseursPage