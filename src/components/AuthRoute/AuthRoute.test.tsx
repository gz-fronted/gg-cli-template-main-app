import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useMicroAppCleanupState } from '@/micro-apps/bootstrap';
import AuthRoute from './index';

vi.mock('garfish', () => ({ default: { loadApp: vi.fn() } }));

afterEach(() => {
  cleanup();
  useMicroAppCleanupState.setState({ pending: false });
});

it('认证态清除后先等待清理，不提前跳到登录页', async () => {
  useGlobalStore.getState().clearLoginState();
  useMicroAppCleanupState.setState({ pending: true });
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <AuthRoute>
              <div>protected</div>
            </AuthRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status').textContent).toBe('正在退出登录…');
  expect(screen.queryByText('login-page')).toBeNull();
  await act(async () => {
    useMicroAppCleanupState.setState({ pending: false });
  });
  expect(screen.getByText('login-page')).toBeDefined();
});
