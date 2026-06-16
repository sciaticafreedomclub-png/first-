// machine.jsx — "The 45 degree back extension machine" cinematic piece (13s).
// VO: "The 45 degree back extension machine is the most potent, scalable, and
//      effective exercise by far. It taught my low back that contraction was
//      safe again and let my nervous system's guard down to stop sending
//      shooting pain down my leg."
//
// Visual arc: a line-figure performs back extensions on a 45 deg bench, then
// HOLDS the contraction (spine glows gold = "safe"); a harsh white pain bolt
// flickers down the leg early, then dissolves to nothing (nervous system
// stands down). Lower-third captions carry the two sentences.

const { useTime, Easing, clamp, interpolate } = window;

const W = 3840;
const H = 2160;
const DUR = 13;
const GOLD = '#FFDE59';
const WHITE = '#FFFFFF';
const MUTED = '#A8A8A8';
const MACHINE = 'rgba(255,255,255,0.20)';

// ---- machine / body geometry -------------------------------------------
const HIP = { x: 1920, y: 980 };
const LEG_LEN = 480;
const TORSO_LEN = 560;
const LEG_DIR = { x: Math.cos((135 * Math.PI) / 180), y: Math.sin((135 * Math.PI) / 180) }; // down-left (feet at bottom of bench)
const FOOT = { x: HIP.x + LEG_DIR.x * LEG_LEN, y: HIP.y + LEG_DIR.y * LEG_LEN };

const A_EXT = (-45 * Math.PI) / 180;  // torso fully extended (up-right, in line w/ bench)
const A_FLEX = (24 * Math.PI) / 180;  // torso flexed down (rounded forward)

// torso angle over time: a couple of slow reps, then settle & HOLD in extension
function torsoAngle(t) {
  const mid = (A_EXT + A_FLEX) / 2;
  const amp = (A_FLEX - A_EXT) / 2;
  const cycle = 3.1;
  const decay = 1 - clamp((t - 4.4) / 2.0, 0, 1);     // reps fade out by ~6.4s
  const center = mid * decay + A_EXT * (1 - decay);
  const osc = -Math.cos((t / cycle) * 2 * Math.PI);    // starts at full extension
  return center + amp * decay * osc;
}

function pt(angle, len) {
  return { x: HIP.x + Math.cos(angle) * len, y: HIP.y + Math.sin(angle) * len };
}

