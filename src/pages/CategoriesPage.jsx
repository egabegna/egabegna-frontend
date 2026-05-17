import { useState, useEffect } from 'react'
import produitService from '../services/produitService'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Tag, Search } from 'lucide-react'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const BG     = '#F4F5F7'
const WHITE  = '#FFFFFF'
const RED    = '#c0392b'

// ─── Hook responsive ──────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

function CategoriesPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editCat, setEditCat]       = useState(null)
  const [nom, setNom]               = useState('')
  const [error, setError]           = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch]         = useState('')

  const charger = async () => {
    try {
      const res = await produitService.getCategories()
      setCategories(res.data)
    } catch { setError('Erreur de chargement.') }
    finally  { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 3000)
    return () => clearTimeout(t)
  }, [successMsg])

  const ouvrirForm = (cat = null) => {
    setEditCat(cat)
    setNom(cat ? cat.nom : '')
    setError('')
    setShowForm(true)
  }

  const fermerForm = () => {
    setShowForm(false)
    setEditCat(null)
    setNom('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom est requis.'); return }
    setSubmitting(true)
    try {
      if (editCat) {
        await produitService.modifierCategorie(editCat.id, { nom })
        setSuccessMsg('Catégorie modifiée.')
      } else {
        await produitService.creerCategorie({ nom })
        setSuccessMsg('Catégorie créée.')
      }
      fermerForm()
      await charger()
    } catch (err) {
      const data = err.response?.data
      setError(data?.nom?.[0] || data?.detail || 'Erreur.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer « ${cat.nom} » ?`)) return
    setDeletingId(cat.id)
    try {
      await produitService.supprimerCategorie(cat.id)
      setSuccessMsg('Catégorie supprimée.')
      await charger()
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de supprimer cette catégorie.')
    } finally { setDeletingId(null) }
  }

  const filtered = categories.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  )

  const totalProduits = categories.reduce((a, c) => a + (c.nb_produits || 0), 0)

  return (
    <div style={{ ...s.page, padding: isMobile ? '16px 12px' : '32px 28px' }}>

      {/* ── HEADER ── */}
      <div style={{
        ...s.header,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 14 : 0,
        marginBottom: isMobile ? 16 : 24,
      }}>
        <div>
          <p style={s.eyebrow}>Catalogue</p>
          <h1 style={{ ...s.title, fontSize: isMobile ? 22 : 26 }}>Catégories</h1>
          <div style={s.titleUnderline} />
        </div>
        <button
          onClick={() => showForm && !editCat ? fermerForm() : ouvrirForm()}
          style={{
            ...(showForm && !editCat ? s.btnSecondary : s.btnPrimary),
            width: isMobile ? '100%' : undefined,
            justifyContent: isMobile ? 'center' : undefined,
          }}
        >
          {showForm && !editCat
            ? <><X size={15} strokeWidth={2.5} /><span>Annuler</span></>
            : <><Plus size={15} strokeWidth={2.5} /><span>Nouvelle catégorie</span></>
          }
        </button>
      </div>

      {/* ── STATS — 2×2 sur mobile ── */}
      <div style={{
        ...s.statsRow,
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 16 : 24,
      }}>
        {[
          { label: 'Catégories',    val: categories.length,                                      bg: '#EEF1F8', color: NAVY       },
          { label: 'Avec produits', val: categories.filter(c => c.nb_produits > 0).length,       bg: '#EBF5EF', color: GREEN      },
          { label: 'Vides',         val: categories.filter(c => !c.nb_produits).length,          bg: '#FBF5E9', color: GOLD       },
          { label: 'Total produits',val: totalProduits,                                          bg: '#EEE9F8', color: '#5b21b6'  },
        ].map(({ label, val, bg, color }) => (
          <div key={label} style={{
            ...s.statCard,
            flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
            padding: isMobile ? '12px 14px' : '14px 18px',
          }}>
            <div style={{ ...s.statIcon, background: bg }}>
              <Tag size={16} color={color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ ...s.statVal, fontSize: isMobile ? 17 : 20 }}>{val}</div>
              <div style={{ ...s.statLabel, fontSize: isMobile ? 10 : 11 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      {successMsg && <div style={s.alertSuccess}>{successMsg}</div>}
      {error && !showForm && <div style={s.alertError}>{error}</div>}

      {/* ── FORMULAIRE ── */}
      {showForm && (
        <div style={{ ...s.formCard, padding: isMobile ? '14px 14px' : '20px 24px' }}>
          <div style={s.formHeader}>
            <span style={s.formTitle}>
              {editCat ? `Modifier · ${editCat.nom}` : 'Nouvelle catégorie'}
            </span>
            <button onClick={fermerForm} style={s.iconBtn}>
              <X size={16} color={MUTED} strokeWidth={2} />
            </button>
          </div>
          <div style={s.formDivider} />
          <form onSubmit={handleSubmit} noValidate>
            <div style={s.fieldGroup}>
              <label style={s.label}>Nom de la catégorie *</label>
              <input
                value={nom}
                onChange={e => { setNom(e.target.value); setError('') }}
                placeholder="Ex : Boissons, Électronique..."
                style={{ ...s.input, borderColor: error ? RED : BORDER }}
                autoFocus
              />
              {error && <span style={s.errorMsg}>{error}</span>}
            </div>
            <div style={s.formActions}>
              <button
                type="submit"
                disabled={submitting || !nom.trim()}
                style={{
                  ...s.btnPrimary,
                  width: isMobile ? '100%' : undefined,
                  justifyContent: isMobile ? 'center' : undefined,
                  opacity: submitting || !nom.trim() ? 0.5 : 1,
                  cursor:  submitting || !nom.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Enregistrement...' : editCat ? 'Enregistrer les modifications' : 'Créer la catégorie'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TABLEAU / CARTES ── */}
      <div style={s.tableCard}>

        {/* Toolbar */}
        <div style={{
          ...s.tableToolbar,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 0,
          padding: isMobile ? '12px 12px' : '14px 20px',
          alignItems: isMobile ? 'stretch' : 'center',
        }}>
          <div style={{ ...s.searchWrap, minWidth: isMobile ? 'unset' : 260 }}>
            <Search size={14} color={MUTED} strokeWidth={1.8} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              style={s.searchInput}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.clearBtn}>
                <X size={13} color={MUTED} strokeWidth={2} />
              </button>
            )}
          </div>
          <span style={{ ...s.resultCount, textAlign: isMobile ? 'right' : 'left' }}>
            {filtered.length} catégorie{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Contenu */}
        {loading ? (
          <p style={s.loading}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Tag size={28} color={MUTED} strokeWidth={1.3} />
            <p style={{ margin: '10px 0 0', color: MUTED, fontSize: 13 }}>
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucune catégorie créée.'}
            </p>
          </div>

          ) : isMobile ? (
          /* ── Cartes mobiles ── */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((cat, i) => {
              const hasProducts = cat.nb_produits > 0
              return (
                <div key={cat.id}
                  style={{
                    padding: '14px 14px',
                    background: i % 2 === 0 ? WHITE : '#FAFBFC',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/produits?categorie=${cat.id}&categorie_nom=${encodeURIComponent(cat.nom)}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={s.catIconWrap}>
                      <Tag size={14} color={GOLD} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontWeight: 700, color: NAVY, fontSize: 14, flex: 1 }}>
                      {cat.nom}
                    </span>
                    <span style={{
                      ...s.badge,
                      background: hasProducts ? '#EBF5EF' : '#FBF5E9',
                      color: hasProducts ? GREEN : GOLD,
                    }}>
                      {hasProducts ? 'Active' : 'Vide'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: hasProducts ? NAVY : MUTED, fontWeight: hasProducts ? 600 : 400 }}>
                      {cat.nb_produits} produit{cat.nb_produits !== 1 ? 's' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => ouvrirForm(cat)}
                        style={{ ...s.btnAction, background: '#EEF1F8', color: NAVY, border: `1px solid ${BORDER}` }}>
                        <Pencil size={12} strokeWidth={2} />
                        <span>Modifier</span>
                      </button>
                      <button onClick={() => handleDelete(cat)}
                        disabled={hasProducts || deletingId === cat.id}
                        style={{
                          ...s.btnAction, background: '#FEF1F1', color: RED, border: '1px solid #FBBCBC',
                          opacity: hasProducts ? 0.35 : 1,
                          cursor: hasProducts ? 'not-allowed' : 'pointer',
                        }}>
                        <Trash2 size={12} strokeWidth={2} />
                        <span>{deletingId === cat.id ? '...' : 'Suppr.'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Table desktop ── */
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Catégorie</th>
                <th style={s.th}>Nb produits</th>
                <th style={s.th}>Statut</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, i) => {
                const hasProducts = cat.nb_produits > 0
                return (
                    <tr
                      key={cat.id}
                      style={{ ...s.tr, background: i % 2 === 0 ? WHITE : '#FAFBFC', cursor: 'pointer' }}
                      onClick={() => navigate(`/produits?categorie=${cat.id}&categorie_nom=${encodeURIComponent(cat.nom)}`)}
                      onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#EEF1F8'}
                      onMouseLeave={ev => ev.currentTarget.style.backgroundColor = i % 2 === 0 ? WHITE : '#FAFBFC'}
                    >
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={s.catIconWrap}>
                          <Tag size={14} color={GOLD} strokeWidth={1.8} />
                        </div>
                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{cat.nom}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: 13, color: hasProducts ? NAVY : MUTED, fontWeight: hasProducts ? 600 : 400 }}>
                        {cat.nb_produits} produit{cat.nb_produits !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={s.td}>
                      {hasProducts ? (
                        <span style={{ ...s.badge, background: '#EBF5EF', color: GREEN }}>Active</span>
                      ) : (
                        <span style={{ ...s.badge, background: '#FBF5E9', color: GOLD }}>Vide</span>
                      )}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => ouvrirForm(cat)}
                          style={{ ...s.btnAction, background: '#EEF1F8', color: NAVY, border: `1px solid ${BORDER}` }}
                          title="Modifier"
                        >
                          <Pencil size={12} strokeWidth={2} /><span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={hasProducts || deletingId === cat.id}
                          title={hasProducts ? 'Catégorie liée à des produits' : 'Supprimer'}
                          style={{
                            ...s.btnAction,
                            background: '#FEF1F1', color: RED, border: '1px solid #FBBCBC',
                            opacity: hasProducts ? 0.35 : 1,
                            cursor:  hasProducts ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={12} strokeWidth={2} />
                          <span>{deletingId === cat.id ? '...' : 'Supprimer'}</span>
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

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page:           { padding: '32px 28px', maxWidth: 960, margin: '0 auto' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:        { fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: MUTED, margin: '0 0 6px' },
  title:          { fontSize: 26, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.5px' },
  titleUnderline: { width: 32, height: 3, background: GOLD, borderRadius: 2, marginTop: 10 },
  btnPrimary:     { display: 'flex', alignItems: 'center', gap: 8, background: NAVY, color: WHITE, border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary:   { display: 'flex', alignItems: 'center', gap: 8, background: BG,   color: NAVY,  border: 'none', padding: '11px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  statsRow:       { display: 'flex', gap: 12, marginBottom: 24 },
  statCard:       { display: 'flex', alignItems: 'center', gap: 12, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 18px', flex: 1 },
  statIcon:       { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statVal:        { fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: 1 },
  statLabel:      { fontSize: 11, color: MUTED, fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 },
  alertSuccess:   { background: '#EBF5EF', border: `1px solid #A8D5B5`, color: GREEN, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500 },
  alertError:     { background: '#FEF1F1', border: '1px solid #FBBCBC', color: RED,   borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 13 },
  formCard:       { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 },
  formHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formTitle:      { fontSize: 11, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '1.5px' },
  formDivider:    { height: 1, background: BORDER, marginBottom: 18 },
  formActions:    { marginTop: 4 },
  fieldGroup:     { marginBottom: 16 },
  label:          { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:          { width: '100%', padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY, outline: 'none', background: WHITE, boxSizing: 'border-box' },
  errorMsg:       { color: RED, fontSize: 11, marginTop: 4, display: 'block' },
  iconBtn:        { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 },
  tableCard:      { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' },
  tableToolbar:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}` },
  searchWrap:     { display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '8px 14px', minWidth: 260 },
  searchInput:    { border: 'none', outline: 'none', fontSize: 13, color: NAVY, background: 'transparent', flex: 1 },
  clearBtn:       { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  resultCount:    { fontSize: 12, color: MUTED, fontWeight: 500 },
  table:          { width: '100%', borderCollapse: 'collapse' },
  th:             { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1.5px', background: BG, borderBottom: `1px solid ${BORDER}` },
  tr:             { borderBottom: `1px solid ${BG}`, transition: 'background 0.1s' },
  td:             { padding: '13px 16px', fontSize: 13, verticalAlign: 'middle' },
  catIconWrap:    { width: 32, height: 32, borderRadius: 8, background: '#FBF5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge:          { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  btnAction:      { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
  loading:        { color: MUTED, textAlign: 'center', padding: 48, fontSize: 13 },
  empty:          { textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' },
}

export default CategoriesPage