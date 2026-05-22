import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../views/Dashboard';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    metrics: vi.fn(),
  },
}));

import { api } from '../lib/api';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when metrics are not loaded', () => {
    api.metrics.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('SSH Management Hub')).toBeInTheDocument();
  });

  it('renders menu grid items after metrics load', async () => {
    api.metrics.mockResolvedValue({
      cpu: { percent: 25, cores: 4 },
      memory: { used_gb: 4, total_gb: 16, percent: 25 },
      disk: { used_gb: 20, total_gb: 100, percent: 20 },
      database: { status: 'online', latency_ms: 5 },
      reports: { total: 1000, today_inserts: 50 },
      last_activity: { last_firm: '삼성', last_save_time: '2026-01', last_title: 'Test' },
      oci2: { cpu_percent: 10, used_gb: 2, total_gb: 8, percent: 25, disk_used_gb: 15, disk_total_gb: 50, disk_percent: 30 },
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    });

    // All 6 menu items should be rendered
    expect(screen.getByText('리포트 관리')).toBeInTheDocument();
    expect(screen.getByText('증권사 관리')).toBeInTheDocument();
    expect(screen.getByText('DB 뷰어')).toBeInTheDocument();
    expect(screen.getByText('로그 뷰어')).toBeInTheDocument();
    expect(screen.getByText('진행 현황')).toBeInTheDocument();
  });

  it('displays quick stats when metrics are loaded', async () => {
    api.metrics.mockResolvedValue({
      cpu: { percent: 45, cores: 8 },
      memory: { used_gb: 8.5, total_gb: 32, percent: 26 },
      disk: { used_gb: 50, total_gb: 200, percent: 25 },
      database: { status: 'online', latency_ms: 3 },
      reports: { total: 5000, today_inserts: 120 },
      last_activity: { last_firm: 'Test', last_save_time: '', last_title: '' },
      oci2: null,
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('8.5GB')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });

  it('shows oci2 connection failed when oci2 is null', async () => {
    api.metrics.mockResolvedValue({
      cpu: { percent: 10, cores: 2 },
      memory: { used_gb: 2, total_gb: 8, percent: 25 },
      disk: { used_gb: 10, total_gb: 50, percent: 20 },
      database: { status: 'online', latency_ms: 2 },
      reports: { total: 100, today_inserts: 5 },
      last_activity: { last_firm: '', last_save_time: '', last_title: '' },
      oci2: null,
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/연결 실패/)).toBeInTheDocument();
    });
  });

  it('shows oci2 metrics when connected', async () => {
    api.metrics.mockResolvedValue({
      cpu: { percent: 10, cores: 2 },
      memory: { used_gb: 2, total_gb: 8, percent: 25 },
      disk: { used_gb: 10, total_gb: 50, percent: 20 },
      database: { status: 'online', latency_ms: 2 },
      reports: { total: 100, today_inserts: 5 },
      last_activity: { last_firm: '', last_save_time: '', last_title: '' },
      oci2: { cpu_percent: 50, used_gb: 4, total_gb: 12, percent: 33, disk_used_gb: 30, disk_total_gb: 48, disk_percent: 62 },
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('4GB')).toBeInTheDocument();
      expect(screen.getByText('30GB')).toBeInTheDocument();
    });
  });
});
