import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useGlobalStore } from '@/store/useGlobalStore';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setLoginState = useGlobalStore((state) => state.setLoginState);

  // 获取用户原本想访问的页面，默认为首页
  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 模拟一个登录请求的延迟
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // 模拟成功后从后端拿到的数据
      const mockToken = 'Bearer mock-jwt-token-12345';
      const mockUser = {
        name: values.username || '国泰海通-张三',
        role: 'admin',
        dept: '交易部',
      };

      // 1. 将 Token 和用户信息存入全局 Store
      setLoginState(mockUser, mockToken);
      
      message.success('登录成功！');
      
      // 2. 跳转回原本的页面
      navigate(from, { replace: true });
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3}>PILOTCORE</Title>
          <span style={{ color: '#8c8c8c' }}>微前端业务基座登录</span>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名 (任意输入)" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码 (任意输入)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
