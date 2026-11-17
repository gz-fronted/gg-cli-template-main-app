import { render, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  release: vi.fn(async () => {}),
  attach: vi.fn(),
  unregister: vi.fn(),
  notify: vi.fn(),
}));
vi.mock('@/micro-apps/bootstrap', () => ({
  microAppRuntime: { attach: mocks.attach },
  reportMicroAppError: vi.fn(),
}));
vi.mock('@/integration/host-bridge/hostBridge', () => ({
  hostBridge: { registerSubAppTarget: () => mocks.unregister },
}));
vi.mock('@/micro-apps/routes', () => ({ notifyMicroAppRoute: mocks.notify }));
vi.mock('@/store/useGlobalStore', () => ({
  useGlobalStore: (select: (state: object) => unknown) => select({ token: 'test', user: null }),
}));
import MicroAppHost from './index';
it('mounts real Host, updates query without remount, and releases on close', async () => {
  mocks.attach.mockReturnValue({ ready: Promise.resolve(), release: mocks.release });
  const definition = { name: 'test', basename: '/test', entry: '/child' };
  const view = render(<MicroAppHost definition={definition} routePath="/detail?id=1" />);
  await waitFor(() => expect(mocks.notify).toHaveBeenLastCalledWith(definition, '/detail?id=1'));
  view.rerender(<MicroAppHost definition={definition} routePath="/detail" />);
  await waitFor(() => expect(mocks.notify).toHaveBeenLastCalledWith(definition, '/detail'));
  expect(mocks.attach).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(mocks.release).toHaveBeenCalledTimes(1);
  expect(mocks.unregister).toHaveBeenCalledTimes(1);
});
