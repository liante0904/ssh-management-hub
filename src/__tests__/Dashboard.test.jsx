import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../views/Dashboard';
import { ToastProvider } from '../components/ui/ToastContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    metrics: vi.fn(),
  },
}));

import { api } from '../lib/api';

function renderWithRouter(ui) {
  return render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>
  );
}

const mockMetrics = {
  cpu: { percent: 25, cores: 4 },
  memory: { used_gb: 4, total_gb: 16, percent: 25 },
  disk: { used_gb: 20, total_gb: 100, percent: 20 },
  database: { status: 'online', latency_ms: 5 },
  reports: { total: 1000, today_inserts: 50 },
  last_activity: { last_firm: '삼성', last_save_time: '2026-01', last_title: 'Test Report' },
  oci: { cpu_percent: 12, used_gb: 2.5, total_gb: 8, percent: 31, disk_used_gb: 30, disk_total_gb: 45, disk_percent: 67 },
  oci2: { cpu_percent: 10, used_gb: 2, total_gb: 8, percent: 25, disk_used_gb: 15, disk_total_gb: 50, disk_percent: 30 },
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows title when metrics are not loaded', () => {
    api.metrics.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('SSH Management Hub')).toBeInTheDocument();
  });

  it('renders all 7 quick menu items after metrics load', async () => {
    api.metrics.mockResolvedValue(mockMetrics);
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    });

    expect(screen.getByText('리포트 관리')).toBeInTheDocument();
    expect(screen.getByText('PDF 관리')).toBeInTheDocument();
    expect(screen.getByText('증권사 관리')).toBeInTheDocument();
    expect(screen.getByText('DB 뷰어')).toBeInTheDocument();
    expect(screen.getByText('로그 뷰어')).toBeInTheDocument();
    expect(screen.getByText('진행 현황')).toBeInTheDocument();
  });

  it('shows OCI and OCI2 connection status in header', async () => {
    api.metrics.mockResolvedValue(mockMetrics);
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      const ociItems = screen.getAllByText(/OCI 배포/);
      const oci2Items = screen.getAllByText(/OCI2 프로덕션/);
      expect(ociItems.length).toBeGreaterThanOrEqual(1);
      expect(oci2Items.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows both server cards with CPU/RAM/Disk', async () => {
    api.metrics.mockResolvedValue(mockMetrics);
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      // OCI server card
      expect(screen.getByText('OCI 배포서버')).toBeInTheDocument();
      // OCI2 server card
      expect(screen.getByText('OCI2 프로덕션')).toBeInTheDocument();
    });

    // OCI metrics
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText(/2\.5G/)).toBeInTheDocument();

    // OCI2 metrics
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText(/2G/)).toBeInTheDocument();
  });

  it('shows connection failed for OCI when null', async () => {
    api.metrics.mockResolvedValue({
      ...mockMetrics,
      oci: null,
    });
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/🔴 OCI\b/)).toBeInTheDocument();
    });
  });

  it('shows connection failed for OCI2 when null', async () => {
    api.metrics.mockResolvedValue({
      ...mockMetrics,
      oci2: null,
    });
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/🔴 OCI2\b/)).toBeInTheDocument();
    });
  });

  it('displays compact system and report stats', async () => {
    api.metrics.mockResolvedValue(mockMetrics);
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      // CPU
      expect(screen.getByText('25%')).toBeInTheDocument();
      // RAM
      expect(screen.getByText('4G')).toBeInTheDocument();
      // Disk
      expect(screen.getByText('20G')).toBeInTheDocument();
      // Today reports
      expect(screen.getByText('50')).toBeInTheDocument();
      // Total reports
      expect(screen.getByText('1,000')).toBeInTheDocument();
      // DB status
      expect(screen.getByText('정상')).toBeInTheDocument();
    });
  });

  it('displays last activity info when available', async () => {
    api.metrics.mockResolvedValue(mockMetrics);
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/삼성/)).toBeInTheDocument();
      expect(screen.getByText(/Test Report/)).toBeInTheDocument();
    });
  });

  it('does not show last activity when title is empty', async () => {
    api.metrics.mockResolvedValue({
      ...mockMetrics,
      last_activity: { last_firm: '', last_save_time: '', last_title: '' },
    });
    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('빠른 메뉴')).toBeInTheDocument();
    });

    // last activity section should not be present
    expect(screen.queryByText('📌')).not.toBeInTheDocument();
  });
});
