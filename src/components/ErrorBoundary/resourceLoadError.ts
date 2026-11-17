/** Only classify explicit module/resource loading failures, not generic TypeErrors. */
export function isResourceLoadError(error: unknown): boolean {
  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? error.message
        : undefined;
  if (typeof message !== 'string') return false;

  return [
    /Failed to fetch dynamically imported module/i,
    /error loading dynamically imported module/i,
    /Importing a module script failed/i,
    /Unable to preload CSS for /i,
    /Loading (?:CSS )?chunk .+ failed/i,
  ].some((pattern) => pattern.test(message));
}

export function reloadPage(): void {
  window.location.reload();
}

export function registerPreloadErrorLogger(): () => void {
  const onPreloadError = (event: Event & { payload?: unknown }): void => {
    // Vite also dispatches this event for module evaluation errors. Do not treat
    // every payload as a network failure or prevent propagation to React.lazy.
    Reflect.apply(console.error, console, [
      '[page-preload]',
      {
        kind: isResourceLoadError(event.payload) ? 'resource-load' : 'module-error',
        pathname: window.location.pathname,
        // 不保存错误对象，避免意外保留业务引用。
      },
    ]);
  };
  window.addEventListener('vite:preloadError', onPreloadError);
  return () => window.removeEventListener('vite:preloadError', onPreloadError);
}
