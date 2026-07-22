import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
// import cdn from 'vite-plugin-cdn-import'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 暂时注释 CDN 抽离配置，因为内网环境暂不支持
    /*
    cdn({
      modules: [
        {
          name: 'react',
          var: 'React',
          path: `https://unpkg.com/react@19.2.4/umd/react.production.min.js`,
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: `https://unpkg.com/react-dom@19.2.4/umd/react-dom.production.min.js`,
        },
        {
          name: 'dayjs',
          var: 'dayjs',
          path: `https://unpkg.com/dayjs@1.11.10/dayjs.min.js`,
        },
        {
          name: 'antd',
          var: 'antd',
          path: `https://unpkg.com/antd@6.3.3/dist/antd.min.js`,
        }
      ]
    }),
    */
    babel({ presets: [reactCompilerPreset()] }),
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 生产环境打包配置
  build: {
    // 消除打包大小超过 500kb 警告
    chunkSizeWarningLimit: 2000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    rollupOptions: {
      output: {
        // 静态资源分类打包
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 手动分包策略
        manualChunks(id) {
          // 1. 将 react 核心全家桶打包到一起
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // 2. 将 echarts 单独打包 (体积较大)
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) {
            return 'vendor-echarts';
          }
          // 3. 将 antd 和图标单独打包
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) {
            return 'vendor-antd';
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  // Vitest 测试配置
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.ts', 'dist/'],
    },
  },
})
