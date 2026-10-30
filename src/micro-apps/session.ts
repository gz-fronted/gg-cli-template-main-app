import { useGlobalStore } from '@/store/useGlobalStore';
import { disposeGarfishRuntimeCache, reportMicroAppError } from './bootstrap';

/** 清除认证态，并等待当前会话的微应用退出；可用于主动退出等入口。 */
export async function clearMicroAppSession(): Promise<void> {
  useGlobalStore.getState().clearLoginState();
  await disposeGarfishRuntimeCache();
}

/** 清理失败也不能继续保持登录状态；报告后继续导航。 */
export async function clearSessionAndNavigate(navigate: () => void): Promise<void> {
  try {
    await clearMicroAppSession();
  } catch (error) {
    reportMicroAppError(error);
  } finally {
    navigate();
  }
}
