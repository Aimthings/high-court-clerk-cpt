// Build-time static prerender for the public routes (brief §3, SEO).
// Runs after `vite build`. Uses a Vite dev server in middleware mode to
// SSR-render each public route into dist/<route>.html, injecting per-route
// head tags so every page returns real HTML with JavaScript disabled.
//
// nginx serves these via: try_files $uri $uri.html $uri/index.html /index.html

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { PUBLIC_ROUTES, ROUTES, SITE, jsonLdFor } from './src/lib/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
  // react-content-loader ships ESM only; bundle it for SSR so prerender (which
  // renders the loading skeletons) can import it instead of require()-ing it.
  ssr: { noExternal: ['react-content-loader'] },
});

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function headFor(pathname) {
  const m = ROUTES[pathname] || ROUTES['/'];
  const canonical = SITE.url + (pathname === '/' ? '' : pathname);
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.keywords ? `<meta name="keywords" content="${esc(m.keywords.join(', '))}" />` : '',
    `<meta name="robots" content="${m.noindex ? 'noindex,follow' : 'index,follow'}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<link rel="alternate" hreflang="en-IN" href="${esc(canonical)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(canonical)}" />`,
    `<meta name="theme-color" content="#0D2846" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLdFor(pathname))}</script>`,
  ];
  return tags.filter(Boolean).join('\n    ');
}

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
  for (const route of PUBLIC_ROUTES) {
    const appHtml = render(route);
    const html = template
      .replace('<!--seo-head-->', headFor(route))
      .replace('<!--app-html-->', appHtml);

    const outPath =
      route === '/' ? path.join(dist, 'index.html') : path.join(dist, `${route.replace(/^\//, '')}.html`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log('prerendered', route, '→', path.relative(dist, outPath));
  }

  // sitemap.xml + robots.txt in sync with the route list
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_ROUTES.filter((r) => !(ROUTES[r] && ROUTES[r].noindex))
    .map((r) => {
      const loc = SITE.url + (r === '/' ? '' : r);
      const priority = r === '/' ? '1.0' : '0.7';
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    })
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

  const robots = `User-agent: *\nAllow: /\nDisallow: /pass/status\nDisallow: /account\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
  fs.writeFileSync(path.join(dist, 'robots.txt'), robots);
  console.log('wrote sitemap.xml + robots.txt');
} finally {
  await vite.close();
}
