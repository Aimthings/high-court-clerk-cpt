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
    title: 'High Court Clerk Typing & Excel Practice — C.P.T. Mock Tests',
    description:
      'Free practice for the Punjab & Haryana High Court / S.S.S.C. Clerk Computer Proficiency Test: high court clerk typing tests (30 W.P.M.) and MS Excel spreadsheet practice, scored exactly the way the exam runs them. A fresh typing passage and Excel mock every day. First mock free.',
    keywords: [
      'high court clerk typing practice',
      'high court clerk excel practice',
      'high court clerk CPT',
      'clerk CPT typing test 30 wpm',
      'clerk CPT excel mock test',
      'P&H High Court Clerk CPT',
      'SSSC Clerk CPT practice',
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
    title: 'Excel Formula Practice for Clerk C.P.T. — 37 formulas',
    description:
      'Learn and practise every Excel formula the High Court Clerk C.P.T. can use — SUM, IF, VLOOKUP, INDEX/MATCH, SUMIF, text, date and more. A short lesson and a graded hands-on practice for each. Excel 2007 compatible.',
    keywords: ['excel formulas practice', 'CPT excel formulas', 'high court clerk excel practice', 'VLOOKUP INDEX MATCH practice', 'SUMIF IF formula tutorial'],
  },
  '/pricing': {
    title: 'Pricing — from ₹69, everything ₹169 · High Court Clerk CPT',
    description:
      'One-time purchases, no subscription: Typing Master course ₹69, Typing Complete ₹99, Excel Mock ₹119, Excel Complete ₹139, or All-Access ₹169. Free for everyone during the launch.',
    keywords: ['CPT practice price', 'high court clerk mock test fee', 'CPT typing course price', 'CPT excel mock price'],
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
      'Contact routes, response times, and the terms, refund and privacy policies on one page.',
    keywords: ['high court clerk cpt contact', 'refund policy', 'privacy policy'],
  },
  '/sign-in': {
    title: 'Sign in · High Court Clerk CPT',
    description:
      'Sign in with your email and password. New accounts verify with a six-digit email code. Signing in is never required to read the rank list or take the first mock.',
    keywords: ['sign in', 'high court clerk cpt login'],
  },
  '/pass': {
    title: 'Unlock full practice · High Court Clerk CPT',
    description:
      'Unlock the practice you need: Typing Master ₹69, Typing Complete ₹99, Excel Mock ₹119, Excel Complete ₹139, or everything with All-Access ₹169. One-time, 2 months, no auto-renewal.',
    keywords: ['CPT pass', 'unlock all mocks', 'CPT typing course', 'CPT all access'],
  },
  '/pass/status': {
    title: 'Payment status · High Court Clerk CPT',
    description: 'Your payment result and pass validity.',
    keywords: ['payment status'],
    noindex: true,
  },
  '/learn/typing': {
    title: 'Typing Master — free touch-typing course for Clerk C.P.T.',
    description:
      'A free, from-zero touch-typing course for the High Court Clerk C.P.T.: home row, top row, bottom row, capitals, numbers, punctuation, words and speed. Learn the keyboard by finger, then take the graded 30 W.P.M. mock.',
    keywords: ['learn typing', 'touch typing course', 'high court clerk typing practice', 'CPT typing practice', 'typing speed 30 wpm', 'home row'],
  },
};

// Ordered list of public routes for the sitemap / prerender.
export const PUBLIC_ROUTES = [
  '/', '/the-exam', '/syllabus', '/learn/typing', '/practice/formulas', '/rank', '/pricing', '/scoring', '/contact', '/sign-in', '/pass',
];

export function metaFor(pathname) {
  return ROUTES[pathname] || ROUTES['/'];
}

const CRUMB = {
  '/the-exam': 'The exam', '/syllabus': 'Syllabus', '/rank': 'Rank list',
  '/learn/typing': 'Typing Master', '/practice/formulas': 'Excel formula practice',
  '/pricing': 'Pricing', '/scoring': 'How scoring works', '/contact': 'Contact',
  '/sign-in': 'Sign in', '/pass': 'Get the pass',
};

const FAQ = {
  '/': [
    ['Is the High Court Clerk typing and Excel practice free?',
      'Yes — during the launch every typing passage and Excel mock is free once you sign in, and the first mock needs no account at all. A fresh passage and a fresh Excel mock are added every day.'],
    ['How is the typing test scored?',
      'By the S.S.S.C. rule: W.P.M. = (words typed − mistakes) ÷ minutes, with a pass at 30 W.P.M. The Excel paper is marked out of 10 with a pass at 4.'],
    ['Which exam is this practice for?',
      'The Computer Proficiency Test (C.P.T.) for the Punjab & Haryana High Court / S.S.S.C. Clerk recruitment — an English typing paper and an MS Excel spreadsheet practical.'],
  ],
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
  '/pricing': [
    ['How much does the practice cost?',
      'One-time purchases, no subscription: Typing Master ₹69, Typing Complete ₹99, Excel Mock ₹119, Excel Complete ₹139, or All-Access ₹169 for two months. Everything is free during the launch.'],
    ['Is there a subscription or auto-renewal?',
      'No. Every plan is a one-time payment valid for two months, with no auto-renewal.'],
  ],
};

// JSON-LD graph for a route (Organization + Breadcrumb always; Course/FAQ where relevant).
// Provider org, reused by Course nodes.
const provider = () => ({ '@type': 'Organization', name: SITE.name, url: SITE.url });

// Topic-specific Course schema per route (helps Google understand each page).
const COURSE = {
  '/': {
    name: 'High Court Clerk C.P.T. — typing and Excel practice',
    description: 'Practice for the Computer Proficiency Test: an MS Excel spreadsheet practical and an English typing test, with a fresh passage and mock added daily.',
  },
  '/learn/typing': {
    name: 'Typing Master — touch-typing for the High Court Clerk C.P.T.',
    description: 'A free, from-zero touch-typing course: home row to full speed, then a graded 30 W.P.M. mock.',
  },
  '/practice/formulas': {
    name: 'Excel formula practice for the High Court Clerk C.P.T.',
    description: 'Every Excel formula the C.P.T. can use, each with a short lesson and a graded hands-on practice. Excel 2007 compatible.',
  },
};

export function jsonLdFor(pathname) {
  const org = {
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/apple-touch-icon.png`,
    description:
      'Practice platform for the Punjab & Haryana High Court / S.S.S.C. Clerk Computer Proficiency Test.',
  };
  const website = {
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'en-IN',
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
  const graph = [org, website];

  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url }];
  if (CRUMB[pathname]) {
    crumbs.push({ '@type': 'ListItem', position: 2, name: CRUMB[pathname], item: SITE.url + pathname });
  }
  graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });

  if (COURSE[pathname]) {
    graph.push({
      '@type': 'Course',
      name: COURSE[pathname].name,
      description: COURSE[pathname].description,
      provider: provider(),
      inLanguage: 'en-IN',
      isAccessibleForFree: true,
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
