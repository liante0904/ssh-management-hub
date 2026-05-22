import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// We test the api module by importing it - but it uses import.meta.env
// Let's test the core functionality: token management
import { setToken, clearToken, api } from '../lib/api';

describe('API Token Management', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
  });

  it('setToken stores token in localStorage', () => {
    setToken('test-token-123');
    expect(localStorage.getItem('mh_token')).toBe('test-token-123');
  });

  it('clearToken removes token from localStorage', () => {
    localStorage.setItem('mh_token', 'some-token');
    clearToken();
    expect(localStorage.getItem('mh_token')).toBeNull();
  });
});

describe('API Endpoint Methods', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('api object has all required methods', () => {
    const methods = ['metrics', 'logs', 'logView', 'users', 'updateUserStatus',
      'toggleAdmin', 'deleteUser', 'dbTables', 'dbQuery', 'reports',
      'updateReportSync', 'firms', 'updateFirm', 'firmBoards',
      'createFirmBoard', 'updateFirmBoard', 'deleteFirmBoard'];
    
    methods.forEach(method => {
      expect(typeof api[method]).toBe('function');
    });
  });

  it('api.users builds correct query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ users: [], total: 0, page_size: 20 }),
    });

    await api.users(1, 'active', 'test');
    
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('page=1');
    expect(url).toContain('page_size=20');
    expect(url).toContain('status=active');
    expect(url).toContain('search=test');
  });

  it('api.reports builds correct query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ reports: [], total: 0, page_size: 20 }),
    });

    await api.reports(1, { firm_nm: '삼성', sync_status: -1 });
    
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('firm_nm=%EC%82%BC%EC%84%B1');
    expect(url).toContain('sync_status=-1');
  });
});