// jagged lightning path for the pain bolt
function makeBolt(a, b, segs, amp, seed) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const px = -dy / len, py = dx / len;
  let d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    const x = a.x + dx * f, y = a.y + dy * f;
    const s = (((i * 9301 + seed * 49297) % 233280) / 233280);
    const off = (i % 2 === 0 ? 1 : -1) * amp * (0.45 + s);
    d += ` L ${(x + px * off).toFixed(1)} ${(y + py * off).toFixed(1)}`;
  }
  d += ` L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  return d;
}

function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const r = document.getElementById('video-root');
    if (r) r.dataset.screenLabel = 't=' + sec + 's';
  }, [sec]);
  return null;
}

function Figure() {
  const t = useTime();
  const a = torsoAngle(t);
  const torsoEnd = pt(a, TORSO_LEN);
  const head = pt(a, TORSO_LEN + 60);
  const legPerp = { x: -LEG_DIR.y, y: LEG_DIR.x };

  // contraction "safe" glow ramps in with sentence 2, then stays
  const safe = Easing.easeOutSine(clamp((t - 5.2) / 1.6, 0, 1));
  // top-of-extension emphasis
  const atTop = clamp((A_FLEX - a) / (A_FLEX - A_EXT), 0, 1);
  const spineGlow = Math.max(safe, atTop * 0.4);

  // pain bolt: appears early, flickers erratically, dissolves as guard comes down
  const painIn = clamp((t - 0.8) / 0.6, 0, 1);
  const painFade = 1 - Easing.easeInOutSine(clamp((t - 9.4) / 2.6, 0, 1));
  const flicker = 0.45 + 0.55 * Math.abs(Math.sin(t * 19) * Math.sin(t * 6.3));
  const painOp = painIn * painFade * flicker;
  const boltSeed = Math.floor(t * 20);
  const painA = { x: HIP.x + LEG_DIR.x * 130, y: HIP.y + LEG_DIR.y * 130 };
  const painB = { x: FOOT.x + LEG_DIR.x * 200, y: FOOT.y + LEG_DIR.y * 200 };
  const boltD = makeBolt(painA, painB, 9, 46, boltSeed);

  // spine ticks along the torso
  const dir = { x: Math.cos(a), y: Math.sin(a) };
  const perp = { x: -dir.y, y: dir.x };
  const ticks = [];
  const NT = 7;
  for (let i = 1; i <= NT; i++) {
    const f = 0.16 + (i / (NT + 1)) * 0.84;
    const cx = HIP.x + dir.x * TORSO_LEN * f;
    const cy = HIP.y + dir.y * TORSO_LEN * f;
    const half = 24;
    ticks.push({
      x1: cx - perp.x * half, y1: cy - perp.y * half,
      x2: cx + perp.x * half, y2: cy + perp.y * half,
    });
  }

  // 45-degree angle callout (beat A only)
  const angleOp = Easing.easeOutCubic(clamp((t - 0.6) / 0.8, 0, 1)) *
                  (1 - Easing.easeInCubic(clamp((t - 4.6) / 0.6, 0, 1)));

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{
      position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none',
    }}>
      {/* ---- machine (muted) ---- */}
      {/* incline beam */}
      <line x1={FOOT.x + LEG_DIR.x * 70} y1={FOOT.y + LEG_DIR.y * 70} x2={HIP.x} y2={HIP.y}
            stroke={MACHINE} strokeWidth="22" strokeLinecap="round" />
      {/* support post + base */}
      <line x1="1750" y1="1200" x2="1750" y2="1460" stroke={MACHINE} strokeWidth="16" strokeLinecap="round" />
      <line x1="1600" y1="1460" x2="1900" y2="1460" stroke={MACHINE} strokeWidth="16" strokeLinecap="round" />
      {/* hip pad */}
      <line x1={HIP.x - legPerp.x * 60} y1={HIP.y - legPerp.y * 60} x2={HIP.x + legPerp.x * 60} y2={HIP.y + legPerp.y * 60}
            stroke="rgba(255,255,255,0.32)" strokeWidth="30" strokeLinecap="round" />
      {/* ankle rollers */}
      <circle cx={FOOT.x + 6} cy={FOOT.y - 30} r="30" stroke={MACHINE} strokeWidth="12" fill="none" />
      <circle cx={FOOT.x - 36} cy={FOOT.y + 18} r="30" stroke={MACHINE} strokeWidth="12" fill="none" />

      {/* ---- 45 deg callout ---- */}
      <g opacity={angleOp}>
        <line x1={HIP.x} y1={HIP.y} x2={HIP.x + 230} y2={HIP.y}
              stroke="rgba(255,222,89,0.5)" strokeWidth="3" strokeDasharray="10 12" />
        <path d={`M ${HIP.x + 150} ${HIP.y} A 150 150 0 0 0 ${HIP.x + 150 * Math.cos(A_EXT)} ${HIP.y + 150 * Math.sin(A_EXT)}`}
              fill="none" stroke={GOLD} strokeWidth="4" />
        <text x={HIP.x + 196} y={HIP.y - 78} fill={GOLD} fontSize="58" fontWeight="500"
              fontFamily="Inter, sans-serif" letterSpacing="-1">45°</text>
      </g>

      {/* ---- pain bolt (harsh white, fading) ---- */}
      <path d={boltD} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round"
            strokeLinejoin="round" opacity={painOp}
            style={{ filter: `drop-shadow(0 0 ${10 + painOp * 22}px rgba(255,255,255,${0.5 * painOp}))` }} />

      {/* ---- body (white) ---- */}
      {/* legs */}
      <line x1={HIP.x} y1={HIP.y} x2={FOOT.x} y2={FOOT.y}
            stroke={WHITE} strokeWidth="18" strokeLinecap="round" opacity="0.92" />
      {/* torso */}
      <line x1={HIP.x} y1={HIP.y} x2={torsoEnd.x} y2={torsoEnd.y}
            stroke={WHITE} strokeWidth="20" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 ${spineGlow * 26}px rgba(255,222,89,${spineGlow * 0.5}))` }} />
      {/* head */}
      <circle cx={head.x} cy={head.y} r="46" fill="none" stroke={WHITE} strokeWidth="18" />

      {/* ---- spine ticks (gold, glow on contraction) ---- */}
      {ticks.map((tk, i) => (
        <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={GOLD} strokeWidth="9" strokeLinecap="round"
              opacity={0.25 + spineGlow * 0.75}
              style={{ filter: `drop-shadow(0 0 ${spineGlow * 18}px rgba(255,222,89,${spineGlow * 0.7}))` }} />
      ))}

      {/* contraction pulse ring at the lower back */}
      <circle cx={HIP.x} cy={HIP.y} r={70 + safe * 40 + Math.sin(t * 3) * 10 * safe}
              fill="none" stroke={GOLD} strokeWidth="4"
              opacity={safe * (0.4 + 0.3 * Math.sin(t * 3))} />
    </svg>
  );
}

