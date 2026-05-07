import { useState, useEffect } from 'react'
import fournisseurService from '../services/fournisseurService'

const FORM_INIT = { nom: '', telephone: '', adresse: '', email: '' }

function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [form, setForm]                 = useState(FORM_INIT)
  const [errors, setErrors]             = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [msg, setMsg]                   = useState({ type: '', text: '' })

  const charger = async () => {
    try {
      const res = await fournisseurService.liste()
      setFournisseurs(res.data)
    } catch { setMsg({ type: 'error', text: 'Erreur de chargement.' }) }
    finally  { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  const ouvrirForm = (item = null) => {
    setEditItem(item)
    setForm(item ? {
      nom: item.nom, telephone: item.telephone,
      adresse: item.adresse, email: item.email,
    } : FORM_INIT)
    setErrors({})
    setShowForm(true)
    setMsg({ type: '', text: '' })
  }

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setErrors({ nom: 'Nom requis.' }); return }
    setSubmitting(true)
    try {
      if (editItem) await fournisseurService.modifier(editItem.id, form)
      else          await fournisseurService.creer(form)
      setMsg({ type: 'success', text: editItem ? 'Fournisseur modifié.' : 'Fournisseur créé.' })
      setShowForm(false)
      await charger()
    } catch (err) {
      const d = err.response?.data
      setErrors({ nom: d?.nom?.[0] || '', global: d?.detail || '' })
    } finally { setSubmitting(false) }
  }

  const handleDesactiver = async (f) => {
    if (!window.confirm(`Désactiver «${f.nom}» ?`)) return
    try {
      await fournisseurService.desactiver(f.id)
      setMsg({ type: 'success', text: 'Fournisseur désactivé.' })
      await charger()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur.' })
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Fournisseurs</h1>
          <p style={s.sub}>{fournisseurs.length} fournisseur(s)</p>
        </div>
        <button onClick={() => ouvrirForm()} style={s.btnPrimary}>+ Nouveau</button>
      </div>

      {msg.text && (
        <div style={msg.type === 'success' ? s.alertSuccess : s.alertError}>
          {msg.text}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>{editItem ? 'Modifier' : 'Nouveau fournisseur'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={s.row}>
              <FField label="Nom *"       name="nom"       value={form.nom}       onChange={handleChange} error={errors.nom} />
              <FField label="Téléphone"   name="telephone" value={form.telephone} onChange={handleChange} />
            </div>
            <div style={s.row}>
              <FField label="Email"    name="email"   value={form.email}   onChange={handleChange} type="email" />
              <FField label="Adresse"  name="adresse" value={form.adresse} onChange={handleChange} />
            </div>
            {errors.global && <p style={{ color: '#ef4444', fontSize: 13 }}>{errors.global}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" disabled={submitting} style={s.btnPrimary}>
                {submitting ? '...' : editItem ? 'Enregistrer' : 'Créer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={s.btnSecondary}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? <p style={s.loading}>Chargement...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Nom', 'Téléphone', 'Email', 'Total achats', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fournisseurs.map(f => (
                <tr key={f.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{f.nom}</div>
                    {f.adresse && <div style={s.meta}>{f.adresse}</div>}
                  </td>
                  <td style={s.td}>{f.telephone || '—'}</td>
                  <td style={s.td}>{f.email || '—'}</td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>
                      {Number(f.total_achats).toLocaleString()} FCFA
                    </span>
                  </td>
                  <td style={s.td}>
                    <button onClick={() => ouvrirForm(f)} style={s.btnIcon}>✏️</button>
                    <button onClick={() => handleDesactiver(f)} style={s.btnIcon}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fournisseurs.length === 0 && (
            <p style={s.empty}>Aucun fournisseur.</p>
          )}
        </div>
      )}
    </div>
  )
}

function FField({ label, name, value, onChange, type = 'text', error }) {
  return (
    <div style={{ flex: 1, marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input name={name} type={type} value={value} onChange={onChange}
        style={{ ...s.input, borderColor: error ? '#ef4444' : '#d1d5db' }} />
      {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  )
}

const s = {
  page:    { padding: '32px 24px', maxWidth: 1000, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  formCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20 },
  formTitle:{ fontSize: 15, fontWeight: 600, marginBottom: 16 },
  row:     { display: 'flex', gap: 12 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:   { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btnPrimary:   { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnIcon:  { background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '4px 6px' },
  tableWrapper: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  thead:   { backgroundColor: '#f9fafb' },
  th:      { padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  tr:      { borderBottom: '1px solid #f3f4f6' },
  td:      { padding: '13px 16px', fontSize: 14 },
  meta:    { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 30 },
  empty:   { textAlign: 'center', color: '#9ca3af', padding: 30 },
}

export default FournisseursPage