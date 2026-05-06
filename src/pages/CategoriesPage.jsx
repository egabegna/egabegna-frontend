import { useState, useEffect } from 'react'
import produitService from '../services/produitService'

function CategoriesPage() {
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editCat, setEditCat]         = useState(null)
  const [nom, setNom]                 = useState('')
  const [error, setError]             = useState('')
  const [successMsg, setSuccessMsg]   = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const charger = async () => {
    try {
      const res = await produitService.getCategories()
      setCategories(res.data)
    } catch { setError('Erreur de chargement.') }
    finally  { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

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
    if (!window.confirm(`Supprimer «${cat.nom}» ?`)) return
    try {
      await produitService.supprimerCategorie(cat.id)
      setSuccessMsg('Catégorie supprimée.')
      await charger()
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de supprimer.')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Catégories</h1>
          <p style={s.subtitle}>{categories.length} catégorie(s)</p>
        </div>
        <button onClick={() => ouvrirForm()} style={s.btnPrimary}>
          + Nouvelle catégorie
        </button>
      </div>

      {successMsg && <div style={s.alertSuccess}>{successMsg}</div>}
      {error      && <div style={s.alertError}>{error}</div>}

      {/* Formulaire inline */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>
            {editCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              value={nom} onChange={e => { setNom(e.target.value); setError('') }}
              placeholder="Nom de la catégorie"
              style={{ ...s.input, flex: 1 }}
              autoFocus
            />
            <button type="submit" disabled={submitting} style={s.btnPrimary}>
              {submitting ? '...' : editCat ? 'Modifier' : 'Créer'}
            </button>
            <button type="button" onClick={fermerForm} style={s.btnSecondary}>
              Annuler
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {/* Liste */}
      {loading ? <p style={s.loading}>Chargement...</p> : (
        <div style={s.grid}>
          {categories.map(cat => (
            <div key={cat.id} style={s.catCard}>
              <div>
                <div style={s.catNom}>{cat.nom}</div>
                <div style={s.catMeta}>{cat.nb_produits} produit(s)</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => ouvrirForm(cat)} style={s.btnIcon}>✏️</button>
                <button
                  onClick={() => handleDelete(cat)}
                  disabled={cat.nb_produits > 0}
                  title={cat.nb_produits > 0 ? 'Catégorie liée à des produits actifs' : ''}
                  style={{
                    ...s.btnIcon,
                    opacity: cat.nb_produits > 0 ? 0.4 : 1,
                    cursor:  cat.nb_produits > 0 ? 'not-allowed' : 'pointer',
                  }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  page:    { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle:{ fontSize: 13, color: '#6b7280', marginTop: 4 },
  alertSuccess: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  alertError:   { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14 },
  formCard:{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20 },
  input:   { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none' },
  btnPrimary:   { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btnIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '4px 8px' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  catCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catNom:  { fontSize: 15, fontWeight: 600 },
  catMeta: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  loading: { color: '#9ca3af', textAlign: 'center', padding: 40 },
}

export default CategoriesPage