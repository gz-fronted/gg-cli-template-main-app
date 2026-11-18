# 本地生产验收夹具

仅用于 CLI 生成的临时项目，不改变正式模板的应用配置。

1. 将 fixture.html、fixture.js 复制到临时项目 public/。
2. 在临时项目 bootstrap.ts 中将 microAppDefinitions 替换为：

```ts
Array.from({ length: 12 }, (_, i) => ({ name: `qa${i}`, basename: `/qa${i}`, entry: '/fixture.html' }))
```

3. 执行 npm test -- --run、npm run lint、npm run build，启动 npm run preview。
4. 访问 /qa0/detail?id=7#section，使用任意账号密码完成模拟登录，确认完整路径保留。
5. 输入“保活验证”，切换 qa1 再回 qa0；输入应保留，window.qaStats.mount 不增加。
6. 通过 g-navigate 更新/清除 query；output 与地址栏应一致。
7. 依次打开 12 个应用：标签 12、面板 10、mount=12、destroy=2、listeners=10。
8. 恢复淘汰页面：路由恢复、输入重置；退出登录后面板和 listeners 为 0，mount=destroy。
9. 重新登录，重复打开 qa0 / g-close-current-tab 30 次，确认每次释放。可通过 CDP collectGarbage + getHeapUsage 记录趋势。

qaStats 只保存计数，不保存 DOM 或实例引用。该夹具验证真实 Garfish 生命周期，但不是业务子应用、Ant Design 表单或跨域 iframe 的内存验收替代品。
