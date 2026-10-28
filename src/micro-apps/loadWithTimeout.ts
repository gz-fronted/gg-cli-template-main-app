/** 超时只结束等待，不代表底层请求已取消；晚到结果单独清理。 */
export function loadWithTimeout<T>(
  load: Promise<T>,
  timeoutMs: number,
  onLateResult: (result: T) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      reject(new Error('子应用加载超时，请重试'));
    }, timeoutMs);
    void load.then(
      (result) => {
        window.clearTimeout(timer);
        if (!timedOut) resolve(result);
        else {
          try {
            onLateResult(result);
          } catch (error) {
            console.error('[micro-app] 晚到结果清理失败', error);
          }
        }
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        if (!timedOut) reject(error);
      },
    );
  });
}
