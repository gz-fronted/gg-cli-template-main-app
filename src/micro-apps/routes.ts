import type { MicroAppDefinition } from './runtime';
export const HOST_SUBAPP_ROUTE_EVENT = 'pilotcore:host-subapp-route';
export const SUBAPP_ROUTE_MESSAGE = 'pilotcore:subapp-route-change';
export function normalizeRoutePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\r\n]/.test(path)) return '/';
  return path;
}
export function matchMicroApp(
  pathname: string,
  search: string,
  hash: string,
  definitions: MicroAppDefinition[],
) {
  const definition = [...definitions]
    .sort((a, b) => b.basename.length - a.basename.length)
    .find((app) => pathname === app.basename || pathname.startsWith(`${app.basename}/`));
  return definition
    ? {
        definition,
        routePath: `${pathname.slice(definition.basename.length) || '/'}${search}${hash}`,
      }
    : null;
}
export function notifyMicroAppRoute(definition: MicroAppDefinition, routePath: string): void {
  window.dispatchEvent(
    new CustomEvent(HOST_SUBAPP_ROUTE_EVENT, {
      detail: { appId: definition.name, appName: definition.name, routePath },
    }),
  );
}
