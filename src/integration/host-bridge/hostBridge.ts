import {
  HostBridgeEvent,
  type HostBridgeEnvelope,
  type HostBridgeEventType,
  type SubAppTarget,
  type HostBridgeContext,
} from './types';
export { HostBridgeEvent } from './types';
type Handler = (payload: unknown, context: HostBridgeContext) => void | Promise<void>;
const events = new Set<string>(Object.values(HostBridgeEvent));
export function parseEnvelope(data: unknown): HostBridgeEnvelope | null {
  if (!data || typeof data !== 'object') return null;
  const candidate = data as Partial<HostBridgeEnvelope>;
  if (typeof candidate.event !== 'string' || !events.has(candidate.event)) return null;
  if (candidate.appId !== undefined && typeof candidate.appId !== 'string') return null;
  if (candidate.tabId !== undefined && typeof candidate.tabId !== 'string') return null;
  return candidate as HostBridgeEnvelope;
}
export function createHostBridge(report: (error: unknown) => void = () => {}) {
  const targets = new Map<string, SubAppTarget>();
  const handlers = new Map<HostBridgeEventType, Set<Handler>>();
  let listening = false;
  const dispatch = (
    envelope: HostBridgeEnvelope,
    origin: string,
    source: MessageEventSource | null,
  ) => {
    const target = [...targets.values()].find(
      (item) =>
        item.appId === envelope.appId &&
        (!envelope.tabId || item.tabId === envelope.tabId) &&
        item.targetOrigin === origin &&
        item.getWindow() === source,
    );
    if (!target) return;
    for (const handler of handlers.get(envelope.event) ?? []) {
      try {
        void Promise.resolve(
          handler(envelope.payload, {
            appId: target.appId,
            tabId: target.tabId,
            kind: target.kind,
            origin,
          }),
        ).catch(report);
      } catch (error) {
        report(error);
      }
    }
  };
  const onMessage = (event: MessageEvent) => {
    const envelope = parseEnvelope(event.data);
    if (envelope) dispatch(envelope, event.origin, event.source);
  };
  const onCustom = (event: Event) => {
    const envelope = parseEnvelope((event as CustomEvent).detail);
    if (envelope && envelope.event === event.type)
      dispatch(envelope, window.location.origin, window);
  };
  return {
    registerSubAppTarget(target: SubAppTarget) {
      if (!target.targetOrigin || target.targetOrigin === '*')
        throw new Error('Bridge target requires an explicit origin');
      targets.set(target.tabId, target);
      return () => {
        if (targets.get(target.tabId) === target) targets.delete(target.tabId);
      };
    },
    getSubAppTarget: (tabId: string) => targets.get(tabId),
    clearSubAppTargets: () => targets.clear(),
    on(event: HostBridgeEventType, handler: Handler) {
      const group = handlers.get(event) ?? new Set<Handler>();
      group.add(handler);
      handlers.set(event, group);
      return () => {
        group.delete(handler);
        if (!group.size) handlers.delete(event);
      };
    },
    emitToTab(tabId: string, event: HostBridgeEventType, payload?: unknown) {
      const target = targets.get(tabId);
      const win = target?.getWindow();
      if (!target || !win) return;
      const envelope = { event, payload, appId: target.appId, tabId, timestamp: Date.now() };
      // Garfish 的同窗口通信使用 CustomEvent，避免广播到所有 message 接收器。
      if (win === window) win.dispatchEvent(new CustomEvent(event, { detail: envelope }));
      else win.postMessage(envelope, target.targetOrigin);
    },
    start() {
      if (listening) return;
      listening = true;
      window.addEventListener('message', onMessage);
      for (const event of events) window.addEventListener(event, onCustom);
    },
    stop() {
      listening = false;
      window.removeEventListener('message', onMessage);
      for (const event of events) window.removeEventListener(event, onCustom);
      targets.clear();
      handlers.clear();
    },
  };
}
export const hostBridge = createHostBridge((error) =>
  Reflect.apply(console.error, console, [
    '[host-bridge]',
    error instanceof Error ? error.message : 'handler failed',
  ]),
);