// ---- text beats ---------------------------------------------------------
function beatOp(t, inT, outT) {
  const a = Easing.easeOutCubic(clamp((t - inT) / 0.6, 0, 1));
  const b = Easing.easeInCubic(clamp((t - outT) / 0.6, 0, 1));
  return a * (1 - b);
}

function Eyebrow({ children }) {
  return (
    <div style={{
      fontSize: 36, fontWeight: 500, letterSpacing: '0.18em',
      color: GOLD, textTransform: 'uppercase', marginBottom: 34,
    }}>{children}</div>
  );
}

function StaggerWords({ t, start, words }) {
  return (
    <div style={{ display: 'flex', gap: 44, justifyContent: 'center' }}>
      {words.map((w, i) => {
        const e = Easing.easeOutCubic(clamp((t - start - i * 0.32) / 0.6, 0, 1));
        return (
          <span key={i} style={{
            fontSize: 132, fontWeight: 500, letterSpacing: '-0.02em', color: GOLD,
            opacity: e, transform: `translateY(${(1 - e) * 26}px)`,
            display: 'inline-block', textShadow: '0 0 50px rgba(255,222,89,0.22)',
          }}>{w}</span>
        );
      })}
    </div>
  );
}

function Beats() {
  const t = useTime();
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1560, height: 520, textAlign: 'center' }}>
      {/* Beat A — the machine + qualities */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: beatOp(t, 0.2, 4.7) }}>
        <Eyebrow>The 45° back extension machine</Eyebrow>
        <StaggerWords t={t} start={1.0} words={['Potent.', 'Scalable.', 'Effective.']} />
        <div style={{ fontSize: 52, fontWeight: 300, color: MUTED, marginTop: 40, letterSpacing: '-0.01em' }}>
          the most effective exercise, by far
        </div>
      </div>

      {/* Beat B — what it did */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 24, opacity: beatOp(t, 5.0, 8.9) }}>
        <Eyebrow>What it rebuilt</Eyebrow>
        <div style={{ fontSize: 104, fontWeight: 300, lineHeight: 1.14, letterSpacing: '-0.02em', color: WHITE }}>
          It taught my low back that
        </div>
        <div style={{ fontSize: 104, fontWeight: 300, lineHeight: 1.14, letterSpacing: '-0.02em', color: WHITE }}>
          <span style={{ color: GOLD, fontWeight: 500 }}>contraction</span> was safe again
        </div>
      </div>

      {/* Beat C — nervous system stands down */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 24, opacity: beatOp(t, 9.1, 99) }}>
        <Eyebrow>And then</Eyebrow>
        <div style={{ fontSize: 104, fontWeight: 300, lineHeight: 1.14, letterSpacing: '-0.02em', color: WHITE }}>
          My nervous system stood down
        </div>
        <div style={{ fontSize: 56, fontWeight: 300, color: MUTED, marginTop: 36, letterSpacing: '-0.01em' }}>
          no more pain shooting down my leg
        </div>
      </div>
    </div>
  );
}

function Scene() {
  const t = useTime();
  const camScale = interpolate([0, DUR], [1.0, 1.06], Easing.easeOutSine)(t);
  const light = Easing.easeOutSine(clamp((t - 0.1) / 2.2, 0, 1));
  // frame warms as the body heals
  const warm = Easing.easeOutSine(clamp((t - 5.0) / 4.0, 0, 1));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale})`, transformOrigin: '50% 44%', willChange: 'transform',
      }}>
        {/* warm key light behind the figure */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 46% 42% at 50% 42%, rgba(255,222,89,0.10), rgba(255,222,89,0) 70%)',
          opacity: light * (0.6 + warm * 0.4), pointerEvents: 'none',
        }} />
        {/* floor wash */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%',
          background: 'linear-gradient(to top, rgba(255,222,89,0.05), rgba(255,222,89,0))',
          opacity: light, pointerEvents: 'none',
        }} />
        <Figure />
        <Beats />
      </div>

      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 84% 84% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />
      {/* grain */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay', pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: '600px 600px',
      }} />
    </div>
  );
}

function App() {
  return (
    <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-machine">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
