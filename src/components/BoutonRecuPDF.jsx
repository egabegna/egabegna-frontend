import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadRecuPDF } from '../utils/downloadPdf'

const NAVY  = '#1B2D5B'
const WHITE = '#FFFFFF'
const GREEN = '#2D7A4F'

function BoutonRecuPDF({ venteId, venteDate, variant = 'primary' }) {
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState('')

  const handleClick = async () => {
    setLoading(true)
    setErreur('')
    try {
      await downloadRecuPDF(venteId, venteDate)
    } catch {
      setErreur('Erreur lors de la génération du PDF.')
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    primary: {
      display:         'inline-flex',
      alignItems:      'center',
      gap:             7,
      backgroundColor: NAVY,
      color:           WHITE,
      border:          'none',
      padding:         '10px 18px',
      borderRadius:    9,
      fontSize:        13,
      fontWeight:      700,
      cursor:          loading ? 'wait' : 'pointer',
      opacity:         loading ? 0.7 : 1,
      transition:      'opacity 0.2s',
    },
    secondary: {
      display:         'inline-flex',
      alignItems:      'center',
      gap:             6,
      backgroundColor: '#EBF5EF',
      color:           GREEN,
      border:          '1px solid #A8D5B5',
      padding:         '8px 14px',
      borderRadius:    8,
      fontSize:        12,
      fontWeight:      600,
      cursor:          loading ? 'wait' : 'pointer',
      opacity:         loading ? 0.7 : 1,
    },
    icon: {
      display:         'inline-flex',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: '#EEF1F8',
      color:           NAVY,
      border:          'none',
      width:           32,
      height:          32,
      borderRadius:    8,
      cursor:          loading ? 'wait' : 'pointer',
      opacity:         loading ? 0.6 : 1,
    },
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={styles[variant]}
        title="Télécharger le reçu PDF"
      >
        <Download size={variant === 'icon' ? 14 : 15} strokeWidth={2} />
        {variant !== 'icon' && (
          <span>{loading ? 'Génération...' : 'Télécharger le reçu'}</span>
        )}
      </button>
      {erreur && (
        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
          {erreur}
        </div>
      )}
    </div>
  )
}

export default BoutonRecuPDF