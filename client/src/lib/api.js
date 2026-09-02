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
};
