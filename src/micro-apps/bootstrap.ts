import Garfish from 'garfish';
import { create } from 'zustand';
import { useGlobalStore } from '@/store/useGlobalStore';
import { createMicroAppRuntime, type MicroAppDefinition } from './runtime';

export const reactMicroApp: MicroAppDefinition = {
  name: 'react',
  basename: '/micro-react-1',
  entry: import.meta.env.VITE_MICRO_APP_REACT_ENTRY ?? '',
};

export const microAppRuntime = createMicroAppRuntime((definition) => {
  const { user, token } = useGlobalStore.getState();
  return { globalState: { user, token, basename: definition.basename, contentOnly: true } };
});

export function reportMicroAppError(error: unknown): void {
  console.error('[micro-app] 生命周期操作失败', error);
}

let unsubscribe: (() => void) | undefined;
let currentCleanup: Promise<void> | undefined;

// 临时状态不持久化，路由守卫等待清理完成后才显示登录页。
export const useMicroAppCleanupState = create<{ pending: boolean }>(() => ({ pending: false }));

export function cleanupMicroAppRuntime(): Promise<void> {
  useMicroAppCleanupState.setState({ pending: true });
  const work = microAppRuntime.dispose();
  currentCleanup = work;
  const finish = () => {
    if (currentCleanup === work) {
      currentCleanup = undefined;
      useMicroAppCleanupState.setState({ pending: false });
    }
  };
  void work.then(finish, finish);
  return work;
}

/** 真正卸载活动及空闲实例，等待清理完成；保留登录态订阅供后续会话使用。 */
export function disposeGarfishRuntimeCache(): Promise<void> {
  return cleanupMicroAppRuntime();
}

export function initializeMicroApps(): void {
  if (unsubscribe) return;
  // 挂载由 React 路由容器负责，不再同时配置 activeWhen 自动调度。
  if (!Garfish.running) Garfish.run({ basename: '/', disablePreloadApp: true });
  unsubscribe = useGlobalStore.subscribe((state, previous) => {
    if (state.token !== previous.token || state.user !== previous.user) {
      void cleanupMicroAppRuntime().catch(reportMicroAppError);
    }
  });
}

export function disposeMicroApps(): Promise<void> {
  unsubscribe?.();
  unsubscribe = undefined;
  return cleanupMicroAppRuntime();
}
