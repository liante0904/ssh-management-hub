import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Progress from '../views/Progress';

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock api.github.com GET requests
    global.fetch = vi.fn((url, opts) => {
      const isGithubApi = url.includes('api.github.com/repos/');
      if (!isGithubApi) return Promise.resolve({ ok: false });

      const hasRawHeader = opts?.headers?.Accept === 'application/vnd.github.v3.raw';
      if (hasRawHeader) {
        // Content fetch — return markdown text
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Test Heading\n\nContent here.'),
        });
      }
      // File probe — check URL for known files
      const ok = url.includes('README.md') || url.includes('PROGRESS.md');
      return Promise.resolve({ ok });
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
