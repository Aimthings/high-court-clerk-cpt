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
  submitTyping: (attemptId, typed) =>
    request('/typing/attempt', { method: 'POST', body: { attemptId, typed } }),
  listMocks: () => request('/excel/mocks'),
  startExcel: (mockCode) => request('/excel/start', { method: 'POST', body: { mockCode } }),
  submitExcel: (attemptId, workbook) =>
    request('/excel/submit', { method: 'POST', body: { attemptId, workbook } }),
  me: () => request('/auth/me'),
  sendOtp: (phone) => request('/auth/otp/send', { method: 'POST', body: { phone } }),
  verifyOtp: (phone, code) => request('/auth/otp/verify', { method: 'POST', body: { phone, code } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  createOrder: () => request('/orders/create', { method: 'POST' }),
  leaderboard: (board) => request(`/leaderboard?board=${board}`),
  myRank: (board) => request(`/leaderboard/me?board=${board}`),
  setHandle: (handle) => request('/profile/handle', { method: 'PATCH', body: { handle } }),
  setListed: (listed) => request('/profile/listed', { method: 'PATCH', body: { listed } }),
};
