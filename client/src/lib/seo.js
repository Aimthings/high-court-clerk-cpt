// Single source of per-route SEO metadata. Used by <Seo> at runtime and by
// prerender.js at build time so every public route ships real HTML head tags.

export const SITE = {
  name: 'High Court Clerk CPT',
  short: 'Clerk CPT',
  url: 'https://highcourtclerkcpt.in', // update to the live domain at deploy
  locale: 'en_IN',
  twitter: '@highcourtclerkcpt',
};

// Public, prerendered routes and their metadata.
export const ROUTES = {
  '/': {
    title: 'High Court Clerk CPT — practise both C.P.T. papers',
    description:
      'Practice for the Punjab & Haryana High Court / S.S.S.C. Clerk Computer Proficiency Test: a 10-minute MS Excel spreadsheet paper and a 10-minute English typing paper, scored the way the exam runs them. First mock free.',
    keywords: [
      'High Court Clerk CPT',
      'P&H High Court Clerk CPT',
      'SSSC Clerk CPT practice',
      'CPT typing test 30 wpm',
      'Excel practical exam clerk',
    ],
  },
  '/the-exam': {
    title: 'The C.P.T. — what the exam is · High Court Clerk CPT',
    description:
      'What the Computer Proficiency Test is, who sits it, the two qualifying bars (30 W.P.M. typing and 4 of 10 in Excel), the hall rules, and the dates. Where the notice is silent, the page says so.',
    keywords: ['what is CPT high court clerk', 'CPT exam rules', 'CPT qualifying marks'],
  },
  '/syllabus': {
    title: 'C.P.T. syllabus · High Court Clerk CPT',
    description:
      'The C.P.T. syllabus stated from the official criteria: the typing paper, the Excel spreadsheet paper, and the skills each mock drills. Ambiguity is printed, not smoothed over.',
    keywords: ['CPT syllabus clerk', 'high court clerk exam syllabus', 'CPT excel topics'],
  },
  '/rank': {
    title: 'Public rank list · High Court Clerk CPT',
    description:
      'The public leaderboard for typing W.P.M. and Excel marks. No account needed to read it. Only exam-mode attempts are ranked; one number per candidate.',
    keywords: ['CPT rank list', 'high court clerk typing leaderboard', 'CPT wpm ranking'],
  },
  '/pricing': {
    title: 'Pricing — ₹99 for 45 days · High Court Clerk CPT',
    description:
      'One price: ₹99 for 45 days of full access, no auto-renewal. The first mock is free. UPI, card or netbanking. Refund rule and payment methods stated on the page.',
    keywords: ['CPT practice price', 'high court clerk mock test fee', 'CPT ₹99 pass'],
  },
  '/scoring': {
    title: 'How scoring works · High Court Clerk CPT',
    description:
      'The single page that explains both C.P.T. formulas: typing W.P.M. = (words typed − mistakes) ÷ minutes, pass at 30; Excel marked out of 10, pass at 4. Worked with real numbers, with the mistake classes listed.',
    keywords: ['CPT scoring formula', 'CPT wpm formula', 'how CPT typing is marked'],
  },
  '/contact': {
    title: 'Contact & policies · High Court Clerk CPT',
    description:
      'Contact routes, response times, and the terms, refund and privacy policies on one page, with the grievance contact stated as the payment gateway requires.',
    keywords: ['high court clerk cpt contact', 'refund policy', 'privacy policy'],
  },
  '/sign-in': {
    title: 'Sign in · High Court Clerk CPT',
    description:
      'Sign in with a phone number and a six-digit code. No password. Signing in is never required to read the rank list or take the first mock.',
    keywords: ['sign in', 'high court clerk cpt login'],
  },
  '/pass': {
    title: 'Get the ₹99 pass · High Court Clerk CPT',
    description:
      'Unlock every Excel mock and typing passage for 45 days for ₹99, with no auto-renewal. One price, one button.',
    keywords: ['CPT pass ₹99', 'unlock all mocks'],
  },
  '/pass/status': {
    title: 'Payment status · High Court Clerk CPT',
    description: 'Your payment result and pass validity.',
    keywords: ['payment status'],
    noindex: true,
  },
};

// Ordered list of public routes for the sitemap / prerender.
export const PUBLIC_ROUTES = [
  '/', '/the-exam', '/syllabus', '/rank', '/pricing', '/scoring', '/contact', '/sign-in', '/pass',
];

export function metaFor(pathname) {
  return ROUTES[pathname] || ROUTES['/'];
}

// JSON-LD graph for a route (Organization always; Course/FAQ where relevant).
export function jsonLdFor(pathname) {
  const org = {
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description:
      'Practice platform for the Punjab & Haryana High Court / S.S.S.C. Clerk Computer Proficiency Test.',
  };
  const graph = [org];
  if (pathname === '/') {
    graph.push({
      '@type': 'Course',
      name: 'High Court Clerk CPT practice',
      description:
        'Practice material for the Computer Proficiency Test: MS Excel spreadsheet practical and English typing.',
      provider: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url },
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
