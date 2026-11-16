// The sitemap: every indexable page, and only those. The functional pages (verify, reset-password,
// invite, 404) are noindex and stay out. Add a route here when a page is added.
import type { APIRoute } from 'astro';

export const PAGES = ['/', '/faq', '/privacy', '/terms', '/data-processing', '/support', '/delete-account'];

export const GET: APIRoute = ({ site }) => {
  const urls = PAGES.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
