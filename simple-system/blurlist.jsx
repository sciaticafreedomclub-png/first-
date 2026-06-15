// blurlist.jsx — "Simple System" blurred-list animation (no branding)
// VO (6s): "I just have a very simple system that I follow that teaches my
//          body that movement is safe again by doing the right things in
//          the right order."

const { useTime, Easing, clamp, interpolate } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakSlider } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "blur": 16,
  "opacity": 46
}/*EDITMODE-END*/;

const W = 3840;
const H = 2160;
const DUR = 6;
const GOLD = '#FFDE59';
const WHITE = '#FFFFFF';

const ITEMS = [
  'Cut out all caffeine',
  "Don't have more than 2 routine habits",
  'Optimize your sleep',
  'Stop just resting',
  'Stick to only a few exercises that move the needle',
  'Not doing back extension strengthening every single day',
];

// list geometry
const LIST_LEFT = 470;
const LIST_TOP = 470;
const ROW_H = 248;          // vertical pitch between rows
const FONT = 86;
const NUM_W = 150;

// reveal timing
const BASE_START = 0.35;
const STAGGER = 0.72;
const ROW_DUR = 0.78;

function rowEase(i, t) {
  const s = BASE_START + i * STAGGER;
  const p = clamp((t - s) / ROW_DUR, 0, 1);
  return Easing.easeOutCubic(p);
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

// A single list row: crisp gold numeral, blurred white caption.
function Row({ i, text, restBlur, textOpacity }) {
  const t = useTime();
  const e = rowEase(i, t);
  const ty = (1 - e) * 48;
  const textBlur = (1 - e) * 22 + restBlur;   // settles to a deliberate soft blur
  return (
    <div style={{
      position: 'absolute',
      left: LIST_LEFT,
      top: LIST_TOP + i * ROW_H,
      width: 3000,
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      transform: `translateY(${ty}px)`,
      willChange: 'transform, opacity',
    }}>
      <div style={{
        width: NUM_W,
        flexShrink: 0,
        fontSize: FONT,
        fontWeight: 500,
        color: GOLD,
        letterSpacing: '-0.02em',
        opacity: e,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {i + 1}
      </div>
      <div style={{
        fontSize: FONT,
        fontWeight: 400,
        color: WHITE,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        opacity: e * textOpacity,
        filter: `blur(${textBlur}px)`,
        whiteSpace: 'nowrap',
        willChange: 'filter, opacity',
      }}>
        {text}
      </div>
    </div>
  );
}

// Gold guide-line down the left — draws downward as the list builds.
function GuideBar() {
  const t = useTime();
  let h = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    h += rowEase(i, t) * ROW_H;
  }
  const top = LIST_TOP + FONT * 0.08;
  return (
    <div style={{
      position: 'absolute',
      left: LIST_LEFT - 64,
      top,
      width: 8,
      height: Math.max(0, h - 70),
      background: GOLD,
      borderRadius: 4,
      boxShadow: '0 0 36px rgba(255,222,89,0.28)',
    }} />
  );
}

function Scene({ restBlur, textOpacity }) {
  const t = useTime();

  const camScale = interpolate([0, DUR], [1.0, 1.045], Easing.easeOutSine)(t);
  const camY = interpolate([0, DUR], [26, -26], Easing.easeOutSine)(t);

  const lightP = clamp((t - 0.1) / 2.4, 0, 1);
  const light = Easing.easeOutSine(lightP);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E0E0E' }}>
      <ScreenLabel />

      {/* Camera */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${camScale}) translateY(${camY}px)`,
        transformOrigin: '24% 50%',
        willChange: 'transform',
      }}>
        {/* Warm key light behind the list */}
        <div style={{
          position: 'absolute',
          left: '4%', top: '4%',
          width: '64%', height: '92%',
          background: 'radial-gradient(ellipse 60% 60% at 26% 46%, rgba(255,222,89,0.08), rgba(255,222,89,0) 70%)',
          opacity: light,
          pointerEvents: 'none',
        }} />

        <GuideBar />
        {ITEMS.map((text, i) => (
          <Row key={i} i={i} text={text} restBlur={restBlur} textOpacity={textOpacity} />
        ))}
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 40% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.58) 100%)',
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
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return (
    <React.Fragment>
      <Stage width={W} height={H} duration={DUR} fps={24} background="#0E0E0E" persistKey="sfc-system">
        <Scene restBlur={tw.blur} textOpacity={tw.opacity / 100} />
      </Stage>
      <TweaksPanel>
        <TweakSection label="Legibility" />
        <TweakSlider label="Blur" value={tw.blur} min={2} max={48} step={1} unit="px"
                     onChange={(v) => setTweak('blur', v)} />
        <TweakSlider label="Readability" value={tw.opacity} min={6} max={100} step={1} unit="%"
                     onChange={(v) => setTweak('opacity', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
