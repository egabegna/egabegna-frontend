import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthContext } from '../store/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import produitService from '../services/produitService'
import {
  Search,
  Plus,
  Pencil,
  X,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'

// ── Badge stock ───────────────────────────────
function StockBadge({ stock, seuil }) {
  if (stock === 0)      return <span style={{ ...bs.badge, background: '#FEF1F1', color: '#c0392b' }}>Rupture</span>
  if (stock <= seuil)   return <span style={{ ...bs.badge, background: '#FEF8EC', color: '#C89A3C' }}>Faible</span>
  return                       <span style={{ ...bs.badge, background: '#EBF5EF', color: GREEN     }}>OK</span>
}

const bs = {
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.3px' }
}

// ── Champ formulaire ──────────────────────────
function MField({ label, name, value, onChange, type = 'text', error }) {
  return (
    <div style={ms.fieldGroup}>
      <label style={ms.label}>{label}</label>
      {type === 'textarea'
        ? <textarea name={name} value={value} onChange={onChange} rows={2}
            style={{ ...ms.input, resize: 'vertical' }} />
        : <input name={name} value={value} onChange={onChange} type={type}
            style={{ ...ms.input, borderColor: error ? '#c0392b' : BORDER }} />
      }
      {error && <span style={ms.errorMsg}>{error}</span>}
    </div>
  )
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
  const [errors, setErrors]         = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim())  { setErrors({ nom: 'Nom requis.' }); return }
    if (!form.prix_vente)  { setErrors({ prix_vente: 'Prix de vente requis.' }); return }
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
      isEdit
        ? await produitService.modifierProduit(produit.id, payload)
        : await produitService.creerProduit(payload)
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
          <div>
            <div style={ms.modalEyebrow}>{isEdit ? 'Modifier' : 'Créer'}</div>
            <h2 style={ms.modalTitle}>{isEdit ? produit.nom : 'Nouveau produit'}</h2>
          </div>
          <button onClick={onClose} style={ms.closeBtn}>
            <X size={18} color={MUTED} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={ms.modalBody}>
          <MField label="Nom *"       name="nom"         value={form.nom}         onChange={handleChange} error={errors.nom} />
          <MField label="Description" name="description"  value={form.description}  onChange={handleChange} type="textarea" />

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
            <div style={ms.selectWrap}>
              <select name="categorie" value={form.categorie || ''} onChange={handleChange} style={ms.select}>
                <option value="">— Sans catégorie —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <ChevronDown size={13} color={MUTED} strokeWidth={2} style={ms.selectIcon} />
            </div>
          </div>

          {errors.detail && <p style={ms.errorMsg}>{errors.detail}</p>}

          <div style={ms.modalFooter}>
            <button type="button" onClick={onClose} style={ms.btnSecondary}>Annuler</button>
            <button type="submit" disabled={submitting} style={ms.btnPrimary}>
              {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ms = {
  overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
  modal:       { background: WHITE, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 18px', borderBottom: `1px solid ${BORDER}` },
  modalEyebrow:{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 },
  modalTitle:  { fontSize: 18, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.3px' },
  modalBody:   { padding: '22px 24px' },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, paddingTop: 16, borderTop: `1px solid ${BORDER}` },
  closeBtn:    { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  row:         { display: 'flex', gap: 12 },
  fieldGroup:  { marginBottom: 16, flex: 1 },
  label:       { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:       { width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', outline: 'none', background: WHITE },
  selectWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  select:      { width: '100%', padding: '9px 32px 9px 12px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, boxSizing: 'border-box', background: WHITE, appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' },
  selectIcon:  { position: 'absolute', right: 10, pointerEvents: 'none' },
  btnPrimary:  { background: NAVY, color: WHITE, border: 'none', padding: '10px 22px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:{ background: BG, color: NAVY, border: 'none', padding: '10px 22px', borderRadius: 9, fontSize: 13, cursor: 'pointer' },
  errorMsg:    { color: '#c0392b', fontSize: 11, marginTop: 4, display: 'block' },
}

// ── Drawer historique mouvements ──────────────
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

  const TYPE_CONFIG = {
    sortie:          { label: 'Vente',       bg: '#FEF1F1', color: '#c0392b'  },
    entree:          { label: 'Réception',   bg: '#EBF5EF', color: GREEN      },
    ajustement:      { label: 'Ajustement',  bg: '#EEF1F8', color: NAVY       },
    ambulant_depart: { label: 'Départ',      bg: '#FEF8EC', color: GOLD       },
    ambulant_retour: { label: 'Retour',      bg: '#F3EEF8', color: '#7c3aed'  },
  }

  return (
    <div style={drs.overlay}>
      <div style={drs.drawer}>

        <div style={drs.header}>
          <div>
            <div style={drs.drawerEyebrow}>Historique stock</div>
            <h2 style={drs.drawerTitle}>{produit.nom}</h2>
            <div style={drs.drawerStock}>
              Stock actuel : <strong style={{ color: NAVY }}>{produit.stock}</strong>
            </div>
          </div>
          <button onClick={onClose} style={drs.closeBtn}>
            <X size={18} color={MUTED} strokeWidth={2} />
          </button>
        </div>

        {/* Ajustement */}
        {['proprietaire', 'manager'].includes(role) && (
          <div style={drs.ajustZone}>
            {ajustOk && <div style={drs.alertSuccess}>{ajustOk}</div>}
            {!showAjust ? (
              <button onClick={() => setShowAjust(true)} style={drs.btnAjust}>
                <SlidersHorizontal size={14} strokeWidth={1.8} />
                <span>Ajuster le stock</span>
              </button>
            ) : (
              <form onSubmit={handleAjuster} style={drs.ajustForm}>
                <input
                  type="number"
                  placeholder="Quantité (+ ou −)"
                  value={ajustForm.quantite}
                  onChange={e => setAjustForm(p => ({ ...p, quantite: e.target.value }))}
                  style={{ ...drs.input, flex: 1 }}
                />
                <input
                  placeholder="Note (optionnel)"
                  value={ajustForm.note}
                  onChange={e => setAjustForm(p => ({ ...p, note: e.target.value }))}
                  style={{ ...drs.input, flex: 2 }}
                />
                <button type="submit" style={drs.btnOk}>OK</button>
                <button type="button" onClick={() => setShowAjust(false)} style={drs.btnAnn}>
                  <X size={13} strokeWidth={2} />
                </button>
              </form>
            )}
            {ajustError && <span style={{ color: '#c0392b', fontSize: 12, marginTop: 4, display: 'block' }}>{ajustError}</span>}
          </div>
        )}

        <div style={drs.liste}>
          {loading && <p style={drs.empty}>Chargement...</p>}
          {!loading && mouvements.length === 0 && (
            <p style={drs.empty}>Aucun mouvement enregistré.</p>
          )}
          {mouvements.map(m => {
            const t = TYPE_CONFIG[m.type] || { label: m.type, bg: BG, color: NAVY }
            const positif = m.quantite > 0
            return (
              <div key={m.id} style={drs.item}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ ...drs.typeBadge, background: t.bg, color: t.color }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>{new Date(m.date).toLocaleString('fr-FR')}</span>
                </div>
                <div style={drs.mvtDetail}>
                  <span style={{ fontWeight: 700, color: positif ? GREEN : '#c0392b', display: 'flex', alignItems: 'center', gap: 3, fontSize: 14 }}>
                    {positif
                      ? <TrendingUp  size={13} strokeWidth={2} />
                      : <TrendingDown size={13} strokeWidth={2} />
                    }
                    {positif ? '+' : ''}{m.quantite}
                  </span>
                  <span style={{ fontSize: 12, color: MUTED }}>{m.stock_avant} → {m.stock_apres}</span>
                  {m.note && <span style={{ fontSize: 11, color: MUTED, fontStyle: 'italic' }}>{m.note}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const drs = {
  overlay:      { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' },
  drawer:       { background: WHITE, width: '100%', maxWidth: 420, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 20px 16px', borderBottom: `1px solid ${BORDER}` },
  drawerEyebrow:{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 },
  drawerTitle:  { fontSize: 17, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.3px' },
  drawerStock:  { fontSize: 12, color: MUTED, marginTop: 4 },
  closeBtn:     { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  ajustZone:    { padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  btnAjust:     { display: 'flex', alignItems: 'center', gap: 6, background: '#EBF5EF', color: GREEN, border: `1px solid #A8D5B5`, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  ajustForm:    { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 },
  input:        { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${BORDER}`, fontSize: 12, outline: 'none', color: NAVY },
  btnOk:        { background: NAVY, color: WHITE, border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  btnAnn:       { background: BG, color: NAVY, border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  alertSuccess: { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12 },
  liste:        { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  empty:        { color: MUTED, textAlign: 'center', padding: 30, fontSize: 13 },
  item:         { borderBottom: `1px solid ${BG}`, paddingBottom: 12, marginBottom: 12 },
  typeBadge:    { padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.3px' },
  mvtDetail:    { display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 },
}


// ─── Select custom ────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value) || options[0]

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ ...csp.trigger, borderColor: open ? NAVY : BORDER }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: value ? NAVY : MUTED, fontSize: 13, fontWeight: value ? 500 : 400 }}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={13} color={MUTED} strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div style={csp.dropdown}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => handleSelect(o.value)}
              style={{
                ...csp.option,
                background: value === o.value ? '#EEF1F8' : WHITE,
                color:      value === o.value ? NAVY : '#6B7A99',
                fontWeight: value === o.value ? 700 : 400,
              }}
              onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = BG }}
              onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = WHITE }}
            >
              {value === o.value && <div style={csp.dot} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const csp = {
  trigger: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    padding:      '9px 12px',
    borderRadius: 9,
    border:       `1.5px solid ${BORDER}`,
    background:   WHITE,
    cursor:       'pointer',
    minWidth:     180,
    transition:   'border-color 0.15s',
  },
  dropdown: {
    position:     'absolute',
    top:          'calc(100% + 4px)',
    left:         0,
    minWidth:     '100%',
    background:   WHITE,
    border:       `1.5px solid ${BORDER}`,
    borderRadius: 10,
    boxShadow:    '0 8px 24px rgba(0,0,0,0.08)',
    zIndex:       20,
    overflow:     'hidden',
  },
  option: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    padding:    '9px 14px',
    fontSize:   13,
    cursor:     'pointer',
    transition: 'background 0.1s',
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: '50%',
    background:   GOLD,
    flexShrink:   0,
  },
}

// ── Page principale Produits ──────────────────
function ProduitsPage() {
  const { role }                          = useAuthContext()
  const [produits, setProduits]           = useState([])
  const [categories, setCategories]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [filtreStock, setFiltreStock]     = useState(false)
  const [filtreCat, setFiltreCat]         = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [editProduit, setEditProduit]     = useState(null)
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

  const ouvrirCreation      = ()  => { setEditProduit(null); setShowModal(true) }
  const ouvrirEdition       = (p) => { setEditProduit(p); setShowModal(true) }
  const fermerModal         = ()  => setShowModal(false)
  const apresEnregistrement = ()  => { fermerModal(); charger() }

  return (
    <div style={ps.page}>

      {/* ── HEADER ── */}
      <div style={ps.header}>
        <div>
          <p style={ps.eyebrow}>Catalogue</p>
          <h1 style={ps.title}>Produits</h1>
          <div style={ps.titleUnderline} />
        </div>
        <button onClick={ouvrirCreation} style={ps.btnPrimary}>
          <Plus size={15} strokeWidth={2.5} />
          <span>Nouveau produit</span>
        </button>
      </div>

      {/* ── FILTRES ── */}
      <div style={ps.filtres}>
        <div style={ps.searchWrap}>
          <Search size={14} color={MUTED} strokeWidth={1.8} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            style={ps.searchInput}
          />
        </div>
        <CustomSelect
          value={filtreCat}
          onChange={val => setFiltreCat(val)}
          options={[
            { value: '', label: 'Toutes catégories' },
            ...categories.map(c => ({ value: String(c.id), label: c.nom }))
          ]}
        />
        <label style={ps.checkLabel}>
          <input
            type="checkbox"
            checked={filtreStock}
            onChange={e => setFiltreStock(e.target.checked)}
            style={{ accentColor: GOLD }}
          />
          Stock faible uniquement
        </label>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <p style={ps.loading}>Chargement...</p>
      ) : produits.length === 0 ? (
        <div style={ps.empty}>Aucun produit trouvé.</div>
      ) : (
        <div style={ps.tableWrapper}>
          <table style={ps.table}>
            <thead>
              <tr>
                <th style={ps.th}>
                  <div style={ps.thInner}>Produit <ArrowUpDown size={11} color={MUTED} /></div>
                </th>
                <th style={ps.th}>Catégorie</th>
                <th style={ps.th}>Prix vente</th>
                <th style={ps.th}>Marge</th>
                <th style={ps.th}>Stock</th>
                <th style={ps.th}></th>
              </tr>
            </thead>
            <tbody>
              {produits.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ ...ps.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC' }}
                  onClick={() => setDrawerProduit(p)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF1F8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                >
                  <td style={ps.td}>
                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{p.nom}</div>
                    {p.description && <div style={ps.desc}>{p.description}</div>}
                  </td>
                  <td style={ps.td}>
                    <span style={ps.catBadge}>{p.categorie_nom || '—'}</span>
                  </td>
                  <td style={ps.td}>
                    <span style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>
                      {Number(p.prix_vente).toLocaleString()} FCFA
                    </span>
                  </td>
                  <td style={ps.td}>
                    {p.marge_pct != null
                      ? <span style={{ color: p.marge_pct >= 0 ? GREEN : '#c0392b', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}>
                          {p.marge_pct >= 0
                            ? <TrendingUp size={13} strokeWidth={2} />
                            : <TrendingDown size={13} strokeWidth={2} />
                          }
                          {p.marge_pct}%
                        </span>
                      : <span style={{ color: MUTED }}>—</span>
                    }
                  </td>
                  <td style={ps.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{p.stock}</span>
                      <StockBadge stock={p.stock} seuil={p.seuil_alerte} />
                    </div>
                  </td>
                  <td style={ps.td} onClick={e => e.stopPropagation()}>
                    <button onClick={() => ouvrirEdition(p)} style={ps.btnEdit}>
                      <Pencil size={13} strokeWidth={1.8} color={NAVY} />
                      <span>Modifier</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProduitModal
          categories={categories}
          produit={editProduit}
          onClose={fermerModal}
          onSave={apresEnregistrement}
        />
      )}

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
  page:         { padding: '32px 28px', maxWidth: 1120, margin: '0 auto' },

  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  eyebrow:      { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:        { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline:{ width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },

  btnPrimary:   { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  filtres:      { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  searchWrap:   { display: 'flex', alignItems: 'center', gap: 8, background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '8px 14px', minWidth: 240 },
  searchInput:  { border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', flex: 1 },

  checkLabel:   { fontSize: 12, color: NAVY, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 },

  tableWrapper: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  thInner:      { display: 'flex', alignItems: 'center', gap: 5 },
  tr:           { borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.1s' },
  td:           { padding: '13px 16px', fontSize: 13 },
  desc:         { fontSize: 11, color: MUTED, marginTop: 2 },
  catBadge:     { background: BG, color: '#546e7a', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  btnEdit:      { display: 'flex', alignItems: 'center', gap: 5, background: BG, color: NAVY, border: 'none', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  loading:      { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:        { textAlign: 'center', color: MUTED, padding: 60, background: BG, borderRadius: 14, fontSize: 13 },
}

export default ProduitsPage