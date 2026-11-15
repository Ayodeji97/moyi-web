// Usage: node scripts/check-headers.mjs <baseUrl>
// Fetches every route without following redirects, asserts its headers,
// prints one line per route, exits non-zero on any failure.
import { COMMON, ROUTES } from './headers-table.mjs';

const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!base) {
  console.error('usage: node scripts/check-headers.mjs <baseUrl>');
  process.exit(2);
}

let failed = 0;
for (const r of ROUTES) {
  const problems = [];
  let res;
  let body = '';
  try {
    res = await fetch(base + r.path, { redirect: 'manual' });
    body = await res.text();
  } catch (e) {
    problems.push(`fetch failed: ${e.message}`);
  }
  if (res) {
    const csp = res.headers.get('content-security-policy');
    if (csp !== r.csp) problems.push(`csp is ${JSON.stringify(csp)}, expected ${JSON.stringify(r.csp)}`);
    for (const [k, v] of Object.entries(COMMON)) {
      const got = res.headers.get(k);
      if (got !== v) problems.push(`${k} is ${JSON.stringify(got)}, expected ${JSON.stringify(v)}`);
    }
    const hasNoStore = (res.headers.get('cache-control') ?? '').includes('no-store');
    // wrangler pages dev (and Pages itself) mark the platform's own 404 response
    // no-store; that is not from _headers, so on a 404 only a missing no-store
    // on a noStore route is a failure.
    const platform404 = res.status === 404 && !r.noStore;
    if (hasNoStore !== r.noStore && !platform404) {
      problems.push(`cache-control ${JSON.stringify(res.headers.get('cache-control'))}: no-store ${hasNoStore}, expected ${r.noStore}`);
    }
    if (r.json) {
      if (res.status !== 200) problems.push(`status ${res.status}, expected 200`);
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.startsWith('application/json')) problems.push(`content-type ${JSON.stringify(ct)}, expected application/json`);
      if (res.headers.has('location')) problems.push(`unexpected location ${res.headers.get('location')}`);
    }
    if (r.path === '/i/ABC123') {
      if (res.status !== 200) problems.push(`status ${res.status}, expected 200`);
      if (!body.includes('data-link="invite"')) problems.push('body lacks data-link="invite"');
    }
  }
  if (problems.length) {
    failed++;
    console.log(`FAIL ${r.path}${res ? ` (${res.status})` : ''}`);
    for (const p of problems) console.log(`     ${p}`);
  } else {
    console.log(`ok   ${r.path} (${res.status})`);
  }
}
console.log(failed ? `${failed} route(s) failed` : 'all routes ok');
process.exit(failed ? 1 : 0);
