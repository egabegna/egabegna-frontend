import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Star, UserPlus } from 'lucide-react'
import clientService from '../services/clientService'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const GREEN  = '#2D7A4F'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const RED    = '#c0392b'

// ── Formulaire création rapide ──
function CreationRapideClient({ onCreer, onClose }) {
  const [form, setForm]           = useState({ nom: '', telephone: '' })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Nom requis.'); return }
    setLoading(true)
    try {
      const res = await clientService.creer(form)
      onCreer(res.data)
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.telephone?.[0] || d?.nom?.[0] || d?.detail || 'Erreur.'
      )
    } finally { setLoading(false) }
  }

  return (
    <div style={cr.wrap}>
      <div style={cr.header}>
        <span style={cr.title}>Nouveau client rapide</span>
        <button onClick={onClose} style={cr.closeBtn}><X size={13} /></button>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nom *"
          value={form.nom}
          onChange={e => { setForm(p => ({ ...p, nom: e.target.value })); setError('') }}
          style={cr.input}
          autoFocus
        />
        <input
          placeholder="Téléphone"
          value={form.telephone}
          onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
          style={cr.input}
        />
        {error && <p style={{ color: RED, fontSize: 12, margin: '4px 0' }}>{error}</p>}
        <button type="submit" disabled={loading} style={cr.btn}>
          {loading ? '...' : 'Créer et sélectionner'}
        </button>
      </form>
    </div>
  )
}

const cr = {
  wrap:     { backgroundColor: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: '14px 16px', marginTop: 4 },
  header:   { display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10 },
  title:    { fontSize: 12, fontWeight: 700, color: NAVY },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: MUTED },
  input:    { width: '100%', padding: '8px 10px', borderRadius: 8,
              border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
              boxSizing: 'border-box', outline: 'none', marginBottom: 8 },
  btn:      { width: '100%', backgroundColor: NAVY, color: WHITE, border: 'none',
              padding: '9px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer' },
}

// ── Composant principal ──
function ClientAutocomplete({ value, onChange, boutiqueSeuil = 10, remisePct = 0 }) {
  const [query, setQuery]               = useState('')
  const [resultats, setResultats]       = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreation, setShowCreation] = useState(false)
  const [searching, setSearching]       = useState(false)
  const dropRef                         = useRef(null)
  const timerRef                        = useRef(null)

  // Fermer si clic dehors
  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDropdown(false)
        setShowCreation(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Recherche avec debounce
  const rechercher = useCallback(async (q) => {
    if (!q.trim()) { setResultats([]); return }
    setSearching(true)
    try {
      const res = await clientService.liste({ search: q })
      setResultats(res.data.results || res.data)
    } catch { }
    finally { setSearching(false) }
  }, [])

  const handleQueryChange = e => {
    const q = e.target.value
    setQuery(q)
    setShowDropdown(true)
    setShowCreation(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => rechercher(q), 300)
  }

  const handleSelect = (client) => {
    onChange(client)
    setQuery(client.nom)
    setShowDropdown(false)
    setResultats([])
  }

  const handleRetirer = () => {
    onChange(null)
    setQuery('')
    setResultats([])
  }

  const handleCreer = (client) => {
    handleSelect(client)
    setShowCreation(false)
  }

  const remiseApplicable = value?.est_client_fidele && remisePct > 0

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <label style={ac.label}>Client (optionnel)</label>

      {/* Client sélectionné */}
      {value ? (
        <div style={ac.selectedWrap}>
          <div style={ac.selectedAvatar}>
            {value.nom.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: NAVY }}>
                {value.nom}
              </span>
              {value.est_client_fidele && (
                <span style={ac.badgeFidele}>
                  <Star size={9} strokeWidth={2.5} fill={GOLD} />
                  Fidèle
                </span>
              )}
            </div>
            {value.telephone && (
              <div style={{ fontSize: 12, color: MUTED }}>{value.telephone}</div>
            )}
            {/* Badge remise */}
            {remiseApplicable && (
              <div style={ac.badgeRemise}>
                🎉 Remise fidélité {remisePct}% appliquée
              </div>
            )}
          </div>
          <button onClick={handleRetirer} style={ac.retirerBtn}>
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      ) : (
        /* Champ de recherche */
        <div style={{ position: 'relative' }}>
          <Search size={13} color={MUTED} strokeWidth={1.8}
            style={{ position: 'absolute', left: 11, top: '50%',
                     transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query && setShowDropdown(true)}
            placeholder="Rechercher par nom ou téléphone..."
            style={ac.searchInput}
          />
          {searching && (
            <span style={{ position: 'absolute', right: 11, top: '50%',
                           transform: 'translateY(-50%)', fontSize: 11,
                           color: MUTED }}>
              ...
            </span>
          )}
        </div>
      )}

      {/* Dropdown résultats */}
      {showDropdown && !value && (
        <div style={ac.dropdown}>
          {resultats.length === 0 && query && !searching ? (
            <div style={ac.dropEmpty}>
              <p style={{ margin: '0 0 10px', color: MUTED, fontSize: 13 }}>
                Aucun client trouvé pour "{query}".
              </p>
              <button
                onClick={() => { setShowDropdown(false); setShowCreation(true) }}
                style={ac.btnCreer}
              >
                <UserPlus size={13} strokeWidth={2} />
                Créer "{query}" comme nouveau client
              </button>
            </div>
          ) : (
            <>
              {resultats.slice(0, 6).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  style={ac.dropItem}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = BG}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = WHITE}
                >
                  <div style={ac.dropAvatar}>
                    {c.nom.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>
                        {c.nom}
                      </span>
                      {c.est_client_fidele && (
                        <span style={ac.badgeFidele}>
                          <Star size={8} strokeWidth={2.5} fill={GOLD} />
                          Fidèle
                        </span>
                      )}
                    </div>
                    {c.telephone && (
                      <div style={{ fontSize: 11, color: MUTED }}>{c.telephone}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      {c.nb_achats} achat(s)
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setShowDropdown(false); setShowCreation(true) }}
                style={ac.btnCreerSecondaire}
              >
                <Plus size={12} strokeWidth={2.5} />
                Nouveau client
              </button>
            </>
          )}
        </div>
      )}

      {/* Formulaire création rapide */}
      {showCreation && (
        <CreationRapideClient
          onCreer={handleCreer}
          onClose={() => setShowCreation(false)}
        />
      )}
    </div>
  )
}

