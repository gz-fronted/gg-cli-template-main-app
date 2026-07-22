# React 开发规范

本文档规定了团队内 React 项目的开发规范和最佳实践，旨在提高代码的可读性、可维护性和团队协作效率。

## 1. 组件开发规范

### 1.1 组件定义
- **统一使用函数组件 (Function Component)**：放弃 Class 组件，全面拥抱 React Hooks。
- **使用 `React.FC` 定义类型**：结合 TypeScript，明确组件类型。
- **使用 `Props`**：不直接在函数参数处解构 props，而是通过解构赋值在函数内部获取 props。

```tsx
// ✅ 推荐做法
import React from 'react';

interface UserCardProps {
  name: string;
  age?: number;
}

export const UserCard: React.FC<UserCardProps> = (props) => {
  const { name, age = 18 } = props;

  return (
    <div>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
    </div>
  );
};
```

### 1.2 命名规范
- **组件文件命名**：使用 **PascalCase (大驼峰)** 命名（如 `UserProfile.tsx`）。如果组件是一个目录，使用 **pascal-case（kebab-case）**，入口文件使用 `index.tsx`。
- **组件内部变量/函数命名**：使用 **camelCase (小驼峰)** 命名。
- **事件处理函数命名**：
  - 传递给组件的 props 命名为 `onXxx`（如 `onClick`）。
  - 组件内部的处理函数命名为 `handleXxx`（如 `handleClick`）。

### 1.3 组件结构与拆分
- **单一职责原则**：一个组件只做一件事情。如果组件逻辑变得复杂，应拆分为更小的子组件。
- **UI 与逻辑分离**：尽量保持 UI 组件 (Presentational Component) 的纯粹性，将复杂的业务逻辑、数据获取抽离到自定义 Hook 或容器组件 (Container Component) 中。

## 2. Hooks 使用规范

### 2.1 基础 Hooks
- **`useState`**：用于管理组件内部的简单状态。对于复杂状态，考虑使用 `useReducer` 或全局状态管理库 (如 Zustand)。
- **`useEffect`**：
  - 必须明确声明依赖数组 (Dependency Array)。
  - 避免在 `useEffect` 中执行过多不相关的逻辑，按功能拆分为多个 `useEffect`。
  - 注意清理副作用 (如定时器、事件监听器)。

### 2.2 性能优化 Hooks
- **谨慎使用 `useMemo` 和 `useCallback`**：仅在遇到真正的性能瓶颈或需要传递稳定的引用给子组件时使用。过度使用会增加内存开销。
- 由于项目引入了 React Compiler (React 19)，编译器会自动进行大部分的 Memoization 优化，手动使用这些 Hook 的场景将大幅减少。

### 2.3 自定义 Hooks
- **命名规范**：必须以 `use` 开头（如 `useFetchUser`）。
- **返回值**：通常返回一个数组 `[value, setValue]` 或一个对象 `{ data, loading, error }`，根据实际场景决定。

## 3. 状态管理规范

- **局部状态**：优先使用组件内部的 `useState` 或 `useReducer`。
- **全局状态**：使用 Zustand 5 进行轻量级的全局状态管理。
  - 按业务模块划分 Store (如 `useUserStore`, `useAppStore`)。
  - 避免将所有状态都放入全局 Store，只共享真正需要跨组件通信的状态。

## 4. 样式开发规范

- **预处理器**：统一使用 Less。
- **样式隔离**：
  - 优先使用 CSS Modules (命名为 `xxx.module.less`)，避免全局样式污染。
  - 配合 classnames 库进行类名的条件拼接。
- **命名约定**：Less 文件中的类名使用 **kebab-case (短横线命名法)**，如 `.user-profile-container`。

## 5. 代码质量与格式化

- 必须遵守项目配置的 ESLint 和 Prettier 规则。
- 在提交代码前，确保没有 ESLint 警告或错误。
- 避免使用 `any`，尽可能提供准确的 TypeScript 类型定义。
- 不要保留未使用的变量或导入 (`no-unused-vars`)。
