const BASE = import.meta.env.VITE_API_BASE_URL || '';

function token() {
  return localStorage.getItem('mh_token');
}

export function setToken(t) {
  localStorage.setItem('mh_token', t);
}

export function clearToken() {
  localStorage.removeItem('mh_token');
}

export function isLoggedIn() {
  return !!token();
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (secret) => req('POST', '/api/auth/login', { secret }),

  // Admin
  metrics: () => req('GET', '/admin/metrics'),
  logs: (path) => req('GET', `/admin/logs${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  logView: (file, lines = 500, tail = true) =>
    req('GET', `/admin/logs/view?file=${encodeURIComponent(file)}&lines=${lines}&tail=${tail}`),

  // Users
  users: (page = 1, status, search) => {
    const p = new URLSearchParams({ page, page_size: 20 });
    if (status) p.set('status', status);
    if (search) p.set('search', search);
    return req('GET', `/api/users?${p}`);
  },
  updateUserStatus: (id, status) => req('PUT', `/api/users/${id}/status`, { status }),
  toggleAdmin: (id, isAdmin) => req('PUT', `/api/users/${id}/admin`, { is_admin: isAdmin }),

  // Reports
  reports: (page = 1, filters = {}) => {
    const p = new URLSearchParams({ page, page_size: 20 });
    if (filters.firm_nm) p.set('firm_nm', filters.firm_nm);
    if (filters.reg_dt) p.set('reg_dt', filters.reg_dt);
    if (filters.sync_status !== undefined && filters.sync_status !== '') p.set('sync_status', filters.sync_status);
    if (filters.search) p.set('search', filters.search);
    return req('GET', `/api/reports?${p}`);
  },
  updateReportSync: (id, sync, pdfSync) =>
    req('PUT', `/api/reports/${id}/sync`, { sync_status: sync, pdf_sync_status: pdfSync }),
  reportPdf: (id) => req('GET', `/api/reports/${id}/pdf`),
  fnguide: (page = 1, company) => {
    const p = new URLSearchParams({ page, page_size: 20 });
    if (company) p.set('company_name', company);
    return req('GET', `/api/reports/fnguide?${p}`);
  },
  sendHistory: (reportId, userId) => {
    const p = new URLSearchParams();
    if (reportId) p.set('report_id', reportId);
    if (userId) p.set('user_id', userId);
    return req('GET', `/api/reports/send-history?${p}`);
  },

  // Firms
  firms: (search) => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    return req('GET', `/api/firms?${p}`);
  },
};
