import { hostBridge } from '@/integration/host-bridge/hostBridge';
import { registerHostHandlers } from '@/integration/host-bridge/handlers';
import { clearSessionAndNavigate } from '@/micro-apps/session';
import { useEffect } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import MicroAppHost from '@/components/MicroAppHost';
import { microAppDefinitions } from '@/micro-apps/bootstrap';
import { useMicroAppTabs } from '@/micro-apps/tabs';
import { matchMicroApp, normalizeRoutePath, SUBAPP_ROUTE_MESSAGE } from '@/micro-apps/routes';

export default function MicroAppTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = useMicroAppTabs((state) => state.tabs);
  const panelCacheOrder = useMicroAppTabs((state) => state.panelCacheOrder);
  const match = matchMicroApp(
    location.pathname,
    location.search,
    location.hash,
    microAppDefinitions,
  );
  const name = match?.definition.name;
  const routePath = match?.routePath;
  useEffect(() => {
    hostBridge.start();
    const unregister = registerHostHandlers(hostBridge, {
      logout: (redirect) => clearSessionAndNavigate(() => navigate(redirect, { replace: true })),
      navigate: (appId, path) => {
        const app = microAppDefinitions.find((item) => item.name === appId);
        if (app) navigate(`${app.basename}${path}`);
      },
      close: (appId) => {
        const state = useMicroAppTabs.getState();
        state.close(appId);
        if (name === appId) {
          const next = useMicroAppTabs.getState().tabs.at(-1);
          navigate(next ? `${next.definition.basename}${next.routePath}` : '/', { replace: true });
        }
      },
      consume: (appId, keys) => {
        const state = useMicroAppTabs.getState();
        const tab = state.tabs.find((item) => item.definition.name === appId);
        if (!tab) return;
        const url = new URL(tab.routePath, window.location.origin);
        keys.forEach((key) => url.searchParams.delete(key));
        const path = url.pathname + url.search + url.hash;
        state.updateRoute(appId, path);
        if (name === appId) navigate(`${tab.definition.basename}${path}`, { replace: true });
      },
    });
    return unregister;
  }, [navigate, name]);

  useEffect(() => {
    if (name && routePath) {
      const definition = microAppDefinitions.find((app) => app.name === name)!;
      useMicroAppTabs.getState().visit(definition, routePath);
    }
  }, [name, routePath]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data: unknown = event.data;
      if (
        !data ||
        typeof data !== 'object' ||
        !('type' in data) ||
        data.type !== SUBAPP_ROUTE_MESSAGE ||
        !('appId' in data) ||
        data.appId !== name ||
        !('routePath' in data) ||
        typeof data.routePath !== 'string'
      )
        return;
      const definition = microAppDefinitions.find((app) => app.name === name);
      if (!definition) return;
      const next = normalizeRoutePath(data.routePath);
      if (next !== data.routePath || next === routePath) return;
      navigate(`${definition.basename}${next}`, { replace: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [name, routePath, navigate]);
  return (
    <>
      {tabs.length > 0 && (
        <Tabs
          type="editable-card"
          hideAdd
          activeKey={name ?? ''}
          items={tabs.map((tab) => ({ key: tab.definition.name, label: tab.definition.name }))}
          onChange={(id) => {
            const tab = tabs.find((item) => item.definition.name === id);
            if (tab) navigate(`${tab.definition.basename}${tab.routePath}`);
          }}
          onEdit={(key, action) => {
            if (action !== 'remove' || typeof key !== 'string') return;
            const remaining = tabs.filter((tab) => tab.definition.name !== key);
            useMicroAppTabs.getState().close(key);
            if (key === name) {
              const next = remaining.at(-1);
              navigate(next ? `${next.definition.basename}${next.routePath}` : '/', {
                replace: true,
              });
            }
          }}
        />
      )}
      {tabs
        .filter((tab) => panelCacheOrder.includes(tab.definition.name))
        .map((tab) => (
          <div
            key={tab.definition.name}
            hidden={tab.definition.name !== name}
            style={{ height: '100%' }}
          >
            <MicroAppHost
              definition={tab.definition}
              routePath={tab.definition.name === name ? routePath! : tab.routePath}
              active={tab.definition.name === name}
            />
          </div>
        ))}
    </>
  );
}
