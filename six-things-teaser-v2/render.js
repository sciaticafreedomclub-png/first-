const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

function startServer(port = 3974) {
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.jsx': 'application/javascript' };
  const server = http.createServer((req, res) => {
    const ext = path.extname(req.url).toLowerCase();
    const filePath = path.join(__dirname, req.url === '/' ? 'render_standalone.html' : req.url);
    try { const data = fs.readFileSync(filePath); res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' }); res.end(data); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(resolve => server.listen(port, () => resolve({ server, port })));
}

const FRAMES_DIR = path.join(__dirname, 'frames');
const FPS = 24;
const DURATION = 6;
const TOTAL_FRAMES = FPS * DURATION;
const WIDTH = 1920;
const HEIGHT = 1080;

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR);

(async () => {
  const { server, port } = await startServer();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({ colorScheme: 'dark' });
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  page.on('console', msg => { if (msg.type() === 'error') console.log('PAGE ERR:', msg.text()); });

  await page.goto(`http://localhost:${port}/render_standalone.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__stageCtrl, { timeout: 15000 });

  await page.evaluate(() => {
    if (window.__stageCtrl) window.__stageCtrl.setPlaying(false);
    // Hide playback bar (last child of stage div)
    const stageDiv = document.getElementById('root').firstElementChild;
    if (stageDiv) {
      const kids = [...stageDiv.children];
      if (kids.length >= 2) kids[kids.length - 1].style.display = 'none';
    }
  });

  console.log(`Rendering ${TOTAL_FRAMES} frames with alpha...`);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const t = frame / FPS;
    await page.evaluate((seekTime) => {
      if (window.__stageCtrl) { window.__stageCtrl.setPlaying(false); window.__stageCtrl.setTime(seekTime); }
    }, t);
    await page.waitForTimeout(80);
    // omitBackground: true gives us a transparent PNG
    await page.screenshot({
      path: path.join(FRAMES_DIR, `frame_${String(frame).padStart(4, '0')}.png`),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      omitBackground: true,
    });
    if (frame % 12 === 0) process.stdout.write(`\r  frame ${frame + 1}/${TOTAL_FRAMES}`);
  }

  console.log('\nEncoding outputs...');
  await browser.close();
  server.close();

  // MP4 on black (H.264 has no alpha — composite over black background)
  const mp4Path = path.join(__dirname, 'six_things_teaser_v2.mp4');
  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%04d.png" ` +
    `-vf "scale=1920:1080:flags=lanczos,format=yuva420p,split[v][a];[v]drawbox=c=black:replace=1:t=fill[bg];[bg][a]overlay" ` +
    `-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p "${mp4Path}"`,
    { stdio: 'inherit' }
  );
  console.log('MP4 done:', mp4Path);

  // WebM with alpha (VP9 — transparent, for compositing in video editors)
  const webmPath = path.join(__dirname, 'six_things_teaser_v2_alpha.webm');
  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%04d.png" ` +
    `-c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 "${webmPath}"`,
    { stdio: 'inherit' }
  );
  console.log('WebM+alpha done:', webmPath);
})();
