/**
 * 路由配置 (React Router Data API)
 * 采用对象配置模式，便于管理和扩展
 */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import BasicLayout from '@/layouts/BasicLayout';
import AuthRoute from '@/components/AuthRoute';

// 路由懒加载配置
const Login = lazy(() => import('@/pages/login'));
const Home = lazy(() => import('@/pages/home'));
const About = lazy(() => import('@/pages/about'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Workspace = lazy(() => import('@/pages/workspace'));
const Calendar = lazy(() => import('@/pages/calendar'));
const Settings = lazy(() => import('@/pages/settings'));
const NotFound = lazy(() => import('@/pages/404'));
const MicroApp = lazy(() => import('@/pages/micro-app'));

// 全局 Loading 组件
const Loading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: 400,
    }}
  >
    <Spin size="large" />
  </div>
);

// 包装懒加载组件，统一添加 Suspense
function withSuspense(Component: LazyExoticComponent<ComponentType<any>>) {
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/',
    // 根布局：BasicLayout (包含侧边栏和 Header)，用 AuthRoute 保护
    element: (
      <AuthRoute>
        <BasicLayout />
      </AuthRoute>
    ),
    // 子路由：渲染在 BasicLayout 的 <Outlet /> 中
    children: [
      {
        index: true, // 默认子路由 (首页)
        element: withSuspense(Home),
      },
      {
        path: 'dashboard',
        element: withSuspense(Dashboard),
      },
      {
        path: 'about',
        element: withSuspense(About),
      },
      {
        path: 'workspace',
        element: withSuspense(Workspace),
      },
      {
        path: 'calendar',
        element: withSuspense(Calendar),
      },
      {
        path: 'settings',
        element: withSuspense(Settings),
      },
      // 子应用路由：匹配所有 /micro-react-1 及之后的路径
      {
        path: 'micro-react-1/*',
        element: withSuspense(MicroApp),
      },
      // 404 页面配置
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
]);
