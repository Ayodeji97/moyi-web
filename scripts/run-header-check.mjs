// Serves dist/ with wrangler pages dev, runs check-headers against it, always stops wrangler.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const PORT = 8788;
const URL_ = `http://localhost:${PORT}`;

// Probe each loopback address explicitly: a bind to "::" can succeed on macOS
// while another process holds 127.0.0.1:PORT.
function portFreeOn(host) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', (e) => resolve(e.code === 'EADDRNOTAVAIL' || e.code === 'EAFNOSUPPORT'));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(PORT, host);
  });
}

async function answers(url) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(2000) });
    await r.arrayBuffer();
    return true;
  } catch { return false; }
}

// One at a time: concurrent probes would collide with each other.
let free = true;
for (const h of ['127.0.0.1', '::1', '::', '0.0.0.0']) free = (await portFreeOn(h)) && free;
const answered = (await Promise.all([`http://localhost:${PORT}/`, `http://127.0.0.1:${PORT}/`, `http://[::1]:${PORT}/`].map(answers))).some(Boolean);
if (!free || answered) {
  console.error(`port ${PORT} busy: something is already listening; stop it and retry (a stale server would make the check pass falsely)`);
  process.exit(1);
}

const wrangler = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
});
let log = '';
wrangler.stdout.on('data', (d) => (log += d));
wrangler.stderr.on('data', (d) => (log += d));
let exited = false;
wrangler.on('exit', () => (exited = true));

function stop() {
  if (exited) return;
  try { process.kill(-wrangler.pid, 'SIGTERM'); } catch { /* already gone */ }
}
process.on('SIGINT', () => { stop(); process.exit(130); });
process.on('SIGTERM', () => { stop(); process.exit(143); });

async function waitUp() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (exited) return false;
    try {
      const r = await fetch(`${URL_}/`, { redirect: 'manual' });
      await r.arrayBuffer();
      return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

let code = 1;
try {
  if (await waitUp()) {
    code = await new Promise((resolve) => {
      const c = spawn('node', ['scripts/check-headers.mjs', URL_], { stdio: 'inherit' });
      c.on('exit', (n) => resolve(n ?? 1));
    });
  } else {
    console.error('wrangler did not answer within 30 s');
    console.error(log);
  }
} finally {
  stop();
}
process.exit(code);
