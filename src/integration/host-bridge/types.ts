type ThemeMode = string;
interface SidebarTab {
  tabId: string;
  appId: string;
  routePath?: string;
}

/**
 * 主子应用通信协议事件名。
 * 枚举值必须和接入文档/子应用 SDK 保持一致，否则 postMessage 会被 parseEnvelope 拒绝。
 */
export const HostBridgeEvent = {
  UserLogout: 'g-user-logout',
  ThemeChange: 'g-theme-change',
  ShowMask: 'g-show-mask',
  HideMask: 'g-hide-mask',
  Navigate: 'g-navigate',
  NavigationConsumed: 'g-navigation-consumed',
  AuthToken: 'g-auth-token',
  CloseTab: 'g-close-tab',
  CloseCurrentTab: 'g-close-current-tab',
  ActiveTabChange: 'g-active-tab-change',
} as const;

export type HostBridgeEventType = (typeof HostBridgeEvent)[keyof typeof HostBridgeEvent];

/** 主题名直接复用主应用主题模式，避免主子应用出现第二套主题枚举。 */
export type ThemeName = ThemeMode;

export type NavigateParamValue = string | number | boolean | null | undefined;
export type NavigateParamsRecord = Record<string, NavigateParamValue>;

export interface LogoutParams {
  /** 登出原因，主应用可用于埋点、日志或提示文案。 */
  reason?: string;
  /** 登出后跳转地址；不传时由主应用默认跳到 /login。 */
  redirectTo?: string;
}

/** 子应用请求主应用显示全局遮罩，覆盖整个系统视口。 */
export interface ShowMaskParams {
  /** 遮罩中心提示文案。 */
  message?: string;
  /** 遮罩整体透明度；直接映射到 CSS opacity。 */
  opacity?: number;
  /** 遮罩层级；直接映射到 CSS z-index。 */
  zIndex?: number;
}

/** 导航、关闭指定标签时用于定位目标子应用页面。 */
export interface NavigateParams {
  /** 目标子应用 id，必须和 logininfo/注册表中的 id 一致。 */
  appId: string;
  /** 子应用内路由；不传时按根路径 / 处理。 */
  routePath?: string;
  /** 导航参数；主应用会合并到子应用 routePath 的 query string。 */
  params?: NavigateParamsRecord;
}

/** 子应用完成参数消费后回传主应用的确认。 */
export interface NavigationConsumedParams {
  paramKeys: string[];
}

export interface CloseCurrentTabParams {
  next?: NavigateParams;
}
/** 主应用当前激活的视图与标签，仅用于子应用感知前台/后台状态。 */
export interface ActiveTabChangeParams {
  activeTab: SidebarTab;
}

export type AuthTokenPayload = string;

/** 事件名到 payload 类型的唯一映射；新增协议事件时优先改这里。 */
export interface HostBridgePayloadMap {
  [HostBridgeEvent.UserLogout]: LogoutParams | undefined;
  [HostBridgeEvent.ThemeChange]: ThemeName;
  [HostBridgeEvent.ShowMask]: ShowMaskParams | undefined;
  [HostBridgeEvent.HideMask]: undefined;
  [HostBridgeEvent.Navigate]: NavigateParams;
  [HostBridgeEvent.NavigationConsumed]: NavigationConsumedParams;
  [HostBridgeEvent.AuthToken]: AuthTokenPayload;
  [HostBridgeEvent.CloseTab]: NavigateParams;
  [HostBridgeEvent.CloseCurrentTab]: CloseCurrentTabParams | undefined;
  [HostBridgeEvent.ActiveTabChange]: ActiveTabChangeParams;
}

export type HostBridgePayload<E extends HostBridgeEventType = HostBridgeEventType> =
  HostBridgePayloadMap[E];

/** postMessage / Garfish CustomEvent 共用的统一消息信封。 */
export interface HostBridgeEnvelope<E extends HostBridgeEventType = HostBridgeEventType> {
  /** 协议事件名。 */
  event: E;
  /** 事件载荷，类型由 HostBridgePayloadMap 决定。 */
  payload?: HostBridgePayload<E>;
  /** 子应用 appId；子应用发给主应用时建议必填，便于主应用校验来源。 */
  appId?: string;
  /** 主应用标签 id；主应用下发到具体 tab 时会填入。 */
  tabId?: string;
  /** 发送时间戳，仅用于排查问题，不参与协议校验。 */
  timestamp?: number;
}

export type SubAppKind = 'garfish' | 'iframe';

/** 主应用侧已挂载子应用的投递目标。 */
export interface SubAppTarget {
  /** 子应用 id。 */
  appId: string;
  /** 主应用标签 id，同一个 appId 可以有多个 tab 实例。 */
  tabId: string;
  /** 子应用承载方式，用于 handler 判断 iframe/Garfish 差异。 */
  kind: SubAppKind;
  /** postMessage 的目标 origin，来自 iframe src 或 Garfish entry，敏感消息禁止使用 *。 */
  targetOrigin: string;
  /** 当前子应用 window；iframe 取 contentWindow，Garfish 取 sandbox window。 */
  getWindow: () => Window | null;
}

/** 主应用收到消息后传给业务 handler 的上下文。 */
export interface HostBridgeContext {
  appId?: string;
  tabId?: string;
  kind?: SubAppKind;
  origin?: string;
}

export type HostBridgeHandler<E extends HostBridgeEventType = HostBridgeEventType> = (
  payload: HostBridgePayload<E>,
  context: HostBridgeContext,
) => void | Promise<void>;
