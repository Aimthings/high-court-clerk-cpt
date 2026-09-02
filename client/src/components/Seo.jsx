import { useEffect } from 'react';
import { SITE, metaFor, jsonLdFor } from '../lib/seo.js';

// Runtime head sync. Prerender writes the same tags statically at build time;
// this keeps them correct during client-side navigation.
export default function Seo({ pathname }) {
  useEffect(() => {
    const meta = metaFor(pathname);
    document.title = meta.title;
    setMeta('description', meta.description);
    if (meta.keywords) setMeta('keywords', meta.keywords.join(', '));

    const canonical = SITE.url + (pathname === '/' ? '' : pathname);
    setLink('canonical', canonical);
    setMeta('robots', meta.noindex ? 'noindex,follow' : 'index,follow', true);

    // Open Graph / Twitter
    setMeta('og:title', meta.title, true, 'property');
    setMeta('og:description', meta.description, true, 'property');
    setMeta('og:url', canonical, true, 'property');
    setMeta('og:type', 'website', true, 'property');
    setMeta('og:site_name', SITE.name, true, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);

    setJsonLd(jsonLdFor(pathname));
  }, [pathname]);

  return null;
}

function setMeta(name, content, replace = true, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  if (replace || !el.getAttribute('content')) el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(obj) {
  let el = document.head.querySelector('script[type="application/ld+json"]');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}
