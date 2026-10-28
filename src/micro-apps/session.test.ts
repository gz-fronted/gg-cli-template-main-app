import { afterEach, expect, it, vi } from 'vitest';
import { useGlobalStore } from '@/store/useGlobalStore';
import { clearMicroAppSession, clearSessionAndNavigate } from './session';

const { dispose, report } = vi.hoisted(() => ({ dispose: vi.fn(), report: vi.fn() }));
vi.mock('./bootstrap', () => ({ cleanupMicroAppRuntime: dispose, reportMicroAppError: report }));

afterEach(() => {
  useGlobalStore.getState().clearLoginState();
  vi.resetAllMocks();
});

it('立即清除认证态，等待实例清理完成后才执行导航', async () => {
  useGlobalStore.getState().setLoginState({ name: 'test', role: 'user', dept: 'test' }, 'token');
  let finish!: () => void;
  dispose.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const navigate = vi.fn();
  const done = clearSessionAndNavigate(navigate);
  expect(useGlobalStore.getState().token).toBeNull();
  expect(navigate).not.toHaveBeenCalled();
  finish();
  await done;
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('释放失败会报告，仍保持退出状态并执行导航', async () => {
  const error = new Error('unmount failed');
  dispose.mockRejectedValue(error);
  const navigate = vi.fn();
  await clearSessionAndNavigate(navigate);
  expect(report).toHaveBeenCalledExactlyOnceWith(error);
  expect(useGlobalStore.getState().token).toBeNull();
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('无导航的清理 API 将失败返回给调用方', async () => {
  const error = new Error('unmount failed');
  dispose.mockRejectedValue(error);
  await expect(clearMicroAppSession()).rejects.toBe(error);
});
