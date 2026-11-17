import { afterEach, expect, it, vi } from 'vitest';
import { createHostBridge, HostBridgeEvent } from './hostBridge';
import { registerHostHandlers } from './handlers';
const bridge = createHostBridge();
const target = () => ({
  appId: 'a',
  tabId: 'a',
  kind: 'garfish' as const,
  targetOrigin: window.location.origin,
  getWindow: () => window,
});
afterEach(() => bridge.stop());
function send(event: string, payload?: unknown, origin = window.location.origin) {
  window.dispatchEvent(
    new MessageEvent('message', {
      source: window,
      origin,
      data: { event, payload, appId: 'a', tabId: 'a' },
    }),
  );
}
it('old cleanup does not delete replacement target', () => {
  const old = bridge.registerSubAppTarget(target());
  const replacement = target();
  const release = bridge.registerSubAppTarget(replacement);
  old();
  expect(bridge.getSubAppTarget('a')).toBe(replacement);
  release();
  expect(bridge.getSubAppTarget('a')).toBeUndefined();
});
it('validates source and removes listeners and handlers on stop', () => {
  bridge.start();
  bridge.start();
  bridge.registerSubAppTarget(target());
  const handler = vi.fn();
  bridge.on(HostBridgeEvent.UserLogout, handler);
  send(HostBridgeEvent.UserLogout, {}, 'https://external.example');
  expect(handler).not.toHaveBeenCalled();
  send(HostBridgeEvent.UserLogout);
  expect(handler).toHaveBeenCalledTimes(1);
  bridge.stop();
  send(HostBridgeEvent.UserLogout);
  expect(handler).toHaveBeenCalledTimes(1);
});
it('coalesces logout until session cleanup finishes and validates navigation', async () => {
  let finish!: () => void;
  const logout = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const navigate = vi.fn();
  bridge.start();
  bridge.registerSubAppTarget(target());
  const off = registerHostHandlers(bridge, { logout, navigate, close: vi.fn(), consume: vi.fn() });
  send(HostBridgeEvent.UserLogout, { redirectTo: 'https://external.example' });
  send(HostBridgeEvent.UserLogout);
  expect(logout).toHaveBeenCalledTimes(1);
  expect(logout).toHaveBeenCalledWith('/login');
  send(HostBridgeEvent.Navigate, { appId: 'b', routePath: '/detail?old=1', params: { id: 2 } });
  expect(navigate).toHaveBeenCalledWith('b', '/detail?old=1&id=2');
  send(HostBridgeEvent.Navigate, { appId: 'b', routePath: '//external.example' });
  expect(navigate).toHaveBeenCalledTimes(1);
  finish();
  await Promise.resolve();
  off();
});
