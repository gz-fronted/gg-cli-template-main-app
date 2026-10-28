import { afterEach, describe, expect, it, vi } from 'vitest';
import Garfish from 'garfish';
import { createMicroAppRuntime, type MicroAppDefinition } from './runtime';

vi.mock('garfish', () => ({ default: { loadApp: vi.fn(), activeApps: [] } }));

const definition: MicroAppDefinition = {
  name: 'react',
  entry: 'http://localhost:3001',
  basename: '/micro-react-1',
};

function createApp() {
  const app = {
    mounted: false,
    display: false,
    appInfo: { props: {} as Record<string, unknown> },
    mount: vi.fn(async () => {
      app.mounted = true;
      app.display = true;
      return true;
    }),
    show: vi.fn(async () => {
      app.display = true;
      return true;
    }),
    hide: vi.fn(() => {
      app.display = false;
      return true;
    }),
    unmount: vi.fn(() => {
      app.display = false;
      app.mounted = false;
      return true;
    }),
  };
  return app;
}

function mockLoad(app = createApp()) {
  vi.mocked(Garfish.loadApp).mockResolvedValue(
    app as unknown as NonNullable<Awaited<ReturnType<typeof Garfish.loadApp>>>,
  );
  return app;
}

function host() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  Garfish.activeApps.length = 0;
  document.body.replaceChildren();
});

