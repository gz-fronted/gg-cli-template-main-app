import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 全局错误边界组件 (Error Boundary)
 * 用于捕获 React 组件树中的渲染错误，防止整个应用白屏崩溃
 * 同时可在此处进行错误日志上报
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 以致于下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 在这里你可以将错误日志上报给服务器
    console.error('Uncaught error in React component tree:', error, errorInfo);

    // 示例：如果在生产环境，调用监控 SDK
    // if (import.meta.env.PROD) {
    //   logService.error('REACT_RENDER_ERROR', { error, errorInfo });
    // }
  }

  private handleReset = () => {
    // 重置错误状态，尝试恢复组件渲染
    this.setState({ hasError: false, error: undefined });
    // 也可以选择刷新整个页面
    // window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // 渲染自定义的降级 UI，或者使用默认的 500 页面
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="500"
          title="抱歉，页面加载出错了"
          subTitle={
            import.meta.env.DEV
              ? this.state.error?.message
              : "我们正在努力修复此问题，请稍后再试。"
          }
          extra={
            <Button type="primary" onClick={this.handleReset}>
              重试
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

    return this.props.children;
  }
}
