import { HostBridgeEvent, type createHostBridge } from './hostBridge';
export function registerHostHandlers(
  bridge: ReturnType<typeof createHostBridge>,
  deps: {
    logout: (redirectTo: string) => Promise<void>;
    navigate: (appId: string, routePath: string) => void;
    close: (appId: string) => void;
    consume: (appId: string, keys: string[]) => void;
  },
) {
  let logout: Promise<void> | undefined;
  const record = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const off = [
    bridge.on(HostBridgeEvent.UserLogout, (payload) => {
      const redirect = record(payload).redirectTo;
      // 统一登出只能跳转本地登录入口，不能由消息指定外部地址。
      const target =
        typeof redirect === 'string' && /^\/login(?:[?#].*)?$/.test(redirect) ? redirect : '/login';
      if (!logout)
        logout = deps.logout(target).finally(() => {
          logout = undefined;
        });
      return logout;
    }),
    bridge.on(HostBridgeEvent.Navigate, (payload) => {
      const value = record(payload);
      if (typeof value.appId !== 'string') return;
      const path = typeof value.routePath === 'string' ? value.routePath : '/';
      if (!path.startsWith('/') || path.startsWith('//') || /[\\\r\n]/.test(path)) return;
      const url = new URL(path, 'https://bridge.invalid');
      for (const [key, item] of Object.entries(record(value.params))) {
        if (['string', 'number', 'boolean'].includes(typeof item))
          url.searchParams.set(key, String(item));
      }
      deps.navigate(value.appId, url.pathname + url.search + url.hash);
    }),
    bridge.on(HostBridgeEvent.CloseCurrentTab, (_payload, context) => {
      if (context.appId) deps.close(context.appId);
    }),
    bridge.on(HostBridgeEvent.CloseTab, (payload) => {
      const id = record(payload).appId;
      if (typeof id === 'string') deps.close(id);
    }),
    bridge.on(HostBridgeEvent.NavigationConsumed, (payload, context) => {
      const keys = record(payload).paramKeys;
      if (context.appId && Array.isArray(keys) && keys.every((key) => typeof key === 'string'))
        deps.consume(context.appId, keys);
    }),
  ];
  return () => off.forEach((unsubscribe) => unsubscribe());
}