describe('微应用实例所有权与生命周期', () => {
  it('重复开关只加载和执行入口一次，show 使用新宿主和最新 props', async () => {
    const app = mockLoad();
    let token = 'first';
    const runtime = createMicroAppRuntime(() => ({ globalState: { token } }));
    const first = runtime.attach(definition, host());
    await first.ready;
    await first.release();
    const options = vi.mocked(Garfish.loadApp).mock.calls[0][1]!;
    expect((options.domGetter as () => Element | null)()).toBeNull();
    expect(app.appInfo.props).toEqual({});

    const nextHost = host();
    token = 'latest';
    for (let i = 0; i < 8; i += 1) {
      const lease = runtime.attach(definition, nextHost);
      await lease.ready;
      expect((options.domGetter as () => Element | null)()).toBe(nextHost);
      expect(app.appInfo.props).toEqual({ globalState: { token: 'latest' } });
      await lease.release();
    }
    expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
    expect(app.mount).toHaveBeenCalledTimes(1);
    expect(app.show).toHaveBeenCalledTimes(8);
    expect(app.unmount).not.toHaveBeenCalled();
    await runtime.dispose();
    expect(app.unmount).toHaveBeenCalledTimes(1);
  });

  it('加载未完成就离开，不向旧宿主挂载；快速重开复用已加载实例', async () => {
    const app = createApp();
    let resolve!: (value: Awaited<ReturnType<typeof Garfish.loadApp>>) => void;
    vi.mocked(Garfish.loadApp).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const runtime = createMicroAppRuntime(() => ({}));
    const first = runtime.attach(definition, host());
    await vi.waitFor(() => expect(Garfish.loadApp).toHaveBeenCalledTimes(1));
    const released = first.release();
    const second = runtime.attach(definition, host());
    resolve(app as unknown as Awaited<ReturnType<typeof Garfish.loadApp>>);
    await Promise.all([first.ready, released, second.ready]);
    expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
    expect(app.mount).toHaveBeenCalledTimes(1);
    expect(app.hide).not.toHaveBeenCalled();
    // 旧句柄再次释放不能关闭后来取得实例的新宿主。
    await first.release();
    expect(app.display).toBe(true);
    await second.release();
    await runtime.dispose();
  });

  it('会话清理使在途加载失效，新会话不能拿到旧实例', async () => {
    const old = createApp();
    let resolve!: (value: Awaited<ReturnType<typeof Garfish.loadApp>>) => void;
    vi.mocked(Garfish.loadApp).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const runtime = createMicroAppRuntime(() => ({}));
    const pending = runtime.attach(definition, host());
    await vi.waitFor(() => expect(Garfish.loadApp).toHaveBeenCalledTimes(1));
    const disposing = runtime.dispose();
    const next = mockLoad();
    const fresh = runtime.attach(definition, host());
    resolve(old as unknown as Awaited<ReturnType<typeof Garfish.loadApp>>);
    await Promise.all([pending.ready, disposing, fresh.ready]);
    expect(old.mount).not.toHaveBeenCalled();
    expect(next.mount).toHaveBeenCalledTimes(1);
    expect(Garfish.loadApp).toHaveBeenCalledTimes(2);
    await runtime.dispose();
  });

  it('挂载过程中退出，挂载结束后真正卸载，不留作空闲缓存', async () => {
    const app = mockLoad();
    let finish!: () => void;
    app.mount.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finish = () => {
            app.mounted = true;
            app.display = true;
            done(true);
          };
        }),
    );
    const runtime = createMicroAppRuntime(() => ({}));
    const pending = runtime.attach(definition, host());
    await vi.waitFor(() => expect(app.mount).toHaveBeenCalledTimes(1));
    const disposing = runtime.dispose();
    finish();
    await Promise.all([pending.ready, disposing]);
    expect(app.unmount).toHaveBeenCalledTimes(1);
    expect(app.hide).not.toHaveBeenCalled();
  });

  it('同名应用的不同宿主、部署地址和路由基准互不抢占', async () => {
    const apps = [createApp(), createApp(), createApp(), createApp()];
    for (const app of apps) vi.mocked(Garfish.loadApp).mockResolvedValueOnce(app as never);
    const runtime = createMicroAppRuntime(() => ({}));
    const a = runtime.attach(definition, host());
    const b = runtime.attach(definition, host());
    await Promise.all([a.ready, b.ready]);
    await a.release();
    expect(apps[1].display).toBe(true);
    const c = runtime.attach({ ...definition, entry: 'http://localhost:3002' }, host());
    await c.ready;
    const d = runtime.attach({ ...definition, basename: '/another-page' }, host());
    await d.ready;
    expect(Garfish.loadApp).toHaveBeenCalledTimes(4);
    await runtime.dispose();
    for (const app of apps) expect(app.unmount).toHaveBeenCalledTimes(1);
  });

  it('只淘汰最早停靠的空闲实例，活动实例不受缓存上限影响', async () => {
    const apps = [createApp(), createApp(), createApp(), createApp()];
    for (const app of apps) vi.mocked(Garfish.loadApp).mockResolvedValueOnce(app as never);
    const runtime = createMicroAppRuntime(() => ({}), { maxIdleSlots: 2 });
    const active = runtime.attach({ ...definition, basename: '/active' }, host());
    await active.ready;
    for (let i = 1; i < 4; i += 1) {
      const lease = runtime.attach({ ...definition, basename: `/page-${i}` }, host());
      await lease.ready;
      await lease.release();
    }
    expect(apps[0].unmount).not.toHaveBeenCalled();
    expect(apps[1].unmount).toHaveBeenCalledTimes(1);
    expect(apps[2].unmount).not.toHaveBeenCalled();
    expect(apps[3].unmount).not.toHaveBeenCalled();
    await runtime.dispose();
  });

  it('清理某个实例失败仍继续清理其他实例，且失败实例不再复用', async () => {
    const broken = mockLoad();
    broken.unmount.mockReturnValue(false);
    const runtime = createMicroAppRuntime(() => ({}));
    const first = runtime.attach(definition, host());
    await first.ready;
    const healthy = mockLoad();
    const second = runtime.attach({ ...definition, basename: '/other' }, host());
    await second.ready;
    await expect(runtime.dispose()).rejects.toThrow('子应用运行时清理失败');
    expect(healthy.unmount).toHaveBeenCalledTimes(1);
    mockLoad();
    const fresh = runtime.attach(definition, host());
    await fresh.ready;
    expect(Garfish.loadApp).toHaveBeenCalledTimes(3);
    broken.unmount.mockReturnValue(true);
    await runtime.dispose();
  });

  it('加载失败不会卡死生命周期队列，下一次进入可重新加载', async () => {
    vi.mocked(Garfish.loadApp).mockResolvedValueOnce(null);
    const runtime = createMicroAppRuntime(() => ({}));
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('子应用加载失败');
    const app = mockLoad();
    await runtime.attach(definition, host()).ready;
    expect(app.display).toBe(true);
    await runtime.dispose();
  });

  it('隐藏失败会尝试真正卸载，清除旧宿主引用并允许重新进入', async () => {
    const app = mockLoad();
    const runtime = createMicroAppRuntime(() => ({}));
    const lease = runtime.attach(definition, host());
    await lease.ready;
    const options = vi.mocked(Garfish.loadApp).mock.calls[0][1]!;
    app.hide.mockReturnValueOnce(false);
    await expect(lease.release()).rejects.toThrow('子应用隐藏失败');
    expect(app.unmount).toHaveBeenCalledTimes(1);
    expect((options.domGetter as () => Element | null)()).toBeNull();
    const fresh = mockLoad();
    await runtime.attach(definition, host()).ready;
    expect(fresh.mount).toHaveBeenCalledTimes(1);
    await runtime.dispose();
  });

  it('超时释放队列，晚到实例不再挂载，同名底层请求返回前不能重试复用', async () => {
    vi.useFakeTimers();
    let finish!: (app: Awaited<ReturnType<typeof Garfish.loadApp>>) => void;
    vi.mocked(Garfish.loadApp).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const runtime = createMicroAppRuntime(() => ({ globalState: { token: 'old' } }), {
      loadTimeoutMs: 100,
    });
    const lease = runtime.attach(definition, host());
    const failed = expect(lease.ready).rejects.toThrow('子应用加载超时');
    await vi.advanceTimersByTimeAsync(100);
    await failed;
    await lease.release();
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('仍在加载');
    const healthy = mockLoad();
    await runtime.attach({ ...definition, name: 'another' }, host()).ready;
    expect(healthy.display).toBe(true);
    await expect(runtime.dispose()).rejects.toThrow('子应用运行时清理失败');
    const late = createApp();
    late.appInfo.props = { globalState: { token: 'stale' } };
    finish(late as never);
    await vi.advanceTimersByTimeAsync(0);
    expect(late.mount).not.toHaveBeenCalled();
    expect(late.appInfo.props).toEqual({});
    expect(healthy.unmount).toHaveBeenCalledTimes(1);
    await runtime.dispose();
  });

  it('卸载失败的实例也占容量，不能靠连续失败无限创建新实例', async () => {
    const runtime = createMicroAppRuntime(() => ({}), { maxTotalSlots: 2 });
    const broken = [createApp(), createApp()];
    for (const app of broken) {
      mockLoad(app);
      await runtime.attach(definition, host()).ready;
      app.unmount.mockReturnValue(false);
      await expect(runtime.dispose()).rejects.toThrow('子应用运行时清理失败');
    }
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('容量已满');
    expect(Garfish.loadApp).toHaveBeenCalledTimes(2);
    for (const app of broken) app.unmount.mockReturnValue(true);
    await runtime.dispose();
  });

  it('达到总容量时先回收空闲实例，不卸载活动实例', async () => {
    const runtime = createMicroAppRuntime(() => ({}), { maxTotalSlots: 2 });
    const idle = mockLoad();
    const parked = runtime.attach({ ...definition, basename: '/idle' }, host());
    await parked.ready;
    await parked.release();
    const active = mockLoad();
    await runtime.attach({ ...definition, basename: '/active' }, host()).ready;
    const next = mockLoad();
    await runtime.attach({ ...definition, basename: '/new' }, host()).ready;
    expect(idle.unmount).toHaveBeenCalledTimes(1);
    expect(active.unmount).not.toHaveBeenCalled();
    expect(next.display).toBe(true);
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('容量已满');
    expect(Garfish.loadApp).toHaveBeenCalledTimes(3);
    await runtime.dispose();
  });

  it('同一会话并发清理共用一个任务，不重复卸载', async () => {
    const runtime = createMicroAppRuntime(() => ({}));
    const app = mockLoad();
    await runtime.attach(definition, host()).ready;
    const first = runtime.dispose();
    expect(runtime.dispose()).toBe(first);
    await first;
    expect(app.unmount).toHaveBeenCalledTimes(1);
    const fresh = mockLoad();
    await runtime.attach(definition, host()).ready;
    expect(fresh.mount).toHaveBeenCalledTimes(1);
    expect(Garfish.loadApp).toHaveBeenCalledTimes(2);
    await runtime.dispose();
  });

  it('稳定宿主 ID 在会话重建后解析新 DOM，不继续引用旧宿主', async () => {
    const runtime = createMicroAppRuntime(() => ({}));
    mockLoad();
    const firstHost = host();
    firstHost.id = 'stable-host';
    await runtime.attach(definition, firstHost).ready;
    const getter = vi.mocked(Garfish.loadApp).mock.calls[0][1]!.domGetter as () => Element | null;
    await runtime.dispose();
    firstHost.remove();
    expect(getter()).toBeNull();
    const nextHost = host();
    nextHost.id = 'stable-host';
    expect(getter()).toBe(nextHost);
  });

  it('挂载失败但框架仍持有的实例计为失败，不假装已经释放', async () => {
    const app = mockLoad();
    app.mount.mockResolvedValueOnce(false);
    Garfish.activeApps.push(app as never);
    const runtime = createMicroAppRuntime(() => ({}), { maxTotalSlots: 1 });
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('子应用操作及清理失败');
    await expect(runtime.attach(definition, host()).ready).rejects.toThrow('容量已满');
    expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
    Garfish.activeApps.length = 0;
    await runtime.dispose();
    const fresh = mockLoad();
    await runtime.attach(definition, host()).ready;
    expect(fresh.mount).toHaveBeenCalledTimes(1);
    await runtime.dispose();
  });

  it('清理过程中再次切换会话，会取消两次清理之间排队的旧挂载', async () => {
    const app = mockLoad();
    let finish!: () => void;
    app.mount.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => {
            app.mounted = true;
            app.display = true;
            resolve(true);
          };
        }),
    );
    const runtime = createMicroAppRuntime(() => ({}));
    const original = runtime.attach(definition, host());
    await vi.waitFor(() => expect(app.mount).toHaveBeenCalledTimes(1));
    const clearing = runtime.dispose();
    const intermediate = runtime.attach(definition, host());
    expect(runtime.dispose()).toBe(clearing);
    finish();
    await Promise.all([original.ready, clearing, intermediate.ready]);
    expect(Garfish.loadApp).toHaveBeenCalledTimes(1);
    expect(app.unmount).toHaveBeenCalledTimes(1);
  });
});
