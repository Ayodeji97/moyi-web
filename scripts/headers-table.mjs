// The expected security headers for every route. check-headers.mjs consumes it.
export const STRICT  = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const CONTENT = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const HOME    = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export const COMMON = {
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

/**
 * `status` is what the route must answer. Only a route expected to 404 may carry the platform's own
 * no-store on its 404 (check-headers.mjs), so a page that goes missing can no longer pass.
 * @type {Array<{ path: string; csp: string; noStore: boolean; status: number; json?: boolean }>}
 */
export const ROUTES = [
  { path: '/', csp: HOME, noStore: false, status: 200 },
  { path: '/faq', csp: CONTENT, noStore: false, status: 200 },
  { path: '/privacy', csp: CONTENT, noStore: false, status: 200 },
  { path: '/terms', csp: CONTENT, noStore: false, status: 200 },
  // The dated copy is published when the owner approves the text (spec 6.9); until then it 404s.
  { path: '/terms/2026-12-01', csp: CONTENT, noStore: false, status: 404 },
  { path: '/data-processing', csp: CONTENT, noStore: false, status: 200 },
  { path: '/support', csp: CONTENT, noStore: false, status: 200 },
  { path: '/delete-account', csp: CONTENT, noStore: false, status: 200 },
  { path: '/verify?token=a', csp: STRICT, noStore: true, status: 200 },
  { path: '/reset-password?token=a', csp: STRICT, noStore: true, status: 200 },
  { path: '/invite', csp: STRICT, noStore: true, status: 200 },
  { path: '/i/ABC123', csp: STRICT, noStore: true, status: 200 },
  // A trailing slash is the same invite page (backend #207): _redirects rewrites /i/:code/ too.
  { path: '/i/abc/', csp: STRICT, noStore: true, status: 200 },
  { path: '/no-such-page', csp: STRICT, noStore: false, status: 404 },
  { path: '/sitemap.xml', csp: STRICT, noStore: false, status: 200 },
  { path: '/robots.txt', csp: STRICT, noStore: false, status: 200 },
  { path: '/og.png', csp: STRICT, noStore: false, status: 200 },
  { path: '/.well-known/assetlinks.json', csp: STRICT, noStore: false, status: 200, json: true },
  { path: '/.well-known/apple-app-site-association', csp: STRICT, noStore: false, status: 200, json: true },
];
