import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'gz-ui-web';
import { router } from '@/router';
import 'antd/dist/reset.css';
import './style.less';
// index.js（主应用入口处）
import Garfish from 'garfish';
import { useGlobalStore } from '@/store/useGlobalStore';

Garfish.run({
  basename: '/',
  domGetter: '#subApp',
  apps: [
    {
      name: 'react',
      activeWhen: '/micro-react-1',
      // 通过 Vite 环境变量动态获取子应用地址
      entry: import.meta.env.VITE_MICRO_APP_REACT_ENTRY,
      sandbox: false,
      // 动态传递主应用的全局状态给子应用
      props: {
        globalState: {
          user: useGlobalStore.getState().user,
          token: useGlobalStore.getState().token,
        }
      }
    },
  ],
});

createRoot(document.getElementById('root')!).render(
  <ConfigProvider cssVarScope="main-app" theme={{ hashed: false }} themeMode="gold-light">
    <RouterProvider router={router} />
  </ConfigProvider>
);
