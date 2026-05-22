import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Progress from '../views/Progress';

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to simulate GitHub raw responses
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Test Repo\n\n## Progress\n- ✅ Done: Feature A\n- ⏳ In Progress: Feature B\n- ⬜ Todo: Feature C'),
    });
  });

  it('renders page title in Korean', () => {
    render(<Progress />);
    expect(screen.getByText('진행 현황')).toBeInTheDocument();
  });

  it('shows repository count', () => {
    render(<Progress />);
    expect(screen.getByText(/13개/)).toBeInTheDocument();
  });

  it('renders repo cards for all repos', async () => {
    render(<Progress />);

    await waitFor(() => {
      expect(screen.getByText('Management Hub API')).toBeInTheDocument();
      expect(screen.getByText('Management Hub Frontend')).toBeInTheDocument();
      expect(screen.getByText('DART Scraper Bot')).toBeInTheDocument();
      expect(screen.getByText('한경 컨센서스 리포트')).toBeInTheDocument();
      expect(screen.getByText('FnGuide Summary Bot')).toBeInTheDocument();
    });
  });

  it('shows checkmark icon when README loads', async () => {
    render(<Progress />);

    await waitFor(() => {
      // All repos should eventually show ✅ or ❌
      const checkmarks = screen.getAllByText('✅');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  it('shows repo description text', async () => {
    render(<Progress />);

    await waitFor(() => {
      expect(screen.getByText('FastAPI 백엔드 서버')).toBeInTheDocument();
      expect(screen.getByText('React 프론트엔드')).toBeInTheDocument();
    });
  });
});
