# 主应用模板自测与验收（2026-11-17）

结论：本次通用功能场景通过；不是完整业务子应用的内存无泄漏认证。

## 环境与范围

- npm 10.9.8、Node 22.22.3；使用 CLI 生成的临时项目真实安装依赖，legacy-peer-deps=true。
- 测试依赖为生成项目自身 node_modules；17 项单测通过，ESLint 通过，tsc -b 与生产构建通过。
- 浏览器运行生产 dist，Garfish 为实际依赖实现。仅临时项目将应用注册列表替换为 12 个本地验收应用；夹具在 scripts/acceptance/。
- 入口：http://127.0.0.1:4178；模拟登录，无生产账户或真实后端。

## 发现并修复

1. MicroAppHost effect 内嵌套 useEffect，违反 Hooks 规则，实际挂载可能报 Invalid hook call。删除内层重复 Hook，保留组件顶层路由同步 effect；新增真实 Host 测试（旧标签测试 mock Host，未覆盖该缺陷）。
2. 登录回跳只保存 pathname，丢失 query/hash。拼接完整地址；浏览器从 /qa0/detail?id=7#section 登录后完整恢复。
3. 加载与清理同时失败被包装为通用错误，界面错误地提供重试。改成 RefreshRequiredError；阻断 fixture.js 后显示刷新主应用，解除阻断并点击刷新后恢复成功。

## 已通过的场景

| 场景 | 证据 |
| --- | --- |
| 登录回跳完整 URL | 子应用 output=/detail?id=7#section |
| 标签切换保活 | qa0 输入保留；打开 qa1 后返回，mount=2、destroy=0 |
| HostBridge 导航和 query 清除 | /detail?id=8 → /detail，地址栏与子应用一致 |
| 12 个标签、10 个保活 | panels=10、tabs=12、mount=12、destroy=2、listeners=10 |
| LRU 淘汰后恢复 | qa0 重新 mount，route=/detail，表单输入重置；mount=13、destroy=3 |
| 子应用退出登录 | 跳转 /login；mount=13、destroy=13、listeners=0、panels=0 |
| 重新登录后 30 次开关 | 最终 mount=43、destroy=43、listeners=0、panels=0 |
| 资源阻断与恢复 | 错误提示刷新；解除阻断后刷新重新 mount 成功 |
| 超时、晚到/取消、失败容量、旧 cleanup | 自动测试覆盖；未逐个进行浏览器故障注入 |

## 内存样本与边界

原始数据见 2026-11-17-heap-samples.json，使用 CDP 强制 GC 后采样。

| 循环次数 | JS usedSize 字节 | embedderHeapUsedSize 字节 |
| --- | --- | --- |
| 5 | 30136360 | 7555464 |
| 15 | 30645316 | 8358480 |
| 30 | 30763392 | 9994688 |

JS 堆增长趋缓，但嵌入对象堆仍增长；未做 heap snapshot 保留链分析，不能断言零泄漏。浏览器存在扩展，夹具为轻量 DOM provider，不能替代真实 React/Ant Design 子应用验证。dynamicCSS 补丁按用户要求未加入。

## 未覆盖及非阻断提示

- 真实业务子应用、跨域/iframe、真实登录与 401 服务端链路、完整主题/遮罩协议未做端到端验收。
- Vite __dirname 配置未来兼容警告，主包超过 2000 kB 提示仍存在；构建成功。
- 未新增未保存保护；LRU 卸载后内存态丢失符合本轮与 gz-zd-web 对齐的策略。
