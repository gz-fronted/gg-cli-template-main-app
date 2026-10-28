import Garfish from 'garfish';
import { loadWithTimeout } from './loadWithTimeout';

type GarfishApp = NonNullable<Awaited<ReturnType<typeof Garfish.loadApp>>>;

export interface MicroAppDefinition {
  name: string;
  entry: string;
  basename: string;
}

interface RuntimeSlot {
  key: string;
  app: GarfishApp;
  target: { host: HTMLElement | null };
  owner: symbol | null;
  failed: boolean;
}

// 稳定 ID 让框架按应用名缓存的性能 getter 在容器重建后仍可解析，不保留旧 DOM。
function createDomGetter(target: RuntimeSlot['target'], hostId: string) {
  return () => (hostId ? document.getElementById(hostId) : target.host);
}

export interface MicroAppRuntimeOptions {
  maxIdleSlots?: number;
  maxTotalSlots?: number;
  loadTimeoutMs?: number;
}

/** hide/show 保留模块运行时；只有空闲池淘汰、会话切换和入口销毁才真正 unmount。 */
export function createMicroAppRuntime(
  getProps: (definition: MicroAppDefinition) => Record<string, unknown>,
  { maxIdleSlots = 5, maxTotalSlots = 15, loadTimeoutMs = 30_000 }: MicroAppRuntimeOptions = {},
) {
  const slots = new Set<RuntimeSlot>();
  const pendingLoads = new Map<string, Promise<GarfishApp | null>>();
  let queue: Promise<void> = Promise.resolve();
  let sessionVersion = 0;
  let disposal: Promise<void> | undefined;

  // Garfish 会合并同名 loadApp 请求，生命周期串行后不同宿主才不会抢到同一实例。
  function enqueue<T>(task: () => T | Promise<T>): Promise<T> {
    const result = queue.then(task);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function remove(slot: RuntimeSlot): void {
    slot.failed = true;
    try {
      if (slot.app.mounted && !slot.app.unmount()) {
        throw new Error('子应用卸载失败');
      }
      if (!slot.app.mounted && Garfish.activeApps?.includes(slot.app)) {
        throw new Error('子应用仍被框架持有，资源尚未释放');
      }
      slots.delete(slot);
    } finally {
      slot.target.host = null;
      slot.owner = null;
      slot.app.appInfo.props = {};
    }
  }

  function park(slot: RuntimeSlot): void {
    if (slot.app.display && !slot.app.hide()) throw new Error('子应用隐藏失败');
    slot.target.host = null;
    slot.owner = null;
    slot.app.appInfo.props = {};
    // 最近停靠的排在末尾，超过上限时优先淘汰最早停靠的空闲实例。
    slots.delete(slot);
    slots.add(slot);
    const idle = [...slots].filter((item) => !item.owner && !item.failed);
    for (const item of idle.slice(0, Math.max(0, idle.length - maxIdleSlots))) {
      try {
        remove(item);
      } catch (error) {
        console.error('[micro-app] 空闲实例淘汰失败', error);
      }
    }
  }

  function reserveCapacity(): void {
    for (const slot of [...slots]) {
      if (slots.size + pendingLoads.size < maxTotalSlots) return;
      if (slot.owner || slot.failed) continue;
      try {
        remove(slot);
      } catch (error) {
        console.error('[micro-app] 容量回收失败', error);
      }
    }
    if (slots.size + pendingLoads.size >= maxTotalSlots) {
      throw new Error('子应用运行时容量已满，请保存工作后刷新主应用');
    }
  }

  function attach(definition: MicroAppDefinition, host: HTMLElement) {
    const owner = Symbol(definition.name);
    const version = sessionVersion;
    let cancelled = false;
    let slot: RuntimeSlot | undefined;
    const isCurrent = () => !cancelled && version === sessionVersion && host.isConnected;

    const ready = enqueue(async () => {
      if (!isCurrent()) return;
      const entry = definition.entry.trim();
      if (!entry) throw new Error('未配置子应用入口地址');
      const key = JSON.stringify([definition.name, definition.basename, entry]);
      slot = [...slots].find((item) => item.key === key && !item.owner && !item.failed);
      try {
        if (!slot) {
          // Garfish 会把同名在途请求合并；超时重试不能接回旧请求的晚到实例。
          if (pendingLoads.has(definition.name)) throw new Error('子应用仍在加载，请稍后重试');
          reserveCapacity();
          // 闭包只保留可清空的槽位，停靠后不继续引用旧 React 宿主 DOM。
          const target = { host: host as HTMLElement | null };
          const pending = Garfish.loadApp(definition.name, {
            entry,
            basename: definition.basename,
            sandbox: false,
            cache: false,
            domGetter: createDomGetter(target, host.id),
            // 资源加载阶段不持有登录态，实际执行 mount/show 前再注入。
            props: {},
          });
          const tracked = pending.finally(() => {
            if (pendingLoads.get(definition.name) === tracked) pendingLoads.delete(definition.name);
          });
          pendingLoads.set(definition.name, tracked);
          let app: GarfishApp | null;
          try {
            app = await loadWithTimeout(tracked, loadTimeoutMs, (lateApp) => {
              target.host = null;
              if (lateApp) lateApp.appInfo.props = {};
            });
          } catch (error) {
            target.host = null;
            throw error;
          }
          if (!app) throw new Error('子应用加载失败');
          slot = { key, app, target, owner, failed: false };
          slots.add(slot);
        }
        slot.target.host = host;
        slot.owner = owner;
        if (isCurrent()) {
          // 每次 mount/show 都读取当前登录态，避免复用启动时的 token 快照。
          slot.app.appInfo.props = getProps(definition);
          const success = slot.app.mounted ? await slot.app.show() : await slot.app.mount();
          if (!success) throw new Error('子应用挂载失败');
        }
        if (!isCurrent()) {
          if (version !== sessionVersion) remove(slot);
          else park(slot);
        }
      } catch (error) {
        if (slot) {
          try {
            remove(slot);
          } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], '子应用操作及清理失败');
          }
        }
        throw error;
      }
    });

    return {
      ready,
      release: () => {
        cancelled = true;
        return enqueue(() => {
          try {
            if (slot?.owner === owner) {
              try {
                park(slot);
              } catch (error) {
                remove(slot);
                throw error;
              }
            }
          } finally {
            // release 句柄不再持有已停靠或已淘汰的槽位。
            slot = undefined;
          }
        });
      },
    };
  }

  function dispose(): Promise<void> {
    // 立即使在途加载失效，清理任务排队等待加载/挂载完成后再执行。
    sessionVersion += 1;
    if (disposal) return disposal;
    const work = enqueue(() => {
      const errors: unknown[] = [];
      for (const slot of [...slots]) {
        try {
          remove(slot);
        } catch (error) {
          errors.push(error);
        }
      }
      if (pendingLoads.size) errors.push(new Error('仍有超时的底层加载未返回'));
      if (errors.length) throw new AggregateError(errors, '子应用运行时清理失败');
    });
    const tracked = work.finally(() => {
      if (disposal === tracked) disposal = undefined;
    });
    disposal = tracked;
    return tracked;
  }

  return { attach, dispose };
}
