import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Progress from '../views/Progress';

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      // GitHub tree API
      if (url.includes('api.github.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            tree: [
              { type: 'blob', path: 'README.md' },
              { type: 'blob', path: 'docs/PROGRESS.md' },
              { type: 'blob', path: 'CHANGELOG.md' },
              { type: 'tree', path: 'src' },
            ],
          }),
        });
      }
      // Raw content
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('# Test\n\n- ✅ Done\n- ⏳ In Progress\n\n```python\nprint("hello")\n```'),
      });
    });
  });

  it('renders page title', () => {
    render(<Progress />);
    expect(screen.getByText('진행 현황')).toBeInTheDocument();
  });

  it('shows repository count', () => {
    render(<Progress />);
    expect(screen.getByText(/13개/)).toBeInTheDocument();
  });

  it('renders repo labels after loading', async () => {
    render(<Progress />);

    await waitFor(() => {
      expect(screen.getByText('Management Hub API')).toBeInTheDocument();
      expect(screen.getByText('DART Scraper Bot')).toBeInTheDocument();
      expect(screen.getByText('FnGuide Summary')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows markdown file count per repo', async () => {
    render(<Progress />);

    await waitFor(() => {
      const badges = screen.getAllByText('3개 파일');
      expect(badges.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('renders markdown content with react-markdown', async () => {
    render(<Progress />);

    await waitFor(() => {
      // The rendered markdown should show the text content
      expect(screen.getByText('Done')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
