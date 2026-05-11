// src/components/shared/AuthBackground.jsx
// Background doodle business/boutique/marketing pour ConnexionPage et InscriptionPage
// Couleur unique : #C89A3C (or) sur fond #1B2D5B (navy)

const NAVY = '#1B2D5B'

/**
 * Utilisation :
 *   import AuthBackground from '../components/shared/AuthBackground'
 *
 *   <AuthBackground>
 *     <div style={s.card}>...</div>
 *   </AuthBackground>
 */
export default function AuthBackground({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: NAVY,
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(PATTERN_SVG)}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '560px 560px',
      position: 'relative',
    }}>
      {/* Overlay légère pour que la card ressorte */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(27,45,91,0.68)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// ─── SVG tileable — motifs business/boutique/marketing ────────────────────────
// Chaque tuile 560×560 contient 12 icônes précises sur 3 rangées de 4
// Couleur : #C89A3C (gold) uniquement, opacité 0.45
const PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="560">
<style>
.dk{fill:none;stroke:#C89A3C;stroke-linecap:round;stroke-linejoin:round;opacity:0.45}
.df{fill:#C89A3C;fill-opacity:0.07;stroke:#C89A3C;stroke-linecap:round;stroke-linejoin:round;opacity:0.45}
.dt{fill:#C89A3C;fill-opacity:0.35;stroke:none}
</style>

<!-- ══ RANGÉE 1 (y=40) ══════════════════════════════════════════════════════ -->

<!-- 🏪 Devanture boutique (x=30) -->
<g transform="translate(30,30)">
  <rect x="0" y="20" width="80" height="54" rx="4" class="df" stroke-width="1.6"/>
  <rect x="28" y="32" width="24" height="42" rx="2" class="dk" stroke-width="1.5"/>
  <rect x="6" y="30" width="16" height="18" rx="2" class="dk" stroke-width="1.4"/>
  <rect x="58" y="30" width="16" height="18" rx="2" class="dk" stroke-width="1.4"/>
  <path d="M0 20 Q10 4 24 2 Q40 0 40 0 Q40 0 56 2 Q70 4 80 20Z" class="df" stroke-width="1.6"/>
  <line x1="40" y1="0" x2="40" y2="20" class="dk" stroke-width="1.4"/>
  <path d="M6 12 Q20 8 34 12" class="dk" stroke-width="1.2"/>
  <path d="M46 12 Q60 8 74 12" class="dk" stroke-width="1.2"/>
</g>

<!-- 📊 Camembert marketing (x=170) -->
<g transform="translate(170,34)">
  <circle cx="36" cy="36" r="34" class="dk" stroke-width="1.6"/>
  <path d="M36 36 L36 2 A34 34 0 0 1 66 52 Z" class="df" stroke-width="1.5"/>
  <path d="M36 36 L66 52 A34 34 0 0 1 14 62 Z" fill="#C89A3C" fill-opacity="0.12" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.5"/>
  <line x1="36" y1="2"  x2="36" y2="36" class="dk" stroke-width="1.3"/>
  <line x1="66" y1="52" x2="36" y2="36" class="dk" stroke-width="1.3"/>
  <line x1="14" y1="62" x2="36" y2="36" class="dk" stroke-width="1.3"/>
  <rect x="76" y="10" width="10" height="10" rx="2" class="df" stroke-width="1.2"/>
  <rect x="76" y="26" width="10" height="10" rx="2" fill="#C89A3C" fill-opacity="0.12" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.2"/>
  <rect x="76" y="42" width="10" height="10" rx="2" class="dk" stroke-width="1.2"/>
</g>

<!-- 💳 Carte bancaire (x=310) -->
<g transform="translate(310,36)">
  <rect x="0" y="0" width="90" height="60" rx="7" class="df" stroke-width="1.6"/>
  <rect x="0" y="14" width="90" height="16" fill="#C89A3C" fill-opacity="0.1" stroke="none"/>
  <rect x="8" y="36" width="22" height="14" rx="3" class="dk" stroke-width="1.5"/>
  <circle cx="68" cy="42" r="9" class="dk" stroke-width="1.5"/>
  <circle cx="78" cy="42" r="9" class="dk" stroke-width="1.5"/>
  <line x1="36" y1="40" x2="56" y2="40" class="dk" stroke-width="1.3"/>
  <line x1="36" y1="46" x2="56" y2="46" class="dk" stroke-width="1.3"/>
  <rect x="8" y="6" width="16" height="4" rx="1" class="dk" stroke-width="1.2"/>
</g>

<!-- 📈 Courbe de croissance (x=450) -->
<g transform="translate(450,28)">
  <line x1="0" y1="74" x2="100" y2="74" class="dk" stroke-width="1.6"/>
  <line x1="0" y1="0"  x2="0"   y2="74" class="dk" stroke-width="1.6"/>
  <rect x="8"  y="46" width="12" height="28" rx="2" class="df" stroke-width="1.2"/>
  <rect x="26" y="34" width="12" height="40" rx="2" class="df" stroke-width="1.2"/>
  <rect x="44" y="24" width="12" height="50" rx="2" class="df" stroke-width="1.2"/>
  <rect x="62" y="14" width="12" height="60" rx="2" class="df" stroke-width="1.2"/>
  <rect x="80" y="6"  width="12" height="68" rx="2" class="df" stroke-width="1.2"/>
  <path d="M8 56 Q34 40 62 26 Q80 16 94 6" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="8"  cy="56" r="4" class="dt"/>
  <circle cx="62" cy="26" r="4" class="dt"/>
  <circle cx="94" cy="6"  r="4" class="dt"/>
  <polyline points="84,2 94,6 90,16" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
</g>

<!-- ══ RANGÉE 2 (y=200) ════════════════════════════════════════════════════ -->

<!-- 📢 Mégaphone publicitaire (x=30) -->
<g transform="translate(30,198)">
  <polygon points="10,20 10,52 36,52 36,20 68,4 68,68 36,52" class="df" stroke-width="1.6"/>
  <rect x="10" y="20" width="26" height="32" rx="3" class="dk" stroke-width="1.5"/>
  <path d="M76 26 Q88 38 76 50" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M82 18 Q100 38 82 58" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="16" y1="60" x2="28" y2="78" class="dk" stroke-width="1.4"/>
  <line x1="28" y1="78" x2="44" y2="78" class="dk" stroke-width="1.4"/>
</g>

<!-- 💰 Sac d'argent FCFA (x=170) -->
<g transform="translate(170,196)">
  <ellipse cx="38" cy="54" rx="36" ry="28" class="df" stroke-width="1.6"/>
  <path d="M16 36 Q10 12 38 12 Q66 12 60 36" class="dk" stroke-width="1.5" fill="none"/>
  <path d="M26 12 Q38 2 50 12" class="dk" stroke-width="1.5" fill="none"/>
  <line x1="22" y1="44" x2="54" y2="44" class="dk" stroke-width="1.4"/>
  <text x="38" y="62" text-anchor="middle" font-size="20" font-weight="700"
        fill="#C89A3C" font-family="serif" opacity="0.42">₣</text>
</g>

<!-- 🚚 Camion livraison (x=310) -->
<g transform="translate(310,204)">
  <rect x="0" y="12" width="70" height="44" rx="4" class="df" stroke-width="1.6"/>
  <polygon points="70,12 70,44 100,44 100,26 88,12" class="df" stroke-width="1.6"/>
  <circle cx="20" cy="58" r="10" fill="#1B2D5B" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.6"/>
  <circle cx="20" cy="58" r="4"  class="dt"/>
  <circle cx="82" cy="58" r="10" fill="#1B2D5B" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.6"/>
  <circle cx="82" cy="58" r="4"  class="dt"/>
  <rect x="8"  y="22" width="54" height="24" rx="2" class="dk" stroke-width="1.3"/>
  <line x1="70" y1="20" x2="90" y2="20" class="dk" stroke-width="1.4"/>
  <line x1="-8" y1="26" x2="0" y2="26" class="dk" stroke-width="1.4"/>
  <line x1="-14" y1="36" x2="0" y2="36" class="dk" stroke-width="1.4"/>
  <line x1="-8" y1="46" x2="0" y2="46" class="dk" stroke-width="1.4"/>
</g>

<!-- 🎯 Cible objectif (x=452) -->
<g transform="translate(452,200)">
  <circle cx="36" cy="36" r="34" class="dk" stroke-width="1.6"/>
  <circle cx="36" cy="36" r="22" class="dk" stroke-width="1.5"/>
  <circle cx="36" cy="36" r="10" class="dt"/>
  <line x1="36" y1="0"  x2="36" y2="10" class="dk" stroke-width="1.4"/>
  <line x1="36" y1="62" x2="36" y2="72" class="dk" stroke-width="1.4"/>
  <line x1="0"  y1="36" x2="10" y2="36" class="dk" stroke-width="1.4"/>
  <line x1="62" y1="36" x2="72" y2="36" class="dk" stroke-width="1.4"/>
  <line x1="76" y1="4"  x2="48" y2="28" class="dk" stroke-width="2"/>
  <polyline points="48,28 52,22 56,30" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
</g>

<!-- ══ RANGÉE 3 (y=368) ════════════════════════════════════════════════════ -->

<!-- 🧾 Caisse / reçu (x=30) -->
<g transform="translate(30,362)">
  <rect x="6" y="0" width="70" height="90" rx="3" class="df" stroke-width="1.6"/>
  <path d="M6 0 Q6 -12 18 -12 Q30 -12 30 0" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.4"/>
  <path d="M30 0 Q30 -6 42 -6 Q54 -6 54 0" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.4"/>
  <path d="M54 0 Q54 -14 66 -14 Q78 -14 78 0" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.4"/>
  <line x1="14" y1="16" x2="68" y2="16" class="dk" stroke-width="1.3"/>
  <line x1="14" y1="28" x2="68" y2="28" class="dk" stroke-width="1.3"/>
  <line x1="14" y1="40" x2="68" y2="40" class="dk" stroke-width="1.3"/>
  <line x1="14" y1="52" x2="52" y2="52" class="dk" stroke-width="1.3"/>
  <line x1="14" y1="64" x2="68" y2="64" class="dk" stroke-width="1.5"/>
  <rect x="40" y="72" width="28" height="12" rx="3" class="dt"/>
</g>

<!-- 🛒 Panier e-commerce (x=170) -->
<g transform="translate(170,366)">
  <path d="M0 0 L12 0 L28 54 L80 54 L92 18 L18 18" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="36" cy="68" r="9" fill="#1B2D5B" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.6"/>
  <circle cx="36" cy="68" r="4" class="dt"/>
  <circle cx="72" cy="68" r="9" fill="#1B2D5B" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.6"/>
  <circle cx="72" cy="68" r="4" class="dt"/>
  <line x1="42" y1="28" x2="42" y2="48" class="dk" stroke-width="1.4"/>
  <line x1="56" y1="28" x2="56" y2="48" class="dk" stroke-width="1.4"/>
  <line x1="70" y1="28" x2="70" y2="48" class="dk" stroke-width="1.4"/>
</g>

<!-- 📋 Inventaire / stock (x=310) -->
<g transform="translate(310,362)">
  <rect x="0" y="0" width="72" height="88" rx="5" class="df" stroke-width="1.6"/>
  <rect x="8" y="8" width="56" height="10" rx="2" class="dk" stroke-width="1.4"/>
  <rect x="8" y="26" width="8" height="8" rx="1" class="dt"/>
  <line x1="20" y1="32" x2="60" y2="32" class="dk" stroke-width="1.2"/>
  <rect x="8" y="40" width="8" height="8" rx="1" class="dk" stroke-width="1.3"/>
  <line x1="20" y1="46" x2="52" y2="46" class="dk" stroke-width="1.2"/>
  <rect x="8" y="54" width="8" height="8" rx="1" class="dt"/>
  <line x1="20" y1="60" x2="58" y2="60" class="dk" stroke-width="1.2"/>
  <rect x="8" y="68" width="8" height="8" rx="1" class="dk" stroke-width="1.3"/>
  <line x1="20" y1="74" x2="48" y2="74" class="dk" stroke-width="1.2"/>
</g>

<!-- 📱 Dashboard mobile (x=452) -->
<g transform="translate(452,360)">
  <rect x="0" y="0" width="48" height="80" rx="8" class="df" stroke-width="1.6"/>
  <rect x="6" y="10" width="36" height="50" rx="2" class="dk" stroke-width="1.4"/>
  <circle cx="24" cy="70" r="5" class="dk" stroke-width="1.4"/>
  <line x1="18" y1="4" x2="30" y2="4" class="dk" stroke-width="1.4"/>
  <!-- écran: barres KPI -->
  <rect x="10" y="46" width="6"  height="10" rx="1" class="df" stroke-width="1"/>
  <rect x="19" y="38" width="6"  height="18" rx="1" class="df" stroke-width="1"/>
  <rect x="28" y="30" width="6"  height="26" rx="1" class="df" stroke-width="1"/>
  <line x1="10" y1="56" x2="36" y2="56" class="dk" stroke-width="1"/>
  <!-- écran: courbe -->
  <path d="M10 44 Q19 36 28 28" fill="none" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="28" cy="28" r="3" class="dt"/>
  <!-- second téléphone décalé -->
  <rect x="60" y="16" width="48" height="80" rx="8" class="df" stroke-width="1.6"/>
  <rect x="66" y="26" width="36" height="50" rx="2" class="dk" stroke-width="1.4"/>
  <circle cx="84" cy="86" r="5" class="dk" stroke-width="1.4"/>
  <!-- notif badge -->
  <circle cx="102" cy="18" r="8" fill="#1B2D5B" stroke="#C89A3C" stroke-opacity="0.45" stroke-width="1.4"/>
  <line x1="102" y1="14" x2="102" y2="22" class="dk" stroke-width="1.5"/>
  <line x1="98"  y1="18" x2="106" y2="18" class="dk" stroke-width="1.5"/>
</g>

<!-- ── Éléments décoratifs entre rangées ──────────────────────────────────── -->

<!-- Flèche de croissance (centre haut) -->
<g transform="translate(268,150)" opacity="0.38">
  <line x1="0" y1="28" x2="28" y2="0" stroke="#C89A3C" stroke-width="1.8" stroke-linecap="round"/>
  <polyline points="16,0 28,0 28,12" fill="none" stroke="#C89A3C" stroke-width="1.8" stroke-linecap="round"/>
</g>

<!-- Étoile fidélité (milieu) -->
<g transform="translate(268,310)" opacity="0.38">
  <polygon points="16,0 20,12 32,12 22,19 26,32 16,24 6,32 10,19 0,12 12,12"
           fill="#C89A3C" fill-opacity="0.35" stroke="#C89A3C" stroke-width="1.4" stroke-linejoin="round"/>
</g>

<!-- Cycle client / flèche circulaire (bas gauche inter) -->
<g transform="translate(142,310)" opacity="0.38">
  <path d="M40 6 A32 32 0 1 1 8 40" fill="none" stroke="#C89A3C" stroke-width="2" stroke-linecap="round"/>
  <polyline points="2,34 8,40 14,32" fill="none" stroke="#C89A3C" stroke-width="1.8" stroke-linecap="round"/>
</g>

<!-- Tag prix (bas droite inter) -->
<g transform="translate(406,310)" opacity="0.38">
  <path d="M4 4 L60 4 L70 24 L60 44 L4 44 Z" fill="#C89A3C" fill-opacity="0.08" stroke="#C89A3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="24" r="5" fill="#C89A3C" fill-opacity="0.35" stroke="#C89A3C" stroke-width="1.4"/>
  <line x1="26" y1="14" x2="60" y2="14" stroke="#C89A3C" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
  <line x1="26" y1="24" x2="62" y2="24" stroke="#C89A3C" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
  <line x1="26" y1="34" x2="56" y2="34" stroke="#C89A3C" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>
</g>

<!-- Petits points décoratifs -->
<circle cx="140" cy="160" r="3.5" fill="#C89A3C" fill-opacity="0.3"/>
<circle cx="420" cy="160" r="3.5" fill="#C89A3C" fill-opacity="0.3"/>
<circle cx="140" cy="330" r="3.5" fill="#C89A3C" fill-opacity="0.3"/>
<circle cx="420" cy="330" r="3.5" fill="#C89A3C" fill-opacity="0.3"/>
<circle cx="280" cy="460" r="3.5" fill="#C89A3C" fill-opacity="0.3"/>
</svg>`