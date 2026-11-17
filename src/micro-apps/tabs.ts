import { create } from 'zustand';
import type { MicroAppDefinition } from './runtime';
export interface MicroAppTab {
  definition: MicroAppDefinition;
  routePath: string;
}
export const MAX_KEEP_ALIVE_PANELS = 10;
interface TabState {
  panelCacheOrder: string[];
  tabs: MicroAppTab[];
  activeId: string | null;
  visit: (definition: MicroAppDefinition, routePath: string) => void;
  close: (name: string) => void;
  updateRoute: (name: string, routePath: string) => void;
  reset: () => void;
}
/** 每个应用一个标签；完整路由和激活状态原子更新，杜绝旧 query 回写。 */
export const useMicroAppTabs = create<TabState>((set) => ({
  panelCacheOrder: [],
  tabs: [],
  activeId: null,
  visit: (definition, routePath) =>
    set((state) => {
      const existing = state.tabs.find((tab) => tab.definition.name === definition.name);
      if (
        existing?.routePath === routePath &&
        state.activeId === definition.name &&
        state.panelCacheOrder[0] === definition.name
      )
        return state;
      // 标签顺序与保活顺序独立；LRU 只淘汰运行中的面板，保留完整路由。
      const tabs = existing
        ? state.tabs.map((tab) =>
            tab.definition.name === definition.name ? { definition, routePath } : tab,
          )
        : [...state.tabs, { definition, routePath }];
      const panelCacheOrder = [
        definition.name,
        ...state.panelCacheOrder.filter((id) => id !== definition.name),
      ].slice(0, MAX_KEEP_ALIVE_PANELS);
      return { tabs, panelCacheOrder, activeId: definition.name };
    }),
  updateRoute: (name, routePath) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.definition.name === name ? { ...tab, routePath } : tab)),
    })),
  close: (name) =>
    set((state) => ({
      panelCacheOrder: state.panelCacheOrder.filter((id) => id !== name),
      tabs: state.tabs.filter((tab) => tab.definition.name !== name),
      activeId: state.activeId === name ? null : state.activeId,
    })),
  reset: () => set({ tabs: [], activeId: null, panelCacheOrder: [] }),
}));
