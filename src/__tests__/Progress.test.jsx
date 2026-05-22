import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Progress from '../views/Progress';

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock raw.githubusercontent.com HEAD + GET
    global.fetch = vi.fn((url, opts) => {
      if (opts?.method === 'HEAD') {
        // README.md exists, PROGRESS.md exists, others 404
        const ok = url.includes('README.md') || url.includes('PROGRESS.md');
        return Promise.resolve({ ok });
      }
      // GET content
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Test Heading\n\nContent here.'),
      });
    });
  });

  it('renders page title and count', () => {
    render(<Progress />);
    expect(screen.getByText('진행 현황')).toBeInTheDocument();
    expect(screen.getByText(/13개/)).toBeInTheDocument();
  });

  it('shows list header columns', () => {
    render(<Progress />);
    expect(screen.getByText('레포지토리')).toBeInTheDocument();
    expect(screen.getByText('마크다운 파일')).toBeInTheDocument();
  });

  it('renders repo labels', async () => {
    render(<Progress />);
    await waitFor(() => {
      expect(screen.getByText('Management Hub API')).toBeInTheDocument();
      expect(screen.getByText('DART Scraper Bot')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows found file buttons per repo', async () => {
    render(<Progress />);
    await waitFor(() => {
      const buttons = screen.getAllByText('📄 README.md');
      expect(buttons.length).toBeGreaterThan(0);
    }, { timeout: 8000 });
  });

  it('clicking a file opens modal with content', async () => {
    render(<Progress />);
    await waitFor(() => {
      expect(screen.getAllByText('📄 README.md').length).toBeGreaterThan(0);
    }, { timeout: 8000 });

    fireEvent.click(screen.getAllByText('📄 README.md')[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
