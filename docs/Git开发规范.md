# Git 开发规范

为了保证团队协作的高效性、代码历史的可追溯性以及发布流程的稳定性，特制定本 Git 开发规范。团队成员需严格遵守本规范进行代码的分支管理和提交。

## 1. 分支管理模型

我们采用基于 Git Flow 思想的轻量级分支管理模型。

### 1.1 长期分支
- **`main` (或 `master`)**: 主分支。
  - 只能包含稳定、已发布或即将发布到生产环境的代码。
  - **严禁直接在 `main` 分支上进行开发提交**。
  - 所有合并到 `main` 的代码必须经过 Code Review 和充分测试。
- **`develop`**: 开发主分支。
  - 包含下一个版本将要发布的所有最新代码。
  - 从 `main` 分支拉取，功能分支合并回此分支。
  - 部署到**开发/测试环境**的基础分支。

### 1.2 临时分支
临时分支用完即删，保持分支列表整洁。

- **`feature/*` (功能分支)**:
  - 命名规范：`feature/功能名称` 或 `feature/需求ID-功能名称` (如：`feature/login-page`, `feature/JIRA-123-user-profile`)。
  - 从 `develop` 分支拉取。
  - 开发完成后合并回 `develop` 分支。
- **`bugfix/*` (缺陷修复分支)**:
  - 命名规范：`bugfix/问题描述` 或 `bugfix/缺陷ID-问题描述` (如：`bugfix/login-crash`, `bugfix/JIRA-456-table-render-error`)。
  - 用于修复日常测试中发现的非紧急 Bug。
  - 从 `develop` 分支拉取，修复后合并回 `develop`。
- **`hotfix/*` (线上紧急修复分支)**:
  - 命名规范：`hotfix/问题描述` 或 `hotfix/缺陷ID` (如：`hotfix/payment-failure`)。
  - **仅用于修复生产环境的严重 Bug**。
  - 必须从 `main` 分支拉取！
  - 修复测试通过后，**必须同时合并回 `main` 和 `develop` 分支**，并在 `main` 上打上新版本 Tag。

## 2. Commit 提交规范

我们遵循 [Angular Commit 规范](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)，使用标准化的格式来记录每一次提交，以便自动生成 Changelog 并快速定位问题。

### 2.1 Commit Message 格式
```text
<type>(<scope>): <subject>
// 空一行
<body>
// 空一行
<footer>
```

### 2.2 Type (必填)
说明本次提交的类型，只允许使用以下标识：
- `feat`: 新增功能 (Feature)
- `fix`: 修复 Bug
- `docs`: 仅修改文档 (Documentation)
- `style`: 仅仅修改了空格、格式缩进、逗号等等，不改变代码逻辑 (不涉及逻辑的格式修改)
- `refactor`: 代码重构，没有加新功能或者修复 bug
- `perf`: 优化相关，比如提升性能、体验
- `test`: 增加测试，包括单元测试、集成测试等
- `build`: 影响构建系统或外部依赖的更改（如：webpack, npm）
- `ci`: 对 CI 配置文件和脚本的更改
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回滚到上一个版本

### 2.3 Scope (选填)
用于说明本次 Commit 影响的范围，比如数据层、控制层、视图层等等，视项目不同而不同。例如在前端项目中，可以是具体的页面或组件名：`auth`, `table-component`, `router` 等。

### 2.4 Subject (必填)
本次提交的简短描述，不超过 50 个字符。
- 以动词开头，使用第一人称现在时，比如 `change`，而不是 `changed` 或 `changes`。
- 首字母小写。
- 结尾不加句号 (`.`)。

### 2.5 Body (选填)
对本次提交的详细描述，可以分成多行。说明代码变更的动机，以及与之前行为的对比。

### 2.6 Footer (选填)
- **不兼容变动 (Breaking Changes)**：如果当前代码与上一个版本不兼容，则 Footer 部分以 `BREAKING CHANGE:` 开头，后面是对变动的描述、以及变动理由和迁移方法。
- **关闭 Issue/缺陷**：如果当前 commit 针对某个 issue/需求，那么可以在 Footer 部分关闭这个 issue。如：`Closes #123`, `Fixes JIRA-456`。

### 2.7 Commit 示例
```text
feat(user): 新增用户登录页面的记住密码功能

增加了本地 storage 的存储逻辑，在用户勾选记住密码时，加密保存 token。

Closes #89
```

```text
fix(table): 修复数据为空时分页器仍然显示的问题
```

## 3. 工作流与 Code Review 规范

1. **同步最新代码**：每天开发前，或在拉取新分支前，务必先 `git pull --rebase origin develop`，确保基于最新代码开发。
2. **小步提交**：鼓励频繁提交本地代码（遵循 Commit 规范），避免将几天的巨大工作量堆积在一次 Commit 中。
3. **合并前 Rebase**：在将功能分支合并回 `develop` 之前，如果 `develop` 已经有了新的提交，建议在自己的分支上先执行 `git rebase develop`，解决冲突后再发起 Merge Request / Pull Request。这有助于保持线性的提交历史。
4. **Code Review (CR)**：
   - 合并代码到 `develop` 或 `main` 必须通过发起 PR/MR 的方式，**禁止直接 Push**。
   - 至少需要一位其他开发人员 Review 通过 (Approve) 后才能合并。
   - CR 重点关注：代码是否符合规范、是否有潜在 Bug、性能是否达标、是否包含敏感信息（如明文密码、密钥）。

## 4. 辅助工具推荐
强烈建议在项目中集成以下工具以保证规范的落地：
- **`husky` + `lint-staged`**：在提交前自动进行 ESLint / Prettier 检查。
- **`commitlint` + `commitizen`**：在 `git commit` 时强制校验 Commit Message 是否符合规范。
