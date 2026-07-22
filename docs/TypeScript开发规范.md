# TypeScript 开发规范

本文档旨在统一团队内 TypeScript 的使用方式，提升代码的健壮性和可维护性，减少运行时错误。

## 1. 基础规范

### 1.1 命名规范
- **接口 (Interface) 和 类型别名 (Type Alias)**：
  - 使用 **PascalCase (大驼峰)** 命名。
  - 不要使用 `I` 或 `T` 作为前缀（如 `interface IUser` ❌，应为 `interface User` ✅）。
- **枚举 (Enum)**：
  - 使用 **PascalCase** 命名枚举及其成员。
  - 推荐使用字符串枚举以提高调试时的可读性。

```typescript
// ✅ 推荐做法
enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER',
}
```

### 1.2 `interface` vs `type`
- **优先使用 `interface`**：在定义对象或组件 Props 的形状时，默认使用 `interface`。
- **使用 `type` 的场景**：当需要使用联合类型 (Union Types)、交叉类型 (Intersection Types) 或映射类型 (Mapped Types) 等高级特性时，才使用 `type`。

```typescript
// ✅ 推荐做法
interface User {
  id: string;
  name: string;
}

type ID = string | number; // 联合类型必须用 type
```

## 2. 组件与 Props 规范

### 2.1 Props 定义
- **必须为每个组件定义 Props 接口**：命名约定为 `[ComponentName]Props`。
- **明确可选属性**：使用 `?` 标记可选属性，并为其提供合理的默认值。
- **避免内联类型定义**：不要在函数签名中直接写出庞大的类型对象。

```tsx
// ✅ 推荐做法
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // 明确可选
}

export const Button: React.FC<ButtonProps> = (props) => {
  const { label, onClick, disabled = false } = props;
  // ...
};
```

### 2.2 事件处理类型
- 优先使用 React 内置的事件类型（如 `React.MouseEvent<HTMLButtonElement>`、`React.ChangeEvent<HTMLInputElement>`），避免使用 `any`。

```tsx
// ✅ 推荐做法
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};
```

## 3. 函数与变量规范

### 3.1 函数返回类型
- **推荐显式声明函数的返回类型**：虽然 TS 具有强大的类型推导能力，但在定义公共函数、API 接口函数或复杂业务逻辑时，显式声明返回类型有助于提早发现错误并提高代码可读性。

```typescript
// ✅ 推荐做法
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

### 3.2 变量类型推导
- **让 TS 自动推导简单类型**：对于初始化时就明确赋值的简单变量，不要显式声明类型。

```typescript
// ❌ 不推荐
const age: number = 25;
const name: string = 'Alice';

// ✅ 推荐做法 (自动推导)
const age = 25;
const name = 'Alice';
```

## 4. 高级类型与断言

### 4.1 类型断言
- **尽量避免使用类型断言 (`as Type` 或 `<Type>`)**。
- 如果必须使用，说明 TS 编译器无法推断出正确的类型。请先考虑是否可以通过更好的类型定义或类型守卫来解决。

### 4.2 工具类型 (Utility Types)
- 熟练掌握并使用 TS 内置的工具类型，如 `Partial<T>`, `Required<T>`, `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>`。
- 这有助于减少重复代码，保持类型定义的 DRY 原则。

```typescript
// ✅ 推荐做法
interface User {
  id: string;
  name: string;
  email: string;
}

// 只更新部分用户信息
type UpdateUserDto = Partial<Omit<User, 'id'>>;
```

## 5. API 请求类型规范

- **统一的响应体接口**：在封装请求库时，定义统一的响应体泛型接口 (如 `ApiResponse<T>`)。
- **为所有 API 接口定义请求和返回类型**：在 `src/api/` 目录下，每个接口必须明确入参和出参的类型。
