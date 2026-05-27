import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Users from '../views/Users';
import { ToastProvider } from '../components/ui/ToastContext';

vi.mock('../lib/api', () => ({
  api: {
    users: vi.fn(),
    updateUserStatus: vi.fn(),
    toggleAdmin: vi.fn(),
    deleteUser: vi.fn(),
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

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title in Korean', async () => {
    api.users.mockResolvedValue({
      users: [],
      total: 0,
      page_size: 20,
    });

    renderWithRouter(<Users />);

    await waitFor(() => {
      expect(screen.getByText('사용자 관리')).toBeInTheDocument();
    });
  });

  it('renders table headers in Korean', async () => {
    api.users.mockResolvedValue({
      users: [],
      total: 0,
      page_size: 20,
    });

    renderWithRouter(<Users />);

    await waitFor(() => {
      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByText('사용자명')).toBeInTheDocument();
      expect(screen.getByText('상태')).toBeInTheDocument();
      expect(screen.getByText('관리자')).toBeInTheDocument();
    });
  });

  it('renders user list with Korean status labels', async () => {
    api.users.mockResolvedValue({
      users: [
        { id: 1, first_name: '홍길동', username: 'hong', status: 'active', is_admin: true },
        { id: 2, first_name: '김철수', username: 'kim', status: 'blocked', is_admin: false },
        { id: 3, first_name: '이영희', username: 'lee', status: 'inactive', is_admin: false },
      ],
      total: 3,
      page_size: 20,
    });

    renderWithRouter(<Users />);

    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('김철수')).toBeInTheDocument();
      expect(screen.getByText('이영희')).toBeInTheDocument();
      expect(screen.getAllByText('활성').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('차단').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('비활성').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows total count in Korean', async () => {
    api.users.mockResolvedValue({
      users: [{ id: 1, first_name: 'Test', username: 'test', status: 'active', is_admin: false }],
      total: 42,
      page_size: 20,
    });

    renderWithRouter(<Users />);

    await waitFor(() => {
      expect(screen.getByText('총 42명')).toBeInTheDocument();
    });
  });

  it('renders filter inputs with Korean placeholders', async () => {
    api.users.mockResolvedValue({
      users: [],
      total: 0,
      page_size: 20,
    });

    renderWithRouter(<Users />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('이름 또는 사용자명 검색...')).toBeInTheDocument();
      expect(screen.getByText('전체 상태')).toBeInTheDocument();
    });
  });
});
