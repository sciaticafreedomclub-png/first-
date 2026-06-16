// bedroom.jsx — "Bedroom just for sleeping" — single accumulating slide.
// One thread links four icons; each icon + caption appears in turn and STAYS,
// so the whole journey is visible by the end. No crossfades, no long dashes.
// VO (10.2s): "This is such a small thing but keep your bedroom just for
//   sleeping and just for rest and so whenever you enter that bedroom, the
//   only thing that you're doing is switching off your mind, switching off
//   your brain, and you're sleeping."

const { useTime, Easing, clamp, interpolate } = window;

const W = 3840;
const H = 2160;
const DUR = 10.2;
const GOLD = '#FFDE59';
const WHITE = '#FFFFFF';

// ---- Line icons (stroke draws on as the node appears) -------------------
function Icon({ name, draw, size = 300 }) {
  const off = 1 - clamp(draw, 0, 1);
  const stroke = {
    fill: 'none',
    stroke: GOLD,
    strokeWidth: 5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: off,
  };
  const common = {
    width: size, height: size,
    overflow: 'visible',
    filter: 'drop-shadow(0 0 24px rgba(255,222,89,0.28))',
  };
  if (name === 'bed') {
    return (
      <svg viewBox="0 0 200 130" style={common}>
        <path d="M18 38 L18 104" style={stroke} />
        <path d="M18 74 L182 74" style={stroke} />
        <path d="M182 74 L182 104" style={stroke} />
        <path d="M18 104 L182 104" style={stroke} />
        <path d="M40 74 Q40 52 64 52 L108 52 Q132 52 132 74" style={stroke} />
      </svg>
    );
  }
  if (name === 'door') {
    return (
      <svg viewBox="0 0 140 180" style={common}>
        <path d="M30 18 L110 18 L110 162 L30 162 Z" style={stroke} />
        <path d="M30 162 L118 162" style={stroke} />
        <circle cx="96" cy="92" r="5" style={stroke} />
      </svg>
    );
  }
  if (name === 'power') {
    return (
      <svg viewBox="0 0 160 160" style={common}>
        <path d="M80 26 L80 78" style={stroke} />
        <path d="M52 44 A44 44 0 1 0 108 44" style={stroke} />
      </svg>
    );
  }
  // moon
  return (
    <svg viewBox="0 0 160 160" style={common}>
      <path d="M104 30 A56 56 0 1 0 118 122 A44 44 0 1 1 104 30 Z" style={stroke} />
      <circle cx="60" cy="44" r="2.5" style={{ fill: GOLD, stroke: 'none' }} />
      <circle cx="46" cy="64" r="1.8" style={{ fill: GOLD, stroke: 'none' }} />
    </svg>
  );
}

// ---- Nodes along one gentle thread, left to right -----------------------
const CAPTION_Y = 1400;   // every caption sits on this baseline, clear of icons
const NODES = [
  { x: 560,  y: 980,  icon: 'bed',   start: 0.5,  caption: ['Just for sleeping', 'and rest'] },
  { x: 1480, y: 1065, icon: 'door',  start: 2.8,  caption: ['When you walk in'] },
  { x: 2400, y: 985,  icon: 'power', start: 5.1,  caption: ['Switch off your', 'mind and brain'] },
  { x: 3300, y: 1055, icon: 'moon',  start: 7.6,  caption: ['And you sleep'] },
];

const NODE_DRAW = 1.0;
function nodeIn(i, t) {
  return Easing.easeOutCubic(clamp((t - NODES[i].start) / NODE_DRAW, 0, 1));
}

// Catmull-Rom smooth path through node centers
function smoothPath(pts) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
const PATH_D = smoothPath(NODES);
const THREAD_TIMES = NODES.map((n) => n.start + NODE_DRAW * 0.25);
const THREAD_FRACS = NODES.map((_, i) => i / (NODES.length - 1));

function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const r = document.getElementById('video-root');
    if (r) r.dataset.screenLabel = 't=' + sec + 's';
  }, [sec]);
  return null;
}

function Thread() {
  const t = useTime();
  const draw = interpolate(THREAD_TIMES, THREAD_FRACS, Easing.easeInOutCubic)(t);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{
      position: 'absolute', inset: 0, overflow: 'visible',
      filter: 'drop-shadow(0 0 18px rgba(255,222,89,0.4))',
      pointerEvents: 'none',
    }}>
      <path d={PATH_D} fill="none" stroke={GOLD} strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round"
        pathLength="1" strokeDasharray="1"
        strokeDashoffset={1 - clamp(draw, 0, 1)} opacity="0.8" />
    </svg>
  );
}

function Node({ i }) {
  const t = useTime();
  const n = NODES[i];
  const e = nodeIn(i, t);
  if (e <= 0.001) return null;

  const iconSize = 280;
  // caption fades in just after the icon starts drawing, then stays
  const capP = Easing.easeOutCubic(clamp((t - n.start - 0.45) / 0.7, 0, 1));

  return (
    <React.Fragment>
      {/* icon, on the thread */}
      <div style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        transform: `translate(-50%, calc(-50% + ${(1 - e) * 26}px))`,
        opacity: e,
        filter: `blur(${(1 - e) * 7}px)`,
        willChange: 'transform, opacity',
      }}>
        <Icon name={n.icon} draw={e} size={iconSize} />
      </div>
      {/* caption, on the shared baseline below */}
      <div style={{
        position: 'absolute',
        left: n.x,
        top: CAPTION_Y,
        transform: `translate(-50%, ${(1 - capP) * 18}px)`,
        opacity: capP,
        width: 720,
        textAlign: 'center',
      }}>
        {n.caption.map((ln, k) => (
          <div key={k} style={{
            fontSize: 60,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: WHITE,
            whiteSpace: 'nowrap',
          }}>
            {ln}
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

function Scene() {
  const t = useTime();

  // very gentle push-in, no scene swaps
  const camScale = interpolate([0, DUR], [1.0, 1.045], Easing.easeOutSine)(t);
  const lightP = clamp((t - 0.1) / 2.0, 0, 1);
  const light = Easing.easeOutSine(lightP);

  // persistent eyebrow
  const eyeP = Easing.easeOutCubic(clamp((t - 0.1) / 0.7, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />

      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale})`,
        transformOrigin: '50% 48%',
        willChange: 'transform',
      }}>
        {/* warm ambient pool */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 48% at 50% 47%, rgba(255,222,89,0.06), rgba(255,222,89,0) 70%)',
          opacity: light,
          pointerEvents: 'none',
        }} />

        {/* eyebrow */}
        <div style={{
          position: 'absolute',
          top: 470,
          left: 0, right: 0,
          textAlign: 'center',
          opacity: eyeP,
          transform: `translateY(${(1 - eyeP) * 16}px)`,
        }}>
          <div style={{
            fontSize: 38,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: GOLD,
            textTransform: 'uppercase',
          }}>
            One small thing
          </div>
          <div style={{
            fontSize: 96,
            fontWeight: 300,
            letterSpacing: '-0.02em',
            color: WHITE,
            marginTop: 34,
          }}>
            Keep your bedroom just for sleeping
          </div>
        </div>

        <Thread />
        {NODES.map((_, i) => <Node key={i} i={i} />)}
      </div>

      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 82% 82% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {/* film grain */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.06,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '600px 600px',
      }} />
    </div>
  );
}

function App() {
  return (
    <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-bedroom">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
