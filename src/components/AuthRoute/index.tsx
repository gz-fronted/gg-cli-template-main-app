import { Navigate, useLocation } from 'react-router-dom';
import { useGlobalStore } from '@/store/useGlobalStore';
import { useMicroAppCleanupState } from '@/micro-apps/bootstrap';

interface AuthRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件 (AuthRoute)
 * 拦截未登录用户的访问请求，重定向到登录页面
 */
export default function AuthRoute({ children }: AuthRouteProps) {
  // 从全局 Store 获取 token
  const token = useGlobalStore((state) => state.token);
  const cleaning = useMicroAppCleanupState((state) => state.pending);
  const location = useLocation();

  // 如果没有 token，说明未登录，重定向到登录页
  // 并通过 state 记录用户原本想访问的页面，以便登录后跳回
  if (!token) {
    if (cleaning) return <div role="status">正在退出登录…</div>;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已经登录，放行，渲染原本的子组件
  return <>{children}</>;
}
