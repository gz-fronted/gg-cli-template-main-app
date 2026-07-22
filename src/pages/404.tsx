import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * 404 页面组件
 * 当用户访问不存在的路由时展示
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      }
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 8,
        margin: 24,
      }}
    />
  );
}
