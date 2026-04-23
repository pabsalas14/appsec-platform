import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test-utils';

// Mock the axios-based API client *before* importing the page.
vi.mock('@/lib/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import TasksPage from '@/app/(dashboard)/tasks/page';
import api from '@/lib/api';

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function apiOk<T>(payload: T) {
  return { data: { status: 'success', data: payload, meta: {} } };
}

const fixedTask = {
  id: '11111111-1111-1111-1111-111111111111',
  user_id: '00000000-0000-0000-0000-000000000000',
  title: 'Write tests',
  description: 'Jest/Vitest + Playwright',
  completed: false,
  status: 'todo',
  project_id: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

// Default GET mock that routes by URL so useTasks + useProjects both work.
function installGetRouter(tasks: unknown[] = []) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === '/tasks') return Promise.resolve(apiOk(tasks));
    if (url === '/projects') return Promise.resolve(apiOk([]));
    return Promise.resolve(apiOk([]));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TasksPage', () => {
  it('renders the fetched tasks after the query resolves', async () => {
    installGetRouter([fixedTask]);

    renderWithProviders(<TasksPage />);

    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith('/tasks', { params: {} });
  });

  it('renders the empty state when the list is empty', async () => {
    installGetRouter([]);

    renderWithProviders(<TasksPage />);

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders an error state when the request fails', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/tasks') return Promise.reject(new Error('boom'));
      return Promise.resolve(apiOk([]));
    });

    renderWithProviders(<TasksPage />);

    expect(await screen.findByText(/failed to load tasks/i)).toBeInTheDocument();
  });

  it('creates a task via the form and invalidates the list', async () => {
    const user = userEvent.setup();

    let tasks: typeof fixedTask[] = [];
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/tasks') return Promise.resolve(apiOk(tasks));
      if (url === '/projects') return Promise.resolve(apiOk([]));
      return Promise.resolve(apiOk([]));
    });
    mockedApi.post.mockImplementation(() => {
      const created = { ...fixedTask, title: 'Buy milk' };
      tasks = [created];
      return Promise.resolve(apiOk(created));
    });

    renderWithProviders(<TasksPage />);

    await screen.findByText(/no tasks yet/i);

    await user.click(screen.getByRole('button', { name: /new task/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/title/i), 'Buy milk');

    await user.click(within(dialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/tasks', {
        title: 'Buy milk',
        description: '',
        status: 'todo',
        completed: false,
        project_id: null,
      });
    });

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
  });

  it('shows a Zod error when the title is missing and does not POST', async () => {
    const user = userEvent.setup();
    installGetRouter([]);

    renderWithProviders(<TasksPage />);
    await screen.findByText(/no tasks yet/i);

    await user.click(screen.getByRole('button', { name: /new task/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^create$/i }));

    expect(await within(dialog).findByText(/title is required/i)).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
