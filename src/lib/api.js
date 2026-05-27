function token() {
  return localStorage.getItem('mh_token');
}

export function setToken(t) {
  localStorage.setItem('mh_token', t);
}

export function clearToken() {
  localStorage.removeItem('mh_token');
}

const BASE = import.meta.env.VITE_API_BASE_URL || '';

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
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Admin
  metrics: () => req('GET', '/admin/metrics'),
  logs: (p) => req('GET', `/admin/logs${p ? `?path=${encodeURIComponent(p)}` : ''}`),
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
  deleteUser: (id) => req('DELETE', `/api/users/${id}`),

  // DB Viewer
  dbTables: () => req('GET', '/admin/db/tables'),
  dbQuery: (table, opts = {}) => {
    const { limit = 50, offset = 0, order_by, order_dir } = opts;
    const p = new URLSearchParams({ limit, offset });
    if (order_by) p.set('order_by', order_by);
    if (order_dir) p.set('order_dir', order_dir);
    return req('GET', `/admin/db/query/${encodeURIComponent(table)}?${p}`);
  },
  dbComment: (tableName, comment, columnName) =>
    req('PUT', '/admin/db/comment', { table_name: tableName, comment, column_name: columnName || null }),
  dbSqlQuery: (query, limit = 50) => req('POST', '/admin/db/query', { query, limit }),

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

  // PDF Archive
  pdfArchive: (page = 1, filters = {}) => {
    const p = new URLSearchParams({ page, page_size: 20 });
    if (filters.firm_nm) p.set('firm_nm', filters.firm_nm);
    if (filters.archive_status) p.set('archive_status', filters.archive_status);
    if (filters.reg_dt) p.set('reg_dt', filters.reg_dt);
    if (filters.sync_status !== undefined && filters.sync_status !== '') p.set('sync_status', filters.sync_status);
    if (filters.pdf_sync_status !== undefined && filters.pdf_sync_status !== '') p.set('pdf_sync_status', filters.pdf_sync_status);
    if (filters.download_status_yn) p.set('download_status_yn', filters.download_status_yn);
    if (filters.search) p.set('search', filters.search);
    if (filters.sort) p.set('sort', filters.sort);
    return req('GET', `/api/reports/pdf-archive?${p}`);
  },
  pdfArchiveStatsDaily: (days = 30) => req('GET', `/api/reports/pdf-archive/stats/daily?days=${days}`),
  pdfArchiveStatsByFirm: () => req('GET', `/api/reports/pdf-archive/stats/by-firm`),
  pdfArchiveReprocess: (body) => req('POST', '/api/reports/pdf-archive/reprocess', body),

  // Firms
  firms: (search) => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    return req('GET', `/api/firms?${p}`);
  },
  updateFirm: (orderId, data) => req('PUT', `/api/firms/${orderId}`, data),
  firmBoards: (orderId) => req('GET', `/api/firms/${orderId}/boards`),
  createFirmBoard: (orderId, data) => req('POST', `/api/firms/${orderId}/boards`, data),
  updateFirmBoard: (orderId, boardOrder, data) => req('PUT', `/api/firms/${orderId}/boards/${boardOrder}`, data),
  deleteFirmBoard: (orderId, boardOrder) => req('DELETE', `/api/firms/${orderId}/boards/${boardOrder}`),
};
