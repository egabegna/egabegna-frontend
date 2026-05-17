import { useState, useEffect } from 'react'
import { Settings, Percent, ShoppingBag, GitBranch, Save } from 'lucide-react'
import boutiqueService from '../services/boutiqueService'

const NAVY   = '#1B2D5B'
const GOLD   = '#C89A3C'
const MUTED  = '#B0BEC5'
const BORDER = '#EAECEF'
const WHITE  = '#FFFFFF'
const BG     = '#F4F5F7'
const GREEN  = '#2D7A4F'
const RED    = '#c0392b'

// ── Toast ────────────────────────────────────
function Toast({ message, type, visible }) {
  if (!visible) return null
  return (
    <div style={{
      ...ts.toast,
      backgroundColor: type === 'success' ? '#1a4731' : '#7f1d1d',
      borderColor:     type === 'success' ? '#2D7A4F' : RED,
    }}>
      <span style={{ fontSize: 14 }}>
        {type === 'success' ? '✓' : '✕'}
      </span>
      {message}
    </div>
  )
}

const ts = {
  toast: {
    position:     'fixed',
    bottom:       24,
    right:        24,
    display:      'flex',
    alignItems:   'center',
    gap:          10,
    color:        '#fff',
    border:       '1px solid',
    borderRadius: 10,
    padding:      '12px 20px',
    fontSize:     13,
    fontWeight:   600,
    zIndex:       100,
    boxShadow:    '0 4px 16px rgba(0,0,0,0.2)',
    animation:    'fadeIn 0.2s ease',
  },
}

// ── Champ numérique ───────────────────────────
function NumField({ label, name, value, onChange, min = 0, max, suffix, hint }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          style={s.input}
        />
        {suffix && (
          <span style={s.suffix}>{suffix}</span>
        )}
      </div>
      {hint && <p style={s.hint}>{hint}</p>}
    </div>
  )
}

