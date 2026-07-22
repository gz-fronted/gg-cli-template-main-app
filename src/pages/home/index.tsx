import { Input, Tag, Card, Row, Col, List, Button, Typography, Space } from 'antd';
import {
  ArrowUpOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  WalletOutlined,
  DatabaseOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import './index.less';

const { Title, Text } = Typography;

// --- Components ---

/**
 * 欢迎语组件 (WelcomeHeader)
 * 展示用户个性化问候语和任务概览
 */
const WelcomeHeader = () => (
  <div className="welcome-header">
    <Title level={2}>下午好，你有3件待办任务...</Title>
  </div>
);

/**
 * 搜索区域组件 (SearchSection)
 * 包含搜索框和快捷操作标签 (Tag)
 * 样式位于 ./index.less
 */
const SearchSection = () => (
  <div className="search-section">
    {/* 搜索输入框 */}
    <div className="search-box">
      <PaperClipOutlined className="search-icon" />
      <Input
        variant="borderless"
        placeholder="输入您想查询的数据、指令或功能，例如：帮我分析一下NVDA的最新财报..."
        className="search-input"
      />
      <Button type="primary" shape="circle" icon={<ArrowUpOutlined />} className="search-btn" />
    </div>

    {/* 快捷标签 */}
    <div className="search-tags">
      <Tag className="tag-item">分析财报</Tag>
      <Tag className="tag-item">查询头寸</Tag>
      <Tag className="tag-item">压力测试</Tag>
    </div>
  </div>
);

/**
 * 常用功能组件 (QuickActions)
 * 使用 Grid 布局展示应用的核心功能入口
 * 每个卡片包含：图标、标题和背景色
 */
const QuickActions = () => {
  // 功能入口配置数据
  const actions = [
    {
      title: '工作空间',
      icon: <AppstoreOutlined style={{ fontSize: 24, color: '#4F46E5' }} />,
      color: '#EEF2FF',
    },
    {
      title: '规则配置',
      icon: <SettingOutlined style={{ fontSize: 24, color: '#0EA5E9' }} />,
      color: '#F0F9FF',
    },
    {
      title: '事后风控',
      icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#F59E0B' }} />,
      color: '#FFFBEB',
    },
    {
      title: '交易审批',
      icon: <AuditOutlined style={{ fontSize: 24, color: '#10B981' }} />,
      color: '#ECFDF5',
    },
    {
      title: '证券池管理',
      icon: <WalletOutlined style={{ fontSize: 24, color: '#3B82F6' }} />,
      color: '#EFF6FF',
    },
    {
      title: '数据审批',
      icon: <DatabaseOutlined style={{ fontSize: 24, color: '#06B6D4' }} />,
      color: '#ECFEFF',
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto 48px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          padding: '0 8px',
        }}
      >
        <Text type="secondary">常用功能</Text>
        <Button type="link" size="small" style={{ color: '#999' }}>
          更多
        </Button>
      </div>
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col span={4} key={action.title}>
            <Card
              hoverable
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {action.icon}
              </div>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{action.title}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};


// --- Main Page ---

export default function Home() {
  return (
    <div className="home-page">
      <WelcomeHeader />
      <SearchSection />
      <QuickActions />
    </div>
  );
}
