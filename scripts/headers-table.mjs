// The expected security headers for every route. check-headers.mjs consumes it.
export const STRICT  = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const CONTENT = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const HOME    = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export const COMMON = {
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

/** @type {Array<{ path: string; csp: string; noStore: boolean; json?: boolean }>} */
export const ROUTES = [
  { path: '/', csp: HOME, noStore: false },
  { path: '/privacy', csp: CONTENT, noStore: false },
  { path: '/terms', csp: CONTENT, noStore: false },
  { path: '/terms/2026-12-01', csp: CONTENT, noStore: false },
  { path: '/data-processing', csp: CONTENT, noStore: false },
  { path: '/support', csp: CONTENT, noStore: false },
  { path: '/delete-account', csp: CONTENT, noStore: false },
  { path: '/verify?token=a', csp: STRICT, noStore: true },
  { path: '/reset-password?token=a', csp: STRICT, noStore: true },
  { path: '/invite', csp: STRICT, noStore: true },
  { path: '/i/ABC123', csp: STRICT, noStore: true },
  { path: '/i/abc/', csp: STRICT, noStore: true },
  { path: '/no-such-page', csp: STRICT, noStore: false },
  { path: '/.well-known/assetlinks.json', csp: STRICT, noStore: false, json: true },
  { path: '/.well-known/apple-app-site-association', csp: STRICT, noStore: false, json: true },
];
