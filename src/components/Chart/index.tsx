import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

export default function Chart({ option, style, className, loading = false }: ChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%', ...style }}
      className={className}
      showLoading={loading}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}
