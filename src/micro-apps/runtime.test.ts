import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('garfish', () => ({ default: { loadApp: vi.fn(), activeApps: [] } }));
import Garfish from 'garfish';
import { createMicroAppRuntime } from './runtime';
import { RefreshRequiredError } from './diagnostics';
const definition = { name: 'test', entry: '/child', basename: '/child' };
function fakeApp() {
  const app = {
    mounted: false,
    appInfo: { props: {} },
    mount: vi.fn(async () => {
      app.mounted = true;
      return true;
    }),
    unmount: vi.fn(() => {
      app.mounted = false;
      return true;
    }),
  };
  return app;
}
function host() {
  const el = document.createElement('div');
  document.body.append(el);
  return el;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
describe('runtime lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(Garfish.loadApp).mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });
  it('unmounts on close and loads a fresh instance on reopen', async () => {
    const app = fakeApp();
    vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
    const runtime = createMicroAppRuntime(() => ({ token: 'current' }));
    const lease = runtime.attach(definition, host());
    await lease.ready;
    await lease.release();
    expect(app.unmount).toHaveBeenCalledTimes(1);
    expect(app.appInfo.props).toEqual({});
    const next = runtime.attach(definition, host());
    await next.ready;
    expect(Garfish.loadApp).toHaveBeenCalledTimes(2);
    await next.release();
  });
  it('does not mount a load cancelled by logout', async () => {
    const pending = deferred<ReturnType<typeof fakeApp>>();
    const app = fakeApp();
    vi.mocked(Garfish.loadApp).mockReturnValue(pending.promise as never);
    const runtime = createMicroAppRuntime(() => ({}));
    const lease = runtime.attach(definition, host());
    await Promise.resolve();
    const cleanup = runtime.dispose();
    pending.resolve(app);
    await Promise.all([lease.ready, cleanup]);
    expect(app.mount).not.toHaveBeenCalled();
    expect(app.appInfo.props).toEqual({});
  });
  it('bounds mount and cleanup waiting without concurrent lifecycle operations', async () => {
    const pending = deferred<boolean>();
    const app = fakeApp();
    app.mount.mockImplementation(async () => {
      await pending.promise;
      app.mounted = true;
      return true;
    });
    vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
    const runtime = createMicroAppRuntime(() => ({}), { loadTimeoutMs: 100 });
    const lease = runtime.attach(definition, host());
    const ready = expect(lease.ready).rejects.toBeInstanceOf(RefreshRequiredError);
    await vi.advanceTimersByTimeAsync(100);
    await ready;
    const cleanup = expect(runtime.dispose()).rejects.toBeInstanceOf(RefreshRequiredError);
    await vi.advanceTimersByTimeAsync(100);
    await cleanup;
    expect(app.unmount).not.toHaveBeenCalled();
    pending.resolve(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(app.unmount).toHaveBeenCalledTimes(1);
  });
  it('rejects new leases immediately after timeout without queuing their cleanup', async () => {
    const pending = deferred<boolean>();
    const app = fakeApp();
    app.mount.mockImplementation(async () => {
      await pending.promise;
      app.mounted = true;
      return true;
    });
    vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
    const runtime = createMicroAppRuntime(() => ({}), { loadTimeoutMs: 100 });
    const first = runtime.attach(definition, host());
    const timeout = expect(first.ready).rejects.toBeInstanceOf(RefreshRequiredError);
    await vi.advanceTimersByTimeAsync(100);
    await timeout;

    try {
      for (let i = 0; i < 3; i++) {
        let rejection: unknown;
        const next = runtime.attach(definition, host());
        void next.ready.catch((error: unknown) => {
          rejection = error;
        });
        await vi.advanceTimersByTimeAsync(0);

        expect(rejection).toBeInstanceOf(RefreshRequiredError);
        await next.release();
        expect(vi.getTimerCount()).toBe(0);
      }
      expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
      expect(app.unmount).not.toHaveBeenCalled();
    } finally {
      pending.resolve(true);
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(app.unmount).toHaveBeenCalledTimes(1);
  });
  it('retains failed unmounts in the capacity budget', async () => {
    const app = fakeApp();
    app.unmount.mockImplementation(() => false);
    vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
    const runtime = createMicroAppRuntime(() => ({}), { maxTotalSlots: 1 });
    const lease = runtime.attach(definition, host());
    await lease.ready;
    await expect(lease.release()).rejects.toThrow();
    await expect(runtime.attach(definition, host()).ready).rejects.toBeInstanceOf(
      RefreshRequiredError,
    );
    expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
  });
});

it('requires reload when a failed mount is still retained by Garfish', async () => {
  const app = fakeApp();
  app.mount.mockResolvedValue(false);
  vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
  Garfish.activeApps.push(app as never);
  try {
    const runtime = createMicroAppRuntime(() => ({}));
    await expect(runtime.attach(definition, host()).ready).rejects.toBeInstanceOf(RefreshRequiredError);
  } finally { Garfish.activeApps.length = 0; document.body.replaceChildren(); }
});
