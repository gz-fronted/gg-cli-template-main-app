import { Card, Row, Col } from 'antd';
import Chart from '@/components/Chart';
import type { EChartsOption } from 'echarts';

export default function Dashboard() {
  // 柱状图配置
  const barOption: EChartsOption = {
    title: { text: '周访问量' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'bar',
        itemStyle: { color: '#1677ff' },
      },
    ],
  };

  // 饼图配置
  const pieOption: EChartsOption = {
    title: { text: '用户来源' },
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        data: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
          { value: 484, name: 'Union Ads' },
          { value: 300, name: 'Video Ads' },
        ],
      },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板 (Dashboard)</h2>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card styles={{ body: { height: 400, padding: 0 } }}>
            <Chart option={barOption} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card styles={{ body: { height: 400, padding: 0 } }}>
            <Chart option={pieOption} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
