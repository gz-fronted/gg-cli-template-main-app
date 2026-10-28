import { afterEach, expect, it, vi } from 'vitest';
import { loadWithTimeout } from './loadWithTimeout';

afterEach(() => vi.useRealTimers());

it('正常返回或失败时清除计时器，保留原结果和异常', async () => {
  vi.useFakeTimers();
  const late = vi.fn();
  await expect(loadWithTimeout(Promise.resolve(7), 100, late)).resolves.toBe(7);
  const error = new Error('load failed');
  await expect(loadWithTimeout(Promise.reject(error), 100, late)).rejects.toBe(error);
  expect(vi.getTimerCount()).toBe(0);
  expect(late).not.toHaveBeenCalled();
});

it('真正超时后拒绝等待，晚到的结果只交给清理回调', async () => {
  vi.useFakeTimers();
  let finish!: (value: number) => void;
  const late = vi.fn();
  const load = loadWithTimeout(
    new Promise<number>((resolve) => {
      finish = resolve;
    }),
    100,
    late,
  );
  const rejected = expect(load).rejects.toThrow('子应用加载超时');
  await vi.advanceTimersByTimeAsync(100);
  await rejected;
  finish(7);
  await vi.advanceTimersByTimeAsync(0);
  expect(late).toHaveBeenCalledExactlyOnceWith(7);
  expect(vi.getTimerCount()).toBe(0);
});

it('超时后的底层失败被处理，不产生未处理的 Promise 拒绝', async () => {
  vi.useFakeTimers();
  let fail!: (error: Error) => void;
  const load = loadWithTimeout(
    new Promise<void>((_resolve, reject) => {
      fail = reject;
    }),
    100,
    vi.fn(),
  );
  const rejected = expect(load).rejects.toThrow('子应用加载超时');
  await vi.advanceTimersByTimeAsync(100);
  await rejected;
  fail(new Error('late error'));
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});
