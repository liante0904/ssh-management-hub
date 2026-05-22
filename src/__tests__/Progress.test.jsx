import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Progress from '../views/Progress';

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('api.github.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            tree: [
              { type: 'blob', path: 'README.md' },
              { type: 'blob', path: 'CHANGELOG.md' },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Test Heading\n\nSome content here.'),
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

  it('renders repo labels after loading', async () => {
    render(<Progress />);

    await waitFor(() => {
      expect(screen.getByText('Management Hub API')).toBeInTheDocument();
      expect(screen.getByText('DART Scraper Bot')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows file buttons per repo', async () => {
    render(<Progress />);

    await waitFor(() => {
      const buttons = screen.getAllByText('📄 README.md');
      expect(buttons.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('clicking a file opens modal', async () => {
    render(<Progress />);

    await waitFor(() => {
      expect(screen.getAllByText('📄 README.md').length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    fireEvent.click(screen.getAllByText('📄 README.md')[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
