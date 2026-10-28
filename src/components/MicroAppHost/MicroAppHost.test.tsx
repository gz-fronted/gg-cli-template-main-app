import { StrictMode, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGlobalStore } from '@/store/useGlobalStore';
import MicroAppHost from './index';

const { attach, report } = vi.hoisted(() => ({ attach: vi.fn(), report: vi.fn() }));
vi.mock('@/micro-apps/bootstrap', () => ({
  microAppRuntime: { attach },
  reportMicroAppError: report,
}));
vi.mock('antd', () => ({
  Alert: ({ title, action }: { title: string; action?: ReactNode }) => (
    <div role="alert">
      {title}
      {action}
    </div>
  ),
  Button: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Spin: () => <div>子应用加载中</div>,
}));

const definition = { name: 'react', entry: 'http://localhost:3001', basename: '/micro-react-1' };

afterEach(() => {
  cleanup();
  useGlobalStore.getState().clearLoginState();
  vi.resetAllMocks();
});

describe('React 宿主的生命周期边界', () => {
  it('容器就绪后加载，StrictMode 清理及 token 更新都释放旧句柄', async () => {
    useGlobalStore.getState().setLoginState({ name: 'test', role: 'user', dept: 'test' }, 'first');
    const release = vi.fn().mockResolvedValue(undefined);
    attach.mockImplementation((_definition, host: HTMLElement) => {
      expect(host.isConnected).toBe(true);
      return { ready: Promise.resolve(), release };
    });
    const view = render(
      <StrictMode>
        <MicroAppHost definition={definition} />
      </StrictMode>,
    );
    await act(async () => {});
    expect(attach).toHaveBeenCalledTimes(2);
    expect(release).toHaveBeenCalledTimes(1);
    await act(async () => {
      useGlobalStore.setState({ token: 'second' });
    });
    expect(attach).toHaveBeenCalledTimes(3);
    expect(release).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(release).toHaveBeenCalledTimes(3);
  });

  it('旧加载失败不会覆盖新宿主状态，清理失败会被报告', async () => {
    useGlobalStore.getState().setLoginState({ name: 'test', role: 'user', dept: 'test' }, 'token');
    let reject!: (reason: Error) => void;
    const pending = new Promise<void>((_resolve, fail) => {
      reject = fail;
    });
    const cleanupError = new Error('cleanup failed');
    attach.mockReturnValueOnce({
      ready: pending,
      release: vi.fn().mockRejectedValue(cleanupError),
    });
    const view = render(<MicroAppHost definition={definition} />);
    attach.mockReturnValueOnce({
      ready: Promise.resolve(),
      release: vi.fn().mockResolvedValue(undefined),
    });
    view.rerender(<MicroAppHost definition={{ ...definition, entry: 'http://localhost:3002' }} />);
    await act(async () => {
      reject(new Error('stale load failed'));
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(report).toHaveBeenCalledWith(cleanupError);
  });

  it('加载失败后可重试，先释放旧句柄再申请新实例', async () => {
    useGlobalStore.getState().setLoginState({ name: 'test', role: 'user', dept: 'test' }, 'token');
    const release = vi.fn().mockResolvedValue(undefined);
    attach.mockReturnValueOnce({ ready: Promise.reject(new Error('加载超时')), release });
    render(<MicroAppHost definition={definition} />);
    const retry = await screen.findByRole('button', { name: '重试' });
    attach.mockReturnValueOnce({
      ready: Promise.resolve(),
      release: vi.fn().mockResolvedValue(undefined),
    });
    await act(async () => {
      fireEvent.click(retry);
    });
    expect(release).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
