# Operations Template (运营后台模版)

基于 React 19 + TypeScript + Vite 8 + Ant Design 6 的现代化后台管理系统模版。
本模版专为快速构建企业级中后台应用而设计，集成了最佳实践的工程化配置、清晰的架构分层和美观的 UI 设计。

## ✨ 特性与架构

- **最新技术栈**: 采用 React 19、Vite 8、TypeScript 5 等前沿技术。
- **UI 设计**: 集成 Ant Design 6，配合 Less 预处理器，深度还原企业级设计规范。
- **状态管理**: 使用 Zustand 5 进行轻量级全局状态管理，告别繁琐的 Redux 样板代码。
- **路由管理**: 基于 React Router 7.x 的 Data API 路由模式，支持更细粒度的路由控制。
- **网络请求**: 封装 Axios 1.x，统一处理拦截器、错误码和 TypeScript 类型定义。
- **工程化与规范**: 配置 ESLint 9 (逻辑检查) 与 Prettier (代码格式化)，并集成 EditorConfig 统一跨编辑器基础风格。
- **多环境支持**: 完善的 `.env` 环境隔离机制，清晰区分开发 (dev)、测试 (test) 和生产 (prod) 环境。
- **生产构建优化**: 内置产物分类、第三方依赖 (Vendor) 手动分包策略、自动剔除 Console 等生产级优化。

## 📦 目录结构

```bash
src/
├── api/                # API 接口定义层 (按业务领域集中管理，如 user.ts, task.ts)
├── assets/             # 静态资源文件 (图片、图标等)
├── components/         # 全局公共组件库 (跨页面复用，如 Chart, ErrorBoundary)
├── hooks/              # 全局自定义 Hooks (通用逻辑抽象，如 user.ts、permission.ts)
├── layouts/            # 布局组件
│   └── BasicLayout.tsx # 基础布局 (侧边栏 + 顶栏 + 内容区)
├── pages/              # 页面组件 (Feature-based 高内聚架构)
│   ├── home/           # 首页模块
│   │   ├── components/ # 页面级专属组件 (就近原则)
│   │   ├── hooks.ts    # 页面级专属逻辑 (就近原则)
│   │   ├── store.ts    # 页面级专属状态 (就近原则)
│   │   └── index.tsx   # 首页入口
│   ├── dashboard/      # 数据看板 (ECharts 示例)
│   └── about/          # 关于页面
├── router/             # 路由配置
│   └── index.tsx       # 路由表定义
├── store/              # 全局状态管理 (Zustand - 仅存 Auth/App 等跨页面级状态)
│   └── user.ts         # 例：user.ts、permission.ts
├── utils/              # 全局工具函数及基础设施
│   └── request/        # 例：Axios 二次封装
├── main.tsx            # 应用入口
├── App.tsx             # 根组件
└── vite-env.d.ts       # Vite 环境变量类型声明
```

## 🚀 快速上手

### 1. 环境准备

确保您的本地环境已安装 Node.js (推荐 v18+)。

### 2. 安装依赖

```bash
npm install
# 或者
yarn
# 或者
pnpm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:5173` 即可看到效果。

### 3. 构建生产环境

```bash
# 构建测试环境
npm run build:test

# 构建生产环境
npm run build:prod
# 或
npm run build
```

## 🛠 开发与构建指南

### 1. 环境变量配置

项目根目录包含三个环境配置文件，利用 Vite 的 `import.meta.env` 进行读取，且内置了完整的 TypeScript 类型提示：
- `.env.development`：本地开发环境 (运行 `npm run dev` 时加载)
- `.env.test`：测试环境 (运行 `npm run build:test` 时加载)
- `.env.production`：生产环境 (运行 `npm run build:prod` 时加载)

> 💡 **注意**：在代码中可以通过 `import.meta.env.VITE_XXX` 访问环境变量。为了安全，所有暴露给前端的自定义环境变量必须以 `VITE_` 开头。

### 2. 代码检查与格式化

```bash
# 运行 ESLint 逻辑检查
npm run lint

# 运行 Prettier 格式化代码 (将会自动格式化 src 目录下的文件)
npm run format
```

### 3. 生产环境构建与优化

本项目针对生产环境 (`build:prod`) 做了深度优化，确保上线的资源体积最小、加载最快：
- **静态资源 Hash 分类**：JS、CSS、图片等资源分别打包到不同的文件夹，并打上 Hash 戳，完美配合服务器的强缓存策略。
- **手动分包 (Manual Chunks)**：将体积巨大且变动极少的第三方依赖（如 `react` 核心库、`antd` 组件库、`echarts` 图表库）单独拆分。这样即便你修改了业务代码，用户依然能命中第三方库的浏览器缓存。
- **代码净化**：自动剔除代码中的 `console` 和 `debugger` 语句，提升性能并保护代码安全。

### 4. 构建产物分析 (打包体积分析)

如果你想了解每个包（Chunk）的体积大小，排查是否引入了臃肿的依赖，可以运行分析脚本：

```bash
npm run analyze
```
该命令会自动执行生产环境构建，并在打包结束后，于浏览器中弹出一个 **交互式的可视化树状图** (`dist/stats.html`)，让你对所有产物的原始大小和 Gzip 压缩大小一目了然。

---

## 💻 业务开发指南

### 1. 新增页面

1. 在 `src/pages` 下新建文件夹，例如 `src/pages/product`。
2. 创建 `index.tsx` 并导出默认组件。
3. 在 `src/router/index.tsx` 中配置路由规则。

### 2. 样式开发

项目支持 **Less** 预处理器。
- **全局样式**: 修改 `src/index.css` 或配置 `src/main.tsx` 中的 Ant Design Token。
- **组件样式**: 推荐使用 `.less` 文件，并在组件中引入。
  ```less
  // src/pages/home/index.less
  .home-page {
    padding: 20px;
  }
  ```

### 3. 网络请求

使用 `src/utils/request` 中导出的 `request` 实例。

```typescript
import { request } from '@/utils/request';

// 定义响应类型
interface UserInfo {
  id: number;
  name: string;
}

// 发起请求
const getUser = () => {
  return request.get<UserInfo>('/api/user/1');
};
```

### 4. 状态管理 (Zustand)

```typescript
import { create } from 'zustand';

interface UserState {
  name: string;
  setName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: 'Guest',
  setName: (name) => set({ name }),
}));

// 在组件中使用
const { name, setName } = useUserStore();
```

## 🎨 设计规范

- **主色调**: `#4F46E5` (Indigo)
- **圆角**: 全局组件圆角 `8px`，卡片圆角 `12px`
- **布局**: 左侧固定侧边栏 (`240px`) + 顶部通栏
- **图标**: 使用 `@ant-design/icons`

---
