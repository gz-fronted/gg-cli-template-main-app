import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Space, Typography, Button } from 'antd';
import {
  MessageOutlined,
  AppstoreOutlined,
  FolderOutlined,
  CalendarOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

/**
 * 侧边栏菜单配置
 * 使用数据驱动的方式定义菜单项，方便后续扩展
 * @property {string} key - 路由路径，用于 Link 跳转和菜单高亮
 * @property {ReactNode} icon - 菜单图标组件
 * @property {string} label - 菜单显示名称
 */
const MENU_ITEMS = [
  {
    key: '/',
    icon: <MessageOutlined />,
    label: '聊天',
  },
  {
    key: '/dashboard',
    icon: <AppstoreOutlined />,
    label: '功能大厅',
  },
  {
    key: '/micro-react-1',
    icon: <AppstoreOutlined />,
    label: 'React19 子应用',
  },
  {
    key: '/workspace', // 暂未实现
    icon: <FolderOutlined />,
    label: '工作空间',
  },
  {
    key: '/calendar', // 暂未实现
    icon: <CalendarOutlined />,
    label: '日历',
  },
];

/**
 * 基础布局组件 (BasicLayout)
 *
 * 整体布局结构：
 * - Sider (左侧侧边栏)
 *   - Logo
 *   - Menu (动态渲染)
 *   - UserProfile (底部固定)
 * - Layout (右侧主体)
 *   - Header (顶部导航)
 *   - Content (路由出口 Outlet)
 *
 * @returns {JSX.Element} 布局组件
 */
export default function BasicLayout() {
  // 获取当前路由路径，用于菜单高亮
  const location = useLocation();
  // 路由跳转钩子，用于编程式导航
  const navigate = useNavigate();

  // 渲染侧边栏底部用户信息区域
  const renderUserProfile = () => (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space>
        <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" icon={<UserOutlined />} />
        <Text strong style={{ fontSize: 14 }}>
          国泰海通-张三
        </Text>
      </Space>
      <Button type="text" icon={<SettingOutlined />} onClick={() => navigate('/settings')} />
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 左侧侧边栏 */}
      <Sider
        width={240}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          height: '100vh',
        }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
        >
          {/* Logo 区域 */}
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 24,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            PILOTCORE
          </div>

          {/* 菜单区域 - flex: 1 撑满剩余空间 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{ borderRight: 0, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}
              items={MENU_ITEMS}
              onClick={({ key }) => navigate(key)}
            />
          </div>

          {/* 底部用户信息 */}
          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            {renderUserProfile()}
          </div>
        </div>
      </Sider>

      {/* 右侧主体区域 */}
      <Layout style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            backgroundColor: 'transparent', // 透明背景融入整体
            flexShrink: 0,
          }}
        >
          <Space size={24}>
            {/* 通知图标 */}
            <Badge count={3} offset={[2, 2]} color="#1677ff">
              <Button
                icon={<BellOutlined />}
                shape="circle"
                style={{
                  border: 'none',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              />
            </Badge>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: '0 24px 24px',
            flex: 1,
            overflowY: 'auto', // 内容超出滚动
            backgroundColor: '#fff',
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
