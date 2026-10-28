import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { useGlobalStore } from '@/store/useGlobalStore';
import { microAppRuntime, reportMicroAppError } from '@/micro-apps/bootstrap';
import type { MicroAppDefinition } from '@/micro-apps/runtime';

export default function MicroAppHost({ definition }: { definition: MicroAppDefinition }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
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
    setLoading(true);
    const lease = microAppRuntime.attach(definition, host);
    void lease.ready.then(
      () => {
        if (!cancelled) setLoading(false);
      },
      (reason: unknown) => {
        if (!cancelled) {
          setLoading(false);
          setError(reason instanceof Error ? reason.message : '子应用加载失败');
        }
      },
    );
    return () => {
      cancelled = true;
      void lease.release().catch(reportMicroAppError);
    };
  }, [definition, user, token, attempt]);

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
          action={<Button onClick={() => setAttempt((value) => value + 1)}>重试</Button>}
        />
      )}
      <div id={hostId} ref={hostRef} style={{ height: '100%', minHeight: 0 }} />
    </div>
  );
}
