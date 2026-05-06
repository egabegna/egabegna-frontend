import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import produitService from '../services/produitService'

// ── Badge stock ───────────────────────────────
function StockBadge({ stock, seuil }) {
  if (stock === 0)           return <span style={{ ...bs.badge, backgroundColor: '#fee2e2', color: '#dc2626' }}>● Rupture</span>
  if (stock <= seuil)        return <span style={{ ...bs.badge, backgroundColor: '#fef3c7', color: '#d97706' }}>● Faible</span>
  return                            <span style={{ ...bs.badge, backgroundColor: '#dcfce7', color: '#16a34a' }}>● OK</span>
}

const bs = {
  badge: { padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }
}

// ── Modal Formulaire produit ──────────────────
function ProduitModal({ categories, produit, onClose, onSave }) {
  const isEdit = !!produit
  const [form, setForm] = useState({
    nom:          produit?.nom          || '',
    description:  produit?.description  || '',
    categorie:    produit?.categorie    || '',
    prix_vente:   produit?.prix_vente   || '',
    prix_achat:   produit?.prix_achat   || '',
    stock:        produit?.stock        ?? 0,
    seuil_alerte: produit?.seuil_alerte ?? 5,
  })
  const [errors, setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setErrors({ nom: 'Nom requis.' }); return }
    if (!form.prix_vente) { setErrors({ prix_vente: 'Prix de vente requis.' }); return }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        categorie:    form.categorie    || null,
        prix_achat:   form.prix_achat   || null,
        stock:        Number(form.stock),
        seuil_alerte: Number(form.seuil_alerte),
        prix_vente:   Number(form.prix_vente),
      }
      if (isEdit) {
        await produitService.modifierProduit(produit.id, payload)
      } else {
        await produitService.creerProduit(payload)
      }
      onSave()
    } catch (err) {
      const data = err.response?.data || {}
      const errs = {}
      Object.keys(data).forEach(k => { errs[k] = Array.isArray(data[k]) ? data[k][0] : data[k] })
      setErrors(errs)
    } finally { setSubmitting(false) }
  }

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={e => e.stopPropagation()}>
        <div style={ms.modalHeader}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} style={ms.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={ms.modalBody}>
          <MField label="Nom *"        name="nom"        value={form.nom}        onChange={handleChange} error={errors.nom} />
          <MField label="Description"  name="description" value={form.description} onChange={handleChange} type="textarea" />

          <div style={ms.row}>
            <MField label="Prix de vente *" name="prix_vente" value={form.prix_vente} onChange={handleChange} type="number" error={errors.prix_vente} />
            <MField label="Prix d'achat"    name="prix_achat" value={form.prix_achat} onChange={handleChange} type="number" />
          </div>

          <div style={ms.row}>
            <MField label="Stock initial" name="stock"        value={form.stock}        onChange={handleChange} type="number" />
            <MField label="Seuil alerte"  name="seuil_alerte" value={form.seuil_alerte} onChange={handleChange} type="number" />
          </div>

          <div style={ms.fieldGroup}>
            <label style={ms.label}>Catégorie</label>
            <select name="categorie" value={form.categorie || ''} onChange={handleChange} style={ms.select}>
              <option value="">— Sans catégorie —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          {errors.detail && <p style={{ color: '#ef4444', fontSize: 13 }}>{errors.detail}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={ms.btnSecondary}>Annuler</button>
            <button type="submit" disabled={submitting} style={ms.btnPrimary}>
              {submitting ? '...' : isEdit ? 'Enregistrer' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MField({ label, name, value, onChange, type = 'text', error }) {
  return (
    <div style={ms.fieldGroup}>
      <label style={ms.label}>{label}</label>
      {type === 'textarea'
        ? <textarea name={name} value={value} onChange={onChange} rows={2} style={{ ...ms.input, resize: 'vertical' }} />
        : <input    name={name} value={value} onChange={onChange} type={type} style={{ ...ms.input, borderColor: error ? '#ef4444' : '#d1d5db' }} />
      }
      {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  )
}

const ms = {
  overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
  modal:       { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
  modalBody:   { padding: '24px' },
  closeBtn:    { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' },
  row:         { display: 'flex', gap: 12 },
  fieldGroup:  { marginBottom: 16, flex: 1 },
  label:       { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 },
  input:       { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  select:      { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', backgroundColor: '#fff' },
  btnPrimary:  { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}

// ── Drawer historique ─────────────────────────
function HistoriqueDrawer({ produit, onClose, role }) {
  const [mouvements, setMouvements] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAjust, setShowAjust]   = useState(false)
  const [ajustForm, setAjustForm]   = useState({ quantite: '', note: '' })
  const [ajustError, setAjustError] = useState('')
  const [ajustOk, setAjustOk]       = useState('')

  useEffect(() => {
    produitService.getMouvements({ produit_id: produit.id })
      .then(r => setMouvements(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [produit.id])

  const handleAjuster = async e => {
    e.preventDefault()
    setAjustError('')
    try {
      await produitService.ajusterStock({
        produit_id: produit.id,
        quantite:   Number(ajustForm.quantite),
        note:       ajustForm.note,
      })
      setAjustOk('Stock ajusté avec succès.')
      setAjustForm({ quantite: '', note: '' })
      setShowAjust(false)
      const r = await produitService.getMouvements({ produit_id: produit.id })
      setMouvements(r.data.results || r.data)
    } catch (err) {
      setAjustError(err.response?.data?.detail || 'Erreur.')
    }
  }

  const TYPE_LABELS = {
    sortie:          { label: 'Vente',      color: '#dc2626', bg: '#fee2e2' },
    entree:          { label: 'Réception',  color: '#16a34a', bg: '#dcfce7' },
    ajustement:      { label: 'Ajustement', color: '#2563eb', bg: '#dbeafe' },
    ambulant_depart: { label: 'Départ',     color: '#d97706', bg: '#fef3c7' },
    ambulant_retour: { label: 'Retour',     color: '#7c3aed', bg: '#ede9fe' },
  }

  return (
    <div style={dr.overlay}>
      <div style={dr.drawer}>
        <div style={dr.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>{produit.nom}</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
              Stock actuel : <strong>{produit.stock}</strong>
            </p>
          </div>
          <button onClick={onClose} style={dr.closeBtn}>✕</button>
        </div>

        {/* Ajustement — manager+ uniquement */}
        {['proprietaire', 'manager'].includes(role) && (
          <div style={{ padding: '0 20px 16px' }}>
            {ajustOk && <div style={dr.alertSuccess}>{ajustOk}</div>}
            {!showAjust ? (
              <button onClick={() => setShowAjust(true)} style={dr.btnAjust}>
                ± Ajuster le stock
              </button>
            ) : (
              <form onSubmit={handleAjuster} style={dr.ajustForm}>
                <input
                  type="number"
                  placeholder="Quantité (+ ou -)"
                  value={ajustForm.quantite}
                  onChange={e => setAjustForm(p => ({ ...p, quantite: e.target.value }))}
                  style={{ ...dr.input, flex: 1 }}
                />
                <input
                  placeholder="Note (optionnel)"
                  value={ajustForm.note}
                  onChange={e => setAjustForm(p => ({ ...p, note: e.target.value }))}
                  style={{ ...dr.input, flex: 2 }}
                />
                <button type="submit" style={dr.btnOk}>OK</button>
                <button type="button" onClick={() => setShowAjust(false)} style={dr.btnAnn}>✕</button>
              </form>
            )}
            {ajustError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{ajustError}</p>}
          </div>
        )}

        {/* Liste mouvements */}
        <div style={dr.liste}>
          {loading && <p style={dr.loading}>Chargement...</p>}
          {!loading && mouvements.length === 0 && (
            <p style={dr.loading}>Aucun mouvement enregistré.</p>
          )}
          {mouvements.map(m => {
            const t = TYPE_LABELS[m.type] || { label: m.type, color: '#374151', bg: '#f3f4f6' }
            return (
              <div key={m.id} style={dr.item}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...dr.typeBadge, backgroundColor: t.bg, color: t.color }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(m.date).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div style={dr.mvtDetail}>
                  <span style={{ fontWeight: 600 }}>
                    {m.quantite > 0 ? '+' : ''}{m.quantite}
                  </span>
                  <span style={{ color: '#9ca3af' }}>
                    {m.stock_avant} → {m.stock_apres}
                  </span>
                  {m.note && <span style={{ color: '#6b7280', fontSize: 12 }}>{m.note}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const dr = {
  overlay:      { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' },
  drawer:       { backgroundColor: '#fff', width: '100%', maxWidth: 420, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', borderBottom: '1px solid #e5e7eb' },
  closeBtn:     { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' },
  btnAjust:     { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  ajustForm:    { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 },
  input:        { padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none' },
  btnOk:        { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' },
  btnAnn:       { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 13 },
  liste:        { flex: 1, overflow: 'auto', padding: '0 20px 20px' },
  loading:      { color: '#9ca3af', textAlign: 'center', padding: 30 },
  item:         { borderBottom: '1px solid #f3f4f6', paddingBottom: 12, marginBottom: 12 },
  typeBadge:    { padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  mvtDetail:    { display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, fontSize: 14 },
}

// ── Page principale Produits ──────────────────
function ProduitsPage() {
  const { role }                      = useAuthContext()
  const [produits, setProduits]       = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filtreStock, setFiltreStock] = useState(false)
  const [filtreCat, setFiltreCat]     = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editProduit, setEditProduit] = useState(null)
  const [drawerProduit, setDrawerProduit] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  const charger = useCallback(async () => {
    try {
      const params = {}
      if (debouncedSearch) params.search       = debouncedSearch
      if (filtreStock)      params.stock_faible = 'true'
      if (filtreCat)        params.categorie_id = filtreCat

      const [pRes, cRes] = await Promise.all([
        produitService.getProduits(params),
        produitService.getCategories(),
      ])
      setProduits(pRes.data)
      setCategories(cRes.data)
    } catch { }
    finally { setLoading(false) }
  }, [debouncedSearch, filtreStock, filtreCat])

  useEffect(() => { charger() }, [charger])

  const ouvrirCreation  = ()  => { setEditProduit(null); setShowModal(true) }
  const ouvrirEdition   = (p) => { setEditProduit(p); setShowModal(true) }
  const fermerModal     = ()  => setShowModal(false)
  const apresEnregistrement = () => { fermerModal(); charger() }

  return (
    <div style={ps.page}>

      {/* Header */}
      <div style={ps.header}>
        <div>
          <h1 style={ps.title}>Produits</h1>
          <p style={ps.subtitle}>{produits.length} produit(s)</p>
        </div>
        <button onClick={ouvrirCreation} style={ps.btnPrimary}>
          + Nouveau produit
        </button>
      </div>

      {/* Filtres */}
      <div style={ps.filtres}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un produit..."
          style={ps.searchInput}
        />
        <select value={filtreCat} onChange={e => setFiltreCat(e.target.value)} style={ps.select}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <label style={ps.checkLabel}>
          <input type="checkbox" checked={filtreStock}
            onChange={e => setFiltreStock(e.target.checked)} />
          {' '}Stock faible uniquement
        </label>
      </div>

      {/* Table produits */}
      {loading ? <p style={ps.loading}>Chargement...</p> : (
        produits.length === 0
          ? <div style={ps.empty}>Aucun produit trouvé.</div>
          : (
            <div style={ps.tableWrapper}>
              <table style={ps.table}>
                <thead>
                  <tr style={ps.thead}>
                    <th style={ps.th}>Produit</th>
                    <th style={ps.th}>Catégorie</th>
                    <th style={ps.th}>Prix vente</th>
                    <th style={ps.th}>Marge</th>
                    <th style={ps.th}>Stock</th>
                    <th style={ps.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map(p => (
                    <tr key={p.id} style={ps.tr}
                      onClick={() => setDrawerProduit(p)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                      <td style={ps.td}>
                        <div style={{ fontWeight: 600 }}>{p.nom}</div>
                        {p.description && <div style={ps.desc}>{p.description}</div>}
                      </td>
                      <td style={ps.td}>
                        <span style={ps.catBadge}>{p.categorie_nom || '—'}</span>
                      </td>
                      <td style={ps.td}>{Number(p.prix_vente).toLocaleString()} FCFA</td>
                      <td style={ps.td}>
                        {p.marge_pct != null
                          ? <span style={{ color: p.marge_pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {p.marge_pct}%
                            </span>
                          : <span style={{ color: '#9ca3af' }}>—</span>
                        }
                      </td>
                      <td style={ps.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{p.stock}</span>
                          <StockBadge stock={p.stock} seuil={p.seuil_alerte} />
                        </div>
                      </td>
                      <td style={ps.td} onClick={e => e.stopPropagation()}>
                        <button onClick={() => ouvrirEdition(p)} style={ps.btnEdit}>
                          ✏️ Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* Modal création/édition */}
      {showModal && (
        <ProduitModal
          categories={categories}
          produit={editProduit}
          onClose={fermerModal}
          onSave={apresEnregistrement}
        />
      )}

      {/* Drawer historique */}
      {drawerProduit && (
        <HistoriqueDrawer
          produit={drawerProduit}
          role={role}
          onClose={() => setDrawerProduit(null)}
        />
      )}

    </div>
  )
}

const ps = {
  page:    { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle:{ fontSize: 13, color: '#6b7280', marginTop: 4 },
  filtres: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  searchInput: { padding: '9px 14px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none', minWidth: 220 },
  select:  { padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, backgroundColor: '#fff' },
  checkLabel: { fontSize: 13, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnPrimary: { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  tableWrapper: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  thead:   { backgroundColor: '#f9fafb' },
  th:      { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr:      { borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' },
  td:      { padding: '14px 16px', fontSize: 14 },
  desc:    { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  catBadge:{ backgroundColor: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 8, fontSize: 12 },
  btnEdit: { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 40 },
  empty:   { textAlign: 'center', color: '#6b7280', padding: 48, backgroundColor: '#f9fafb', borderRadius: 12 },
}

export default ProduitsPage