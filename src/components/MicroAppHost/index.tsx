import { notifyMicroAppRoute } from '@/micro-apps/routes';
import { RefreshRequiredError } from '@/micro-apps/diagnostics';
import { isResourceLoadError, reloadPage } from '@/components/ErrorBoundary/resourceLoadError';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { useGlobalStore } from '@/store/useGlobalStore';
import { microAppRuntime, reportMicroAppError } from '@/micro-apps/bootstrap';
import type { MicroAppDefinition } from '@/micro-apps/runtime';

export default function MicroAppHost({
  definition,
  routePath = '/',
  active = true,
}: {
  definition: MicroAppDefinition;
  routePath?: string;
  active?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [reloadRequired, setReloadRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const hostId = `micro-app-${encodeURIComponent(JSON.stringify([definition.name, definition.basename]))}`;
  const user = useGlobalStore((state) => state.user);
  const token = useGlobalStore((state) => state.token);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !token) return;
    let cancelled = false;
    setError(undefined);
    setReloadRequired(false);
    setLoading(true);
    const lease = microAppRuntime.attach(definition, host);
    void lease.ready.then(
      () => {
        if (!cancelled) setLoading(false);
      },
      (reason: unknown) => {
        if (!cancelled) {
          setLoading(false);
          setReloadRequired(reason instanceof RefreshRequiredError || isResourceLoadError(reason));
          setError(reason instanceof Error ? reason.message : '子应用加载失败');
        }
      },
    );
    useEffect(() => {
      if (!loading && !error && active) notifyMicroAppRoute(definition, routePath);
    }, [definition, routePath, active, loading, error]);

    return () => {
      cancelled = true;
      void lease.release().catch(reportMicroAppError);
    };
  }, [definition, user, token, attempt]);

  useEffect(() => {
    if (!loading && !error && active) notifyMicroAppRoute(definition, routePath);
  }, [definition, routePath, active, loading, error]);

  return (
    <div style={{ height: '100%', minHeight: 0 }}>
      {loading && (
        <Spin description="子应用加载中">
          <div />
        </Spin>
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          description={reloadRequired ? '刷新将重新加载主应用，未保存内容可能丢失。' : undefined}
          action={
            <Button onClick={reloadRequired ? reloadPage : () => setAttempt((value) => value + 1)}>
              {reloadRequired ? '刷新主应用' : '重试'}
            </Button>
          }
        />
      )}
      <div id={hostId} ref={hostRef} style={{ height: '100%', minHeight: 0 }} />
    </div>
  );
}
