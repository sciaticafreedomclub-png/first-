// week.jsx — Weekly rhythm. Full week visible at once; each day fills in with
// its activity, in the order the voiceover names them.
// VO (7s): "Sunday, Tuesday, Friday are the days that I strengthen my low back.
//           Monday, Wednesday, Thursday, and Saturday are the days I stay active."

const { useTime, Easing, clamp, interpolate } = window;

const W = 3840;
const H = 2160;
const DUR = 7;
const GOLD = '#FFDE59';
const WHITE = '#FFFFFF';
const MUTED = '#A8A8A8';
const CARD = '#1A1A1A';

// Week, left to right. `reveal` is when each day's activity fills in — ordered
// to match the spoken sequence (strength days first, then active days).
const DAYS = [
  { label: 'SUN', kind: 'strength', reveal: 1.05 },
  { label: 'MON', kind: 'active',   reveal: 3.45 },
  { label: 'TUE', kind: 'strength', reveal: 1.70 },
  { label: 'WED', kind: 'active',   reveal: 4.05 },
  { label: 'THU', kind: 'active',   reveal: 4.60 },
  { label: 'FRI', kind: 'strength', reveal: 2.35 },
  { label: 'SAT', kind: 'active',   reveal: 5.20 },
];

// grid geometry
const N = 7;
const MARGIN = 180;
const GAP = 34;
const CARD_W = (W - MARGIN * 2 - GAP * (N - 1)) / N; // 468
const CARD_H = 760;
const CARD_TOP = 800;
function cardX(i) { return MARGIN + i * (CARD_W + GAP); }

function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const r = document.getElementById('video-root');
    if (r) r.dataset.screenLabel = 't=' + sec + 's';
  }, [sec]);
  return null;
}

// ---- activity icons ----
function ActivityIcon({ kind, draw, color }) {
  const off = 1 - clamp(draw, 0, 1);
  const s = {
    fill: 'none', stroke: color, strokeWidth: 6,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    pathLength: 1, strokeDasharray: 1, strokeDashoffset: off,
  };
  if (kind === 'strength') {
    // dumbbell
    return (
      <svg width="220" height="150" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
        <path d="M64 60 L136 60" style={s} />
        <path d="M64 38 L64 82" style={s} />
        <path d="M46 46 L46 74" style={s} />
        <path d="M136 38 L136 82" style={s} />
        <path d="M154 46 L154 74" style={s} />
      </svg>
    );
  }
  // walking figure
  return (
    <svg width="150" height="180" viewBox="0 0 120 170" style={{ overflow: 'visible' }}>
      <circle cx="66" cy="24" r="13" style={s} />
      <path d="M66 38 L58 92" style={s} />
      <path d="M58 92 L42 132" style={s} />
      <path d="M58 92 L78 128" style={s} />
      <path d="M62 56 L40 74" style={s} />
      <path d="M62 56 L84 66" style={s} />
    </svg>
  );
}

function DayCard({ i }) {
  const t = useTime();
  const d = DAYS[i];
  const isStrength = d.kind === 'strength';

  // card shell builds in early, quick left-to-right
  const base = Easing.easeOutCubic(clamp((t - 0.1 - i * 0.06) / 0.55, 0, 1));
  if (base <= 0.001) return null;

  // activity fills in at its spoken moment
  const e = Easing.easeOutCubic(clamp((t - d.reveal) / 0.7, 0, 1));
  const draw = Easing.easeOutCubic(clamp((t - d.reveal - 0.05) / 0.7, 0, 1));

  const accent = isStrength ? GOLD : '#3A3A3A';
  const iconColor = isStrength ? GOLD : '#CFCFCF';
  const x = cardX(i);

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: CARD_TOP,
      width: CARD_W,
      height: CARD_H,
      opacity: base,
      transform: `translateY(${(1 - base) * 36}px)`,
      willChange: 'transform, opacity',
    }}>
      {/* card surface */}
      <div style={{
        position: 'absolute', inset: 0,
        background: CARD,
        borderRadius: 18,
        boxShadow: isStrength
          ? `0 0 ${e * 70}px rgba(255,222,89,${e * 0.16})`
          : 'none',
      }} />
      {/* top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        height: 7,
        width: `${(isStrength ? e : base) * 100}%`,
        background: accent,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
      }} />

      {/* day label */}
      <div style={{
        position: 'absolute', top: 52, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 46,
        fontWeight: 500,
        letterSpacing: '0.14em',
        color: isStrength ? interpHexToGold(e) : WHITE,
      }}>
        {d.label}
      </div>

      {/* icon */}
      <div style={{
        position: 'absolute', top: 196, left: 0, right: 0,
        height: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 16}px)`,
        filter: isStrength ? 'drop-shadow(0 0 22px rgba(255,222,89,0.3))' : 'none',
      }}>
        <ActivityIcon kind={d.kind} draw={draw} color={iconColor} />
      </div>

      {/* activity label */}
      <div style={{
        position: 'absolute', bottom: 66, left: 0, right: 0,
        textAlign: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 14}px)`,
      }}>
        {isStrength ? (
          <React.Fragment>
            <div style={{ fontSize: 44, fontWeight: 500, color: GOLD, letterSpacing: '-0.01em' }}>Strengthen</div>
            <div style={{ fontSize: 36, fontWeight: 400, color: MUTED, marginTop: 6 }}>low back</div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ fontSize: 44, fontWeight: 400, color: '#E2E2E2', letterSpacing: '-0.01em' }}>Stay</div>
            <div style={{ fontSize: 36, fontWeight: 400, color: MUTED, marginTop: 6 }}>active</div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// fade a label from muted-white toward gold as it reveals
function interpHexToGold(e) {
  // from #FFFFFF to #FFDE59
  const g = Math.round(255 - (255 - 222) * e);
  const b = Math.round(255 - (255 - 89) * e);
  return `rgb(255,${g},${b})`;
}

function Scene() {
  const t = useTime();
  const camScale = interpolate([0, DUR], [1.0, 1.03], Easing.easeOutSine)(t);
  const light = Easing.easeOutSine(clamp((t - 0.1) / 2.0, 0, 1));
  const headP = Easing.easeOutCubic(clamp((t - 0.1) / 0.7, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale})`,
        transformOrigin: '50% 50%',
        willChange: 'transform',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 72% 60% at 50% 56%, rgba(255,222,89,0.05), rgba(255,222,89,0) 70%)',
          opacity: light, pointerEvents: 'none',
        }} />

        {/* header */}
        <div style={{
          position: 'absolute', top: 380, left: 0, right: 0,
          textAlign: 'center',
          opacity: headP,
          transform: `translateY(${(1 - headP) * 16}px)`,
        }}>
          <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: '0.18em', color: GOLD, textTransform: 'uppercase' }}>
            My week
          </div>
          <div style={{ fontSize: 92, fontWeight: 300, letterSpacing: '-0.02em', color: WHITE, marginTop: 30 }}>
            Every day has a job
          </div>
        </div>

        {DAYS.map((_, i) => <DayCard key={i} i={i} />)}
      </div>

      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 86% 86% at 50% 50%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none',
      }} />
      {/* grain */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.055, mixBlendMode: 'overlay', pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '600px 600px',
      }} />
    </div>
  );
}

function App() {
  return (
    <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-week">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
