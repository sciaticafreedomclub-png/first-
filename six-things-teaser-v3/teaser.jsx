// teaser.jsx — "6 things" anticipation graphic.
// Just the numerals 1–6, flowing along a gold thread, no words.
// VO (6s): "Now these are the 6 things you can implement today, from the
//          least important to the one that changed everything."

const { useTime, Easing, clamp, interpolate } = window;

const W = 3840;
const H = 2160;
const DUR = 3;
const GOLD = '#FFDE59';

// Each numeral flows along a gentle wave; size + brightness ramp up toward #6.
const NODES = [
  { x: 560,  y: 1080, size: 200 },
  { x: 1090, y: 1218, size: 252 },
  { x: 1620, y: 1232, size: 308 },
  { x: 2150, y: 1110, size: 372 },
  { x: 2680, y: 968,  size: 444 },
  { x: 3210, y: 922,  size: 560, gold: true },
];

const BASE_START = 0.2;
const STAGGER = 0.42;
const NODE_DUR = 0.6;

function nodeEase(i, t) {
  const s = BASE_START + i * STAGGER;
  return Easing.easeOutCubic(clamp((t - s) / NODE_DUR, 0, 1));
}

// Smooth Catmull-Rom path through the node centers.
function smoothPath(pts) {
  if (pts.length < 2) return '';
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

// thread draws in sync with the numerals arriving
const NODE_TIMES = NODES.map((_, i) => BASE_START + i * STAGGER + NODE_DUR * 0.35);
const NODE_FRACS = NODES.map((_, i) => i / (NODES.length - 1));

function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const r = document.getElementById('video-root');
    if (r) r.dataset.screenLabel = 't=' + sec + 's';
  }, [sec]);
  return null;
}

function Numeral({ i, node }) {
  const t = useTime();
  const e = nodeEase(i, t);
  const ty = (1 - e) * 44;
  const blur = (1 - e) * 16;

  const gold = node.gold;
  const baseOpacity = gold ? 1 : 0.42 + i * 0.11;
  const pulse = gold ? 0.5 + 0.5 * Math.sin((t - 2.0) * 2.3) : 0;

  return (
    <div style={{
      position: 'absolute',
      left: node.x,
      top: node.y,
      transform: 'translate(-50%, -50%)',
      willChange: 'transform, opacity',
    }}>
      <div style={{
        fontSize: node.size,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: gold ? GOLD : '#FFFFFF',
        opacity: e * baseOpacity,
        transform: `translateY(${ty}px)`,
        filter: `blur(${blur}px)`,
        textShadow: gold
          ? `0 0 ${50 + pulse * 80}px rgba(255,222,89,${0.4 + pulse * 0.35})`
          : '0 0 40px rgba(0,0,0,0.5)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {i + 1}
      </div>
    </div>
  );
}

// The label for item 1, sitting above the first numeral.
function Label() {
  const t = useTime();
  const start = 0.45, dur = 0.6;
  const e = Easing.easeOutCubic(clamp((t - start) / dur, 0, 1));
  const n = NODES[0];
  return (
    <div style={{
      position: 'absolute',
      left: n.x,
      top: n.y - n.size * 0.5 - 168,
      transform: `translate(-50%, ${(1 - e) * 36}px)`,
      opacity: e,
      filter: `blur(${(1 - e) * 10}px)`,
      whiteSpace: 'nowrap',
      willChange: 'transform, opacity',
    }}>
      <div style={{
        fontSize: 78,
        fontWeight: 400,
        color: '#FFFFFF',
        letterSpacing: '-0.01em',
        textShadow: '0 0 44px rgba(0,0,0,0.7)',
      }}>
        Cut out all caffeine
      </div>
    </div>
  );
}

function Thread() {
  const t = useTime();
  const draw = interpolate(NODE_TIMES, NODE_FRACS, Easing.easeInOutCubic)(t);
  return (
    <svg
      width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{
        position: 'absolute', inset: 0,
        overflow: 'visible',
        filter: 'drop-shadow(0 0 22px rgba(255,222,89,0.45))',
        pointerEvents: 'none',
      }}
    >
      <path
        d={PATH_D}
        fill="none"
        stroke={GOLD}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - clamp(draw, 0, 1)}
        opacity="0.85"
      />
    </svg>
  );
}

function Scene() {
  const t = useTime();

  const camScale = interpolate([0, DUR], [1.02, 1.06], Easing.easeOutSine)(t);
  // gentle free-flowing drift of the whole composition
  const floatX = 16 * Math.sin(t * 0.5);
  const floatY = 20 * Math.sin(t * 0.66 + 1.2);

  const lightP = clamp((t - 0.1) / 1.2, 0, 1);
  const light = Easing.easeOutSine(lightP);
  const payoff = Easing.easeOutSine(clamp((t - 2.0) / 0.9, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />

      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale})`,
        transformOrigin: '50% 50%',
        willChange: 'transform',
      }}>
        {/* ambient warm light */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 48% 50%, rgba(255,222,89,0.06), rgba(255,222,89,0) 70%)',
          opacity: light,
          pointerEvents: 'none',
        }} />
        {/* payoff glow pool behind #6 */}
        <div style={{
          position: 'absolute',
          left: NODES[5].x - 700,
          top: NODES[5].y - 500,
          width: 1400, height: 1000,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,222,89,0.16), rgba(255,222,89,0) 70%)',
          opacity: payoff,
          pointerEvents: 'none',
        }} />

        {/* flowing group */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${floatX}px, ${floatY}px)`,
          willChange: 'transform',
        }}>
          <Thread />
          {NODES.map((node, i) => <Numeral key={i} i={i} node={node} />)}
          <Label />
        </div>
      </div>

      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 82% 82% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.58) 100%)',
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
    <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-teaser">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
