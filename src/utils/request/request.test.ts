import { afterEach, expect, it, vi } from 'vitest';

const { handlers, cleanup, showError } = vi.hoisted(() => ({
  handlers: {} as {
    success?: (response: unknown) => unknown;
    failure?: (error: unknown) => Promise<never>;
  },
  cleanup: vi.fn().mockResolvedValue(undefined),
  showError: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: (success: typeof handlers.success, failure: typeof handlers.failure) => {
            handlers.success = success;
            handlers.failure = failure;
          },
        },
      },
    }),
  },
}));
vi.mock('antd', () => ({ message: { error: showError } }));
vi.mock('@/micro-apps/session', () => ({ clearSessionAndNavigate: cleanup }));
await import('./index');

afterEach(() => vi.clearAllMocks());

it('HTTP 401 调用等待清理的导航入口，同时保留原始请求失败', async () => {
  const error = { response: { status: 401 } };
  await expect(handlers.failure!(error)).rejects.toBe(error);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(expect.any(Function));
  expect(showError).toHaveBeenCalledWith('登录状态已过期，请重新登录');
});

it('HTTP 2xx 的业务错误不触发会话清理，成功数据仍正常拆包', async () => {
  expect(handlers.success!({ data: { code: 200, data: 0 } })).toBe(0);
  await expect(handlers.success!({ data: { code: 401, message: '业务拒绝' } })).rejects.toThrow(
    '业务拒绝',
  );
  expect(cleanup).not.toHaveBeenCalled();
});

it('其他 HTTP 错误和网络失败不改变登录态', async () => {
  for (const error of [{ response: { status: 500 } }, new Error('network')]) {
    await expect(handlers.failure!(error)).rejects.toBe(error);
  }
  expect(cleanup).not.toHaveBeenCalled();
});
