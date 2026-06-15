// scene.jsx — Cinematic line reveal for Sciatica Freedom Club
// "I thought becoming a PT would give me the answers to fix it"

const { useTime, Easing, clamp, interpolate } = window;

const W = 3840;
const H = 2160;
const DUR = 3;
const GOLD = '#FFDE59';
const WHITE = '#FFFFFF';

// Keeps the comment-anchor timestamp current (≈1s granularity)
function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const r = document.getElementById('video-root');
    if (r) r.dataset.screenLabel = 't=' + sec + 's';
  }, [sec]);
  return null;
}

// A line of the quote: fades + rises up through a soft focus blur.
function RevealLine({ start, weight, color, children, dim = false }) {
  const t = useTime();
  const dur = 0.78;
  const p = clamp((t - start) / dur, 0, 1);
  const e = Easing.easeOutCubic(p);
  return (
    <div style={{
      fontSize: 170,
      lineHeight: 1.14,
      fontWeight: weight,
      color,
      letterSpacing: '-0.03em',
      opacity: dim ? e * 0.92 : e,
      transform: `translateY(${(1 - e) * 52}px)`,
      filter: `blur(${(1 - e) * 11}px)`,
      willChange: 'transform, opacity, filter',
    }}>
      {children}
    </div>
  );
}

// The gold word "the answers" — same reveal, plus a soft glow bloom that
// swells slightly after it lands, so the eye is drawn to the pivot of the line.
function GoldWord({ start, children }) {
  const t = useTime();
  const dur = 0.78;
  const p = clamp((t - start) / dur, 0, 1);
  const e = Easing.easeOutCubic(p);
  // glow blooms in just after the word settles
  const glow = clamp((t - (start + 0.55)) / 0.9, 0, 1);
  const g = Easing.easeOutSine(glow);
  return (
    <span style={{
      color: GOLD,
      fontWeight: 500,
      opacity: e,
      textShadow: `0 0 ${28 + g * 46}px rgba(255,222,89,${0.18 + g * 0.4})`,
    }}>
      {children}
    </span>
  );
}

// Gold accent bar — brand signature element — draws outward near the end.
function AccentBar() {
  const t = useTime();
  const p = clamp((t - 1.55) / 0.85, 0, 1);
  const e = Easing.easeOutCubic(p);
  return (
    <div style={{
      height: 9,
      width: `${e * 560}px`,
      background: GOLD,
      marginTop: 72,
      borderRadius: 2,
    }} />
  );
}

// SFC signature — bolt + wordmark — settles in last, quiet and muted.
function Signature() {
  const t = useTime();
  const p = clamp((t - 2.05) / 0.8, 0, 1);
  const e = Easing.easeOutCubic(p);
  return (
    <div style={{
      position: 'absolute',
      left: 484,
      bottom: 210,
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      opacity: e * 0.9,
      transform: `translateY(${(1 - e) * 16}px)`,
    }}>
      <svg width="34" height="51" viewBox="0 0 32 48" fill="none">
        <polygon points="18,4 8,26 16,26 10,44 26,18 17,18 24,4" fill={GOLD} />
      </svg>
      <span style={{
        fontSize: 38,
        fontWeight: 500,
        letterSpacing: '0.16em',
        color: '#A8A8A8',
        textTransform: 'uppercase',
      }}>
        Sciatica Freedom Club
      </span>
    </div>
  );
}

function Scene() {
  const t = useTime();

  // Slow cinematic push-in, anchored near the text block.
  const camScale = interpolate([0, DUR], [1.0, 1.055], Easing.easeOutSine)(t);
  const camY = interpolate([0, DUR], [0, -14], Easing.easeOutSine)(t);

  // Warm key light blooms gently as the words arrive.
  const lightP = clamp((t - 0.1) / 1.6, 0, 1);
  const light = Easing.easeOutSine(lightP);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />

      {/* Camera */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale}) translateY(${camY}px)`,
        transformOrigin: '22% 50%',
        willChange: 'transform',
      }}>
        {/* Warm key light, behind the text */}
        <div style={{
          position: 'absolute',
          left: '8%', top: '6%',
          width: '70%', height: '88%',
          background: 'radial-gradient(ellipse 60% 55% at 30% 42%, rgba(255,222,89,0.10), rgba(255,222,89,0) 70%)',
          opacity: light,
          pointerEvents: 'none',
        }} />

        {/* Text block */}
        <div style={{ position: 'absolute', left: 484, top: 706, width: 3000 }}>
          <RevealLine start={0.18} weight={300} color={WHITE}>I thought becoming a PT</RevealLine>
          <RevealLine start={0.62} weight={300} color={WHITE}>
            would give me <GoldWord start={0.62}>the answers</GoldWord>
          </RevealLine>
          <RevealLine start={1.06} weight={300} color={WHITE} dim>to fix it</RevealLine>
          <AccentBar />
        </div>

        <Signature />
      </div>

      {/* Vignette — frames the shot */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 78% 78% at 38% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Film grain */}
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
    <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-line">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
