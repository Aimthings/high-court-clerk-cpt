// Single source of per-route SEO metadata. Used by <Seo> at runtime and by
// prerender.js at build time so every public route ships real HTML head tags.

export const SITE = {
  name: 'High Court Clerk CPT',
  short: 'Clerk CPT',
  url: 'https://highcourtexam.online', // live domain
  locale: 'en_IN',
  twitter: '@highcourtexam',
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
  '/practice/formulas': {
    title: 'Excel formula practice — 35 formulas · High Court Clerk CPT',
    description:
      'Learn and practise every Excel formula the C.P.T. can use — SUM, IF, VLOOKUP, INDEX/MATCH, SUMIF, text, date and more. A short lesson and a graded hands-on practice for each. Excel 2007 compatible.',
    keywords: ['excel formulas practice', 'CPT excel formulas', 'VLOOKUP INDEX MATCH practice', 'SUMIF IF formula tutorial'],
  },
  '/pricing': {
    title: 'Pricing — typing ₹79, Excel ₹119 · High Court Clerk CPT',
    description:
      'Two one-time products, bought separately: typing practice for ₹79 and Excel formula practice for ₹119. Not a subscription. Free during launch — 5 typing mocks, 1 Excel mock and 7 formula practices at no cost.',
    keywords: ['CPT practice price', 'high court clerk mock test fee', 'CPT typing ₹79', 'CPT excel ₹119'],
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
    title: 'Unlock full practice · High Court Clerk CPT',
    description:
      'Unlock the full practice: Excel formulas and mocks for ₹119, or all typing mocks and reports for ₹79. Each a one-time purchase, no auto-renewal.',
    keywords: ['CPT pass', 'unlock all mocks', 'CPT typing ₹79', 'CPT excel ₹119'],
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
  '/', '/the-exam', '/syllabus', '/practice/formulas', '/rank', '/pricing', '/scoring', '/contact', '/sign-in', '/pass',
];

export function metaFor(pathname) {
  return ROUTES[pathname] || ROUTES['/'];
}

const CRUMB = {
  '/the-exam': 'The exam', '/syllabus': 'Syllabus', '/rank': 'Rank list',
  '/pricing': 'Pricing', '/scoring': 'How scoring works', '/contact': 'Contact',
  '/sign-in': 'Sign in', '/pass': 'Get the pass',
};

const FAQ = {
  '/the-exam': [
    ['What is the C.P.T. for the High Court Clerk recruitment?',
      'A 20-minute practical test in two qualifying papers — English typing and an MS Excel spreadsheet practical — taken after the written exam. Both are pass/fail and do not add to the merit list.'],
    ['What are the passing marks in the C.P.T.?',
      'Typing must reach 30 W.P.M.; the Excel paper must score 4 out of 10. Both papers must be cleared.'],
  ],
  '/scoring': [
    ['How is the typing speed calculated?',
      'Speed is (words typed − mistakes) ÷ minutes. This is the S.S.S.C. rule — not conventional gross or net WPM. A word is five characters including spaces.'],
    ['How is the Excel paper marked?',
      'Five parts of two marks each, out of ten, pass at four. There is no negative marking; a wrong answer scores zero.'],
  ],
};

// JSON-LD graph for a route (Organization + Breadcrumb always; Course/FAQ where relevant).
export function jsonLdFor(pathname) {
  const org = {
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    description:
      'Practice platform for the Punjab & Haryana High Court / S.S.S.C. Clerk Computer Proficiency Test.',
  };
  const graph = [org];

  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url }];
  if (CRUMB[pathname]) {
    crumbs.push({ '@type': 'ListItem', position: 2, name: CRUMB[pathname], item: SITE.url + pathname });
  }
  graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });

  if (pathname === '/') {
    graph.push({
      '@type': 'Course',
      name: 'High Court Clerk CPT practice',
      description:
        'Practice material for the Computer Proficiency Test: MS Excel spreadsheet practical and English typing.',
      provider: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url },
    });
  }
  if (FAQ[pathname]) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: FAQ[pathname].map(([q, a]) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
