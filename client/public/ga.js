// Google Analytics (GA4) initialiser — kept in an external file (not inline) so
// the site's Content-Security-Policy can stay strict (no 'unsafe-inline' scripts).
// The gtag.js loader is added in index.html; this queues the initial config.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-YFFC1J8XW4');
