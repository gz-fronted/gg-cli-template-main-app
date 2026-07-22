import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from './404';
import { BrowserRouter } from 'react-router-dom';

describe('NotFound (404) 页面组件', () => {
  it('应当正确渲染 404 状态码和提示信息', () => {
    // Arrange: 渲染组件 (需要包裹在 Router 中因为内部使用了 useNavigate)
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Assert: 验证页面中是否出现了 404 和相关提示文字
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('抱歉，您访问的页面不存在。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回首页' })).toBeInTheDocument();
  });
});
