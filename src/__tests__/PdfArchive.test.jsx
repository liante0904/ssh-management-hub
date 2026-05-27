import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PdfArchive from '../views/PdfArchive';
import { ToastProvider } from '../components/ui/ToastContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    pdfArchive: vi.fn(),
    pdfArchiveStatsDaily: vi.fn(),
    pdfArchiveStatsByFirm: vi.fn(),
    pdfArchiveReprocess: vi.fn(),
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

const mockPdfArchive = {
  items: [
    {
      report_id: 100, firm_nm: '하나증권', title: 'IT 전망 리포트', reg_dt: '20250501',
      author: '김연구', file_name: 'report_100.pdf', file_size: 1048576, page_count: 12,
      archive_status: 'ARCHIVED', storage_backend: 'onedrive', download_status_yn: 'Y',
      sync_status: 2, pdf_sync_status: 2, retry_count: 0, has_text: true, is_encrypted: false,
      created_at: '2025-05-01 10:00:00', updated_at: '2025-05-01 10:05:00',
    },
    {
      report_id: 101, firm_nm: 'KB증권', title: '반도체 분석', reg_dt: '20250502',
      author: '이연구', file_name: 'report_101.pdf', file_size: 2097152, page_count: 24,
      archive_status: 'INIT', storage_backend: 'onedrive', download_status_yn: 'N',
      sync_status: 9, pdf_sync_status: 0, retry_count: 3, has_text: false, is_encrypted: true,
      created_at: '2025-05-02 11:00:00', updated_at: '2025-05-02 11:05:00',
    },
  ],
  total: 150,
  page: 1,
  page_size: 20,
  summary: { total: 150, archived: 120, failed: 30 },
};

const mockDailyStats = [
  { date: '2025-05-02', total: 50, archived: 45, failed: 5 },
  { date: '2025-05-01', total: 30, archived: 28, failed: 2 },
];

const mockFirmStats = [
  { firm_nm: '하나증권', total: 80, archived: 75, failed: 5 },
  { firm_nm: 'KB증권', total: 70, archived: 60, failed: 10 },
];

describe('PdfArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: stats auto-load, so set defaults for all tests
    api.pdfArchiveStatsDaily.mockResolvedValue(mockDailyStats);
    api.pdfArchiveStatsByFirm.mockResolvedValue(mockFirmStats);
  });

  it('shows page title', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);
    await waitFor(() => {
      expect(screen.getByText('PDF 아카이브 관리')).toBeInTheDocument();
    });
  });

  it('shows 통계 새로고침, 최근 100건 재처리 and 일괄 재처리 buttons after stats load', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('📊 통계 새로고침')).toBeInTheDocument();
    });
    expect(screen.getByText('⚡ 최근 100건 재처리')).toBeInTheDocument();
    expect(screen.getByText('🔄 일괄 재처리')).toBeInTheDocument();
  });

  it('loads and displays pdf archive list', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('IT 전망 리포트')).toBeInTheDocument();
    });

    expect(screen.getByText('반도체 분석')).toBeInTheDocument();
    // 하나증권 appears in table + stats panel → getAllByText
    expect(screen.getAllByText('하나증권').length).toBeGreaterThanOrEqual(1);
    // KB증권 also appears in table + stats panel
    expect(screen.getAllByText('KB증권').length).toBeGreaterThanOrEqual(1);
  });

  it('shows archive status badges correctly', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
      expect(screen.getByText('INIT')).toBeInTheDocument();
    });
  });

  it('shows reprocess panel when button clicked', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('🔄 일괄 재처리')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🔄 일괄 재처리'));

    expect(screen.getByText('PDF 일괄 재처리')).toBeInTheDocument();
    expect(screen.getByText('재처리 실행')).toBeInTheDocument();
  });

  it('toggles reprocess panel on double click', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('🔄 일괄 재처리')).toBeInTheDocument();
    });

    const btn = screen.getByText('🔄 일괄 재처리');
    fireEvent.click(btn);
    expect(screen.getByText('PDF 일괄 재처리')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByText('PDF 일괄 재처리')).not.toBeInTheDocument();
  });

  it('auto-loads and displays stats on mount', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    api.pdfArchiveStatsDaily.mockResolvedValue(mockDailyStats);
    api.pdfArchiveStatsByFirm.mockResolvedValue(mockFirmStats);

    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('일별 아카이브 통계 (최근 30일)')).toBeInTheDocument();
      expect(screen.getByText('증권사별 아카이브 통계')).toBeInTheDocument();
    });

    // Check daily stats data
    expect(screen.getByText('2025-05-02')).toBeInTheDocument();
    expect(screen.getByText('2025-05-01')).toBeInTheDocument();

    // Check firm stats data
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('stats can be refreshed with button click', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    api.pdfArchiveStatsDaily.mockResolvedValue(mockDailyStats);
    api.pdfArchiveStatsByFirm.mockResolvedValue(mockFirmStats);

    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('📊 통계 새로고침')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('📊 통계 새로고침'));

    // should still be visible after refresh
    await waitFor(() => {
      expect(screen.getByText('일별 아카이브 통계 (최근 30일)')).toBeInTheDocument();
    });
  });

  it('displays summary cards with backend summary counts', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // total
    });

    expect(screen.getByText('전체 PDF')).toBeInTheDocument();
    expect(screen.getByText('아카이브 완료')).toBeInTheDocument();
    expect(screen.getByText('미완료/실패')).toBeInTheDocument();
    // 완료율 appears in both summary cards and stats tables
    expect(screen.getAllByText('완료율').length).toBeGreaterThanOrEqual(1);
    // backend summary counts (not per-page)
    expect(screen.getByText('120')).toBeInTheDocument(); // archived
    // '30' appears in both summary (failed=30) and stats daily table (total=30) → getAllByText
    expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);  // failed
  });

  it('has filter inputs', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      // Filter inputs should be present
      expect(screen.getByPlaceholderText('증권사명...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('날짜 YYYYMMDD...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('제목 검색...')).toBeInTheDocument();
    });
  });

  it('displays empty state when no items', async () => {
    api.pdfArchive.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText(/No PDF archives found/)).toBeInTheDocument();
    });
  });

  it('handles load error gracefully (component does not crash on API failure)', async () => {
    api.pdfArchive.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<PdfArchive />);

    // Component should still render despite API failure.
    // Stats panel loads from separate API calls that resolve.
    await waitFor(() => {
      expect(screen.getByText('PDF 아카이브 관리')).toBeInTheDocument();
      expect(screen.getByText('일별 아카이브 통계 (최근 30일)')).toBeInTheDocument();
    });
  });

  it('formats file sizes correctly', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });

  it('shows retry buttons for non-ARCHIVED items', async () => {
    api.pdfArchive.mockResolvedValue(mockPdfArchive);
    renderWithRouter(<PdfArchive />);

    await waitFor(() => {
      // Only INIT item should have Retry button
      const retryButtons = screen.getAllByText('Retry');
      expect(retryButtons.length).toBe(1);
    });
  });
});