// ── Section principale ────────────────────────
function ConfigurationSection() {
  const [config, setConfig]       = useState({
    taux_imposition:          18,
    seuil_fidelite:           10,
    regime_commission_defaut: null,
  })
  const [regimes, setRegimes]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]         = useState({ visible: false, type: '', text: '' })

  const showToast = (type, text) => {
    setToast({ visible: true, type, text })
    setTimeout(() => setToast({ visible: false, type: '', text: '' }), 3500)
  }

  useEffect(() => {
    boutiqueService.get().then(res => {
      const b = res.data
      setConfig({
        taux_imposition:          Number(b.taux_imposition)          || 18,
        seuil_fidelite:           b.seuil_fidelite                   ?? 10,
        regime_commission_defaut: b.regime_commission_defaut         || null,
      })
    }).catch(() => {})
    .finally(() => setLoading(false))

    // Charger les régimes de commission (disponibles après Bloc 08)
    boutiqueService.getRegimes?.()
      .then(res => setRegimes(res.data || []))
      .catch(() => setRegimes([]))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: name === 'regime_commission_defaut'
        ? (value || null)
        : Number(value),
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await boutiqueService.patch({
        taux_imposition:          config.taux_imposition,
        seuil_fidelite:           config.seuil_fidelite,
        regime_commission_defaut: config.regime_commission_defaut,
      })
      showToast('success', 'Configuration enregistrée.')
    } catch (err) {
      const d = err.response?.data
      const msg = d?.taux_imposition?.[0]
        || d?.seuil_fidelite?.[0]
        || d?.detail
        || 'Erreur lors de la sauvegarde.'
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <>
      <Toast
        message={toast.text}
        type={toast.type}
        visible={toast.visible}
      />

      <div style={s.card}>
        <div style={s.cardHeader}>
          <Settings size={14} color={NAVY} strokeWidth={2} />
          <span style={s.cardTitle}>Configuration boutique</span>
        </div>
        <div style={s.divider} />

        <form onSubmit={handleSubmit}>

          {/* Taux imposition */}
          <div style={s.section}>
            <div style={s.sectionLabel}>
              <Percent size={13} color={GOLD} strokeWidth={2} />
              <span>Fiscalité</span>
            </div>
            <NumField
              label="Taux d'imposition"
              name="taux_imposition"
              value={config.taux_imposition}
              onChange={handleChange}
              min={0}
              max={100}
              suffix="%"
              hint="Appliqué automatiquement sur les reçus et rapports financiers."
            />
          </div>

          <div style={s.sep} />

          {/* Seuil fidélité */}
          <div style={s.section}>
            <div style={s.sectionLabel}>
              <ShoppingBag size={13} color={GOLD} strokeWidth={2} />
              <span>Programme fidélité</span>
            </div>
            <NumField
              label="Seuil de fidélité"
              name="seuil_fidelite"
              value={config.seuil_fidelite}
              onChange={handleChange}
              min={0}
              suffix="achats"
              hint="Nombre d'achats minimum pour qu'un client soit considéré fidèle."
            />
          </div>

          <div style={s.sep} />

          {/* Régime commission */}
          <div style={s.section}>
            <div style={s.sectionLabel}>
              <GitBranch size={13} color={GOLD} strokeWidth={2} />
              <span>Commission ambulant</span>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Régime par défaut</label>
              {regimes.length === 0 ? (
                <div style={s.regimeVide}>
                  <span>Aucun régime configuré.</span>
                  <span style={{ color: MUTED, fontSize: 11, marginTop: 4, display: 'block' }}>
                    Les régimes de commission seront disponibles après la configuration
                    du module ambulant (Bloc 08).
                  </span>
                </div>
              ) : (
                <select
                  name="regime_commission_defaut"
                  value={config.regime_commission_defaut || ''}
                  onChange={handleChange}
                  style={s.select}
                >
                  <option value="">— Aucun régime par défaut —</option>
                  {regimes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nom} — {r.type} ({r.valeur}%)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Bouton save */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...s.btnSave,
              opacity: submitting ? 0.6 : 1,
              cursor:  submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={14} strokeWidth={2.5} />
            <span>{submitting ? 'Enregistrement...' : 'Enregistrer la configuration'}</span>
          </button>

        </form>
      </div>
    </>
  )
}

const s = {
  card:      { background: WHITE, border: `1px solid ${BORDER}`,
               borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  cardHeader:{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: NAVY,
               textTransform: 'uppercase', letterSpacing: '1.5px' },
  divider:   { height: 1, background: BORDER, marginBottom: 20 },
  section:   { marginBottom: 20 },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: NAVY,
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sep:       { height: 1, background: BG, marginBottom: 20 },
  fieldGroup:{ marginBottom: 0 },
  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: MUTED,
               letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  input:     { width: '100%', padding: '10px 40px 10px 12px', borderRadius: 9,
               border: `1.5px solid ${BORDER}`, fontSize: 14, color: NAVY,
               boxSizing: 'border-box', outline: 'none', background: WHITE },
  suffix:    { position: 'absolute', right: 12, top: '50%',
               transform: 'translateY(-50%)', fontSize: 13,
               color: MUTED, fontWeight: 600, pointerEvents: 'none' },
  hint:      { fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.5 },
  select:    { width: '100%', padding: '10px 12px', borderRadius: 9,
               border: `1.5px solid ${BORDER}`, fontSize: 13, color: NAVY,
               boxSizing: 'border-box', background: WHITE },
  regimeVide:{ backgroundColor: BG, borderRadius: 8, padding: '12px 14px',
               fontSize: 13, color: NAVY, border: `1px dashed ${BORDER}` },
  btnSave:   { display: 'flex', alignItems: 'center', gap: 8,
               background: NAVY, color: WHITE, border: 'none',
               padding: '11px 20px', borderRadius: 10, fontSize: 13,
               fontWeight: 700, width: '100%', justifyContent: 'center',
               marginTop: 8, transition: 'opacity 0.2s' },
}

export default ConfigurationSection