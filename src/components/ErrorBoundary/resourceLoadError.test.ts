import { expect, it, vi } from 'vitest';
import { isResourceLoadError, registerPreloadErrorLogger } from './resourceLoadError';
it('distinguishes explicit resource failures from application exceptions', () => {
  expect(
    isResourceLoadError(new Error('Failed to fetch dynamically imported module: /chunk.js')),
  ).toBe(true);
  expect(isResourceLoadError(new Error('Unable to preload CSS for /chunk.css'))).toBe(true);
  expect(isResourceLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false);
});
it('removes preload listener and leaves error propagation intact', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const remove = registerPreloadErrorLogger();
  const event = new Event('vite:preloadError', { cancelable: true });
  window.dispatchEvent(event);
  expect(log).toHaveBeenCalledTimes(1);
  expect(event.defaultPrevented).toBe(false);
  remove();
  window.dispatchEvent(event);
  expect(log).toHaveBeenCalledTimes(1);
  log.mockRestore();
});
