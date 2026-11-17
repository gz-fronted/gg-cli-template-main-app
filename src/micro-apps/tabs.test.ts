import { beforeEach, expect, it } from 'vitest';
import { MAX_KEEP_ALIVE_PANELS, useMicroAppTabs } from './tabs';
const app = (i: number) => ({ name: `app-${i}`, basename: `/app-${i}`, entry: `/entry-${i}` });
beforeEach(() => useMicroAppTabs.getState().reset());
it('evicts only the least recently used panel and preserves all tabs and routes', () => {
  for (let i = 0; i < 10; i++) useMicroAppTabs.getState().visit(app(i), `/detail?id=${i}#section`);
  useMicroAppTabs.getState().visit(app(0), '/detail?id=0#section');
  useMicroAppTabs.getState().visit(app(10), '/new');
  const state = useMicroAppTabs.getState();
  expect(state.tabs).toHaveLength(11);
  expect(state.panelCacheOrder).toHaveLength(MAX_KEEP_ALIVE_PANELS);
  expect(state.panelCacheOrder).not.toContain('app-1');
  expect(state.panelCacheOrder).toContain('app-0');
  expect(state.tabs[1].routePath).toBe('/detail?id=1#section');
  expect(state.tabs.map((tab) => tab.definition.name)).toEqual(
    Array.from({ length: 11 }, (_, i) => `app-${i}`),
  );
  state.visit(app(1), state.tabs[1].routePath);
  expect(useMicroAppTabs.getState().panelCacheOrder[0]).toBe('app-1');
  expect(useMicroAppTabs.getState().panelCacheOrder).not.toContain('app-2');
});
it('close and session reset release cache membership and tab state', () => {
  useMicroAppTabs.getState().visit(app(0), '/');
  useMicroAppTabs.getState().close('app-0');
  expect(useMicroAppTabs.getState().panelCacheOrder).toEqual([]);
  expect(useMicroAppTabs.getState().tabs).toEqual([]);
  useMicroAppTabs.getState().visit(app(1), '/');
  useMicroAppTabs.getState().reset();
  expect(useMicroAppTabs.getState().panelCacheOrder).toEqual([]);
  expect(useMicroAppTabs.getState().activeId).toBeNull();
});
