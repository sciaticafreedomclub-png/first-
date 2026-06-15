// render.js — render Cinematic Line.html to MP4 via Playwright + ffmpeg
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

// Serve static files from __dirname
function startServer(port = 3971) {
  const mime = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.jsx': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml',
  };
  const server = http.createServer((req, res) => {
    const ext = path.extname(req.url).toLowerCase();
    const filePath = path.join(__dirname, req.url === '/' ? 'render_standalone.html' : req.url);
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  return new Promise(resolve => server.listen(port, () => resolve({ server, port })));
}

const FRAMES_DIR = path.join(__dirname, 'frames');
const FPS = 24;
const DURATION = 3; // seconds
const TOTAL_FRAMES = FPS * DURATION; // 72
// Render at 1920x1080 (scales down from 4K design); ffmpeg upscale if needed
const WIDTH = 1920;
const HEIGHT = 1080;

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR);

(async () => {
  const { server, port } = await startServer();

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  const htmlPath = `http://localhost:${port}/render_standalone.html`;
  // Log console messages from the page
  page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(htmlPath, { waitUntil: 'domcontentloaded' });

  // Expose a way to freeze time via window.__seekTo
  // The Stage uses TimelineContext.setTime — we need to reach it.
  // Strategy: override requestAnimationFrame after load so time is frozen,
  // then manually set time via React internals or a patched approach.
  //
  // Simpler: inject a global that scene.jsx's useTime reads, by patching
  // the TimelineContext value. We do this by evaluating after mount.

  // Wait for Stage to mount and expose __stageCtrl
  await page.waitForFunction(() => !!window.__stageCtrl, { timeout: 10000 });

  // Hide playback bar for clean export
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* hide scrubber / playback bar */
      [data-playback-bar], .playback-bar { display: none !important; }
    `;
    document.head.appendChild(style);
    // Also pause immediately
    if (window.__stageCtrl) window.__stageCtrl.setPlaying(false);
  });

  // Find and hide the playback bar by walking up from known controls
  await page.evaluate(() => {
    // The playback bar is the last flex child of the stage root
    const root = document.getElementById('root');
    if (!root) return;
    const stageDiv = root.firstElementChild;
    if (!stageDiv) return;
    // Stage has two children: canvas area and playback bar
    const children = [...stageDiv.children];
    if (children.length >= 2) {
      // Last child is PlaybackBar
      children[children.length - 1].style.display = 'none';
    }
  });

  console.log('Stage ready. Rendering frames...');

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS;

    await page.evaluate((seekTime) => {
      if (window.__stageCtrl) {
        window.__stageCtrl.setPlaying(false);
        window.__stageCtrl.setTime(seekTime);
      }
    }, t);

    // Wait for React to re-render
    await page.waitForTimeout(80);

    const framePath = path.join(FRAMES_DIR, `frame_${String(frame).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

    if (frame % 8 === 0) process.stdout.write(`\r  frame ${frame + 1}/${TOTAL_FRAMES}`);
  }

  console.log('\nAll frames captured. Encoding MP4...');
  await browser.close();

  // Encode to MP4 with ffmpeg
  const outputPath = path.join(__dirname, 'cinematic_line.mp4');
  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%04d.png" ` +
    `-vf "scale=1920:1080:flags=lanczos" ` +
    `-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p ` +
    `"${outputPath}"`,
    { stdio: 'inherit' }
  );

  server.close();
  console.log('Done! Output:', outputPath);
})();
