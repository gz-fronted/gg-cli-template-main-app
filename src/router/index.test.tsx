import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

const pageState = vi.hoisted(() => ({ failHome: true }));
vi.mock('@/micro-apps/bootstrap', () => ({ microAppDefinitions: [] }));
vi.mock('@/layouts/BasicLayout', () => ({ default: () => <Outlet /> }));
vi.mock('@/components/AuthRoute', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/pages/home', () => ({
  default: () => {
    if (pageState.failHome) throw new Error('首页渲染失败');
    return <div>正常首页</div>;
  },
}));
vi.mock('@/pages/dashboard', () => ({
  default: () => <input aria-label="页面状态" defaultValue="初始值" />,
}));
import { router } from './index';

beforeEach(() => {
  pageState.failHome = true;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
afterAll(() => router.dispose());

it('isolates errors between sibling pages and allows revisiting the recovered page', async () => {
  const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ['/'] });
  const view = render(<RouterProvider router={memoryRouter} />);
  try {
    expect(await screen.findByText('抱歉，页面加载出错了')).toBeInTheDocument();

    await act(() => memoryRouter.navigate('/dashboard'));
    expect(await screen.findByRole('textbox', { name: '页面状态' })).toBeInTheDocument();
    expect(screen.queryByText('抱歉，页面加载出错了')).not.toBeInTheDocument();

    pageState.failHome = false;
    await act(() => memoryRouter.navigate('/'));
    expect(await screen.findByText('正常首页')).toBeInTheDocument();
  } finally {
    view.unmount();
    memoryRouter.dispose();
  }
});

it('preserves page state when only query or hash changes', async () => {
  const memoryRouter = createMemoryRouter(router.routes, { initialEntries: ['/dashboard?id=1'] });
  const view = render(<RouterProvider router={memoryRouter} />);
  try {
    const input = await screen.findByRole('textbox', { name: '页面状态' });
    fireEvent.change(input, { target: { value: '未保存内容' } });

    await act(() => memoryRouter.navigate('/dashboard?id=2#section'));

    expect(screen.getByRole('textbox', { name: '页面状态' })).toHaveValue('未保存内容');
  } finally {
    view.unmount();
    memoryRouter.dispose();
  }
});
