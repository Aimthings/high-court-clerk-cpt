// Thin fetch helper. Same-origin in production; Vite proxies /api in dev.
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const api = {
  listPassages: () => request('/passages'),
  getPassage: (slug) => request(`/passages/${slug}`),
  startTyping: (slug, mode) => request('/typing/start', { method: 'POST', body: { slug, mode } }),
  submitTyping: (attemptId, typed, telemetry = {}) =>
    request('/typing/attempt', { method: 'POST', body: { attemptId, typed, ...telemetry } }),
  typingHistory: () => request('/typing/history'),
  listMocks: () => request('/excel/mocks'),
  startExcel: (mockCode) => request('/excel/start', { method: 'POST', body: { mockCode } }),
  submitExcel: (attemptId, workbook) =>
    request('/excel/submit', { method: 'POST', body: { attemptId, workbook } }),
  me: () => request('/auth/me'),
  register: (email, password, name) => request('/auth/register', { method: 'POST', body: { email, password, name } }),
  verifyEmail: (email, code) => request('/auth/verify-email', { method: 'POST', body: { email, code } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  resendCode: (email) => request('/auth/resend-code', { method: 'POST', body: { email } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  createOrder: (product) => request('/orders/create', { method: 'POST', body: { product } }),
  leaderboard: (board) => request(`/leaderboard?board=${board}`),
  myRank: (board) => request(`/leaderboard/me?board=${board}`),
  setHandle: (handle) => request('/profile/handle', { method: 'PATCH', body: { handle } }),
  setListed: (listed) => request('/profile/listed', { method: 'PATCH', body: { listed } }),
  listFormulas: () => request('/formulas'),
  getFormula: (slug) => request(`/formulas/${slug}`),
  submitFormula: (slug, formula) => request(`/formulas/${slug}/practice`, { method: 'POST', body: { formula } }),
  getTypingProgress: () => request('/typing-course/progress'),
  saveTypingProgress: (lessons) => request('/typing-course/progress', { method: 'POST', body: { lessons } }),
};
