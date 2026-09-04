// Client mirror of the server product catalog (server/config.js is the source of
// truth for prices — these labels/prices are for display; the server always
// re-derives the charged amount from the product id). `caps` mirrors what each
// product unlocks so the UI can show an "owned" state.
export const CATALOG = [
  {
    id: 'typing_course', label: 'Typing Master course', price: 69, caps: ['typingCourse'], start: '/learn/typing',
    tag: 'Learn to type', features: ['All 11 learn-to-type modules', 'On-screen finger guidance', 'Saved progress & per-key heat map'],
  },
  {
    id: 'typing_complete', label: 'Typing Complete', price: 99, caps: ['typingCourse', 'typingMocks'], start: '/mocks',
    tag: 'Course + mocks', features: ['Everything in the course', 'All typing mocks (rankable)', 'Exam mode with A4 passage PDFs'],
  },
  {
    id: 'excel_mock', label: 'Excel Mock', price: 119, caps: ['excelMocks'], start: '/mocks',
    tag: 'Excel practical', features: ['All Excel spreadsheet mocks', 'Server-graded, layout-independent', 'Mistake breakdown per part'],
  },
  {
    id: 'excel_complete', label: 'Excel Complete', price: 139, caps: ['excelMocks', 'formulaLibrary'], start: '/practice/formulas',
    tag: 'Mocks + formulas', features: ['Everything in Excel Mock', 'Full Formula Library — 37 lessons', 'Graded formula practice'],
  },
  {
    id: 'all_access', label: 'All-Access', price: 169, caps: ['typingCourse', 'typingMocks', 'excelMocks', 'formulaLibrary'], start: '/mocks',
    tag: 'Best value', highlight: true, features: ['Everything above, in one', 'Typing course + all typing mocks', 'Excel mocks + full formulas'],
  },
];
