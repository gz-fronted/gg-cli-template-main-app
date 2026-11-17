import { create } from 'zustand';
import type { MicroAppDefinition } from './runtime';
export interface MicroAppTab {
  definition: MicroAppDefinition;
  routePath: string;
}
interface TabState {
  tabs: MicroAppTab[];
  activeId: string | null;
  visit: (definition: MicroAppDefinition, routePath: string) => void;
  close: (name: string) => void;
  reset: () => void;
}
/** 每个应用一个标签；完整路由和激活状态原子更新，杜绝旧 query 回写。 */
export const useMicroAppTabs = create<TabState>((set) => ({
  tabs: [],
  activeId: null,
  visit: (definition, routePath) =>
    set((state) => {
      const existing = state.tabs.find((tab) => tab.definition.name === definition.name);
      if (existing?.routePath === routePath && state.activeId === definition.name) return state;
      // 最近使用的放在末尾，超过 10 个时淘汰最早的标签，React 卸载负责释放实例。
      const tabs = [
        ...state.tabs.filter((tab) => tab.definition.name !== definition.name),
        { definition, routePath },
      ].slice(-10);
      return { tabs, activeId: definition.name };
    }),
  close: (name) =>
    set((state) => ({
      tabs: state.tabs.filter((tab) => tab.definition.name !== name),
      activeId: state.activeId === name ? null : state.activeId,
    })),
  reset: () => set({ tabs: [], activeId: null }),
}));
