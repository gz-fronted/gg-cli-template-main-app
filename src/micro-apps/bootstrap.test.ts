import { afterEach, describe, expect, it, vi } from 'vitest';
import Garfish from 'garfish';
import { useGlobalStore } from '@/store/useGlobalStore';
import { disposeMicroApps, initializeMicroApps, microAppRuntime, reactMicroApp } from './bootstrap';

vi.mock('garfish', () => ({ default: { running: false, run: vi.fn(), loadApp: vi.fn() } }));

afterEach(async () => {
  vi.restoreAllMocks();
  await disposeMicroApps();
  useGlobalStore.getState().clearLoginState();
  vi.clearAllMocks();
});

describe('入口和登录态的微应用清理边界', () => {
  it('重复初始化只运行一次，并关闭预加载', () => {
    initializeMicroApps();
    initializeMicroApps();
    expect(Garfish.run).toHaveBeenCalledTimes(1);
    expect(Garfish.run).toHaveBeenCalledWith({ basename: '/', disablePreloadApp: true });
  });

  it('登录、换账号和退出都清理运行时；销毁后解除订阅', async () => {
    const dispose = vi.spyOn(microAppRuntime, 'dispose').mockResolvedValue();
    initializeMicroApps();
    const user = { name: 'first', role: 'user', dept: 'test' };
    useGlobalStore.getState().setLoginState(user, 'token-1');
    useGlobalStore.setState({ token: 'token-1' });
    expect(dispose).toHaveBeenCalledTimes(1);
    useGlobalStore.getState().setLoginState({ ...user, name: 'second' }, 'token-2');
    useGlobalStore.getState().clearLoginState();
    expect(dispose).toHaveBeenCalledTimes(3);
    await disposeMicroApps();
    useGlobalStore.getState().setLoginState(user, 'token-3');
    expect(dispose).toHaveBeenCalledTimes(4);
  });

  it('向真实 bridge 入口提供路由基址及只展示内容的标记', async () => {
    const app = {
      mounted: false,
      display: false,
      appInfo: { props: {} },
      mount: vi.fn(async () => {
        app.mounted = true;
        app.display = true;
        return true;
      }),
      unmount: vi.fn(() => {
        app.mounted = false;
        app.display = false;
        return true;
      }),
    };
    vi.mocked(Garfish.loadApp).mockResolvedValue(app as never);
    const user = { name: 'bridge-test', role: 'test', dept: 'test' };
    useGlobalStore.getState().setLoginState(user, 'test-token');
    initializeMicroApps();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const lease = microAppRuntime.attach(
      { ...reactMicroApp, entry: 'http://localhost:3002' },
      host,
    );
    await lease.ready;
    expect(app.appInfo.props).toEqual({
      globalState: { user, token: 'test-token', basename: '/micro-react-1', contentOnly: true },
    });
    await disposeMicroApps();
    host.remove();
  });
});