const ac = {
  label:        { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
                  letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  searchInput:  { width: '100%', padding: '9px 12px 9px 32px', borderRadius: 9,
                  border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
                  boxSizing: 'border-box', outline: 'none', background: WHITE },
  selectedWrap: { display: 'flex', alignItems: 'center', gap: 12,
                  backgroundColor: '#EEF1F8', borderRadius: 10,
                  padding: '10px 14px', border: `1.5px solid ${NAVY}20` },
  selectedAvatar:{ width: 34, height: 34, borderRadius: '50%', background: NAVY,
                   color: WHITE, display: 'flex', alignItems: 'center',
                   justifyContent: 'center', fontSize: 11, fontWeight: 800,
                   flexShrink: 0 },
  retirerBtn:   { background: 'none', border: 'none', cursor: 'pointer',
                  color: MUTED, padding: 4 },
  badgeFidele:  { display: 'inline-flex', alignItems: 'center', gap: 3,
                  backgroundColor: '#FBF5E9', color: GOLD, fontSize: 10,
                  fontWeight: 700, padding: '2px 6px', borderRadius: 20 },
  badgeRemise:  { fontSize: 11, color: GREEN, fontWeight: 600,
                  marginTop: 3 },
  dropdown:     { position: 'absolute', top: '100%', left: 0, right: 0,
                  backgroundColor: WHITE, border: `1px solid ${BORDER}`,
                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 50, overflow: 'hidden', marginTop: 4 },
  dropItem:     { display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', background: WHITE, border: 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                  borderBottom: `1px solid ${BG}` },
  dropAvatar:   { width: 30, height: 30, borderRadius: '50%', background: BG,
                  color: NAVY, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 },
  dropEmpty:    { padding: '14px 16px' },
  btnCreer:     { display: 'flex', alignItems: 'center', gap: 6, background: NAVY,
                  color: WHITE, border: 'none', padding: '8px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnCreerSecondaire: { display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                        background: BG, color: NAVY, border: 'none',
                        padding: '10px 14px', cursor: 'pointer', fontSize: 12,
                        fontWeight: 600, borderTop: `1px solid ${BORDER}` },
}

export default ClientAutocomplete