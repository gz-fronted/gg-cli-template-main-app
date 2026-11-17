export class RefreshRequiredError extends Error {
  constructor(message = '子应用运行时尚未恢复，请刷新主应用后重试') {
    super(message);
  }
}
const records: { name: string; phase: string; elapsedMs: number; timestamp: number }[] = [];
/** 只保存有界标量，不记录 DOM、实例、props 或认证信息。 */
export function recordLifecycle(name: string, phase: string, elapsedMs = 0): void {
  const record = { name: name.slice(0, 200), phase, elapsedMs, timestamp: Date.now() };
  records.push(record);
  if (records.length > 200) records.shift();
  if (phase === 'error' || phase === 'timeout')
    Reflect.apply(console.error, console, ['[micro-app]', record]);
}
export const getMicroAppDiagnostics = () => records.map((record) => ({ ...record }));
