import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'gz-ui-web';
import { router } from '@/router';
import 'antd/dist/reset.css';
import './style.less';
import { disposeMicroApps, initializeMicroApps, reportMicroAppError } from '@/micro-apps/bootstrap';

initializeMicroApps();

const root = createRoot(document.getElementById('root')!);
root.render(
  <ConfigProvider cssVarScope="main-app" theme={{ hashed: false }} themeMode="gold-light">
    <RouterProvider router={router} />
  </ConfigProvider>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount();
    router.dispose();
    void disposeMicroApps().catch(reportMicroAppError);
  });
}
