/**
 * 通用网络请求工具 (Axios Encapsulation)
 * 封装了全局请求拦截、响应处理和错误统一处理
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { message } from 'antd';
import { useGlobalStore } from '@/store/useGlobalStore';
import { clearSessionAndNavigate } from '@/micro-apps/session';

// 定义通用的后端响应结构
export interface BaseResponse<T = unknown> {
  code: number; // 业务状态码 (0/200: 成功, 其他: 失败)
  data: T; // 业务数据
  message: string; // 提示信息
}

// 创建 Axios 实例的工厂函数
function createRequest(config: AxiosRequestConfig) {
  const instance = axios.create(config);

  // 请求拦截器
  instance.interceptors.request.use(
    (reqConfig) => {
      // 在发送请求之前，从 zustand 获取 token
      const token = useGlobalStore.getState().token;
      if (token && reqConfig.headers) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<BaseResponse>) => {
      const { data } = response;
      // 根据自定义的 code 判断请求是否成功 (假设 0 或 200 为成功)
      if (data.code === 0 || data.code === 200) {
        return data.data as any; // 拆包返回 data
      } else {
        // 处理业务错误，例如提示用户
        const errorMsg = data.message || '请求失败';
        message.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    },
    (error) => {
      // 处理 HTTP 错误，例如 401, 404, 500 等
      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 401:
            message.error('登录状态已过期，请重新登录');
            // 清除登录状态并跳转到登录页
            void clearSessionAndNavigate(() => {
              window.location.href = '/login';
            });
            break;
          case 403:
            message.error('拒绝访问');
            break;
          case 404:
            message.error('请求接口不存在');
            break;
          case 500:
            message.error('服务器内部错误');
            break;
          default:
            message.error(`网络错误: ${status}`);
        }
      } else {
        message.error('网络连接异常，请检查网络设置!');
      }
      return Promise.reject(error);
    },
  );

  // 返回封装好的请求方法对象
  return {
    /**
     * 发送 GET 请求
     * @param url 请求地址
     * @param config Axios 配置
     */
    get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      // 响应拦截器已返回业务 data；Axios 声明仍按原始响应推导。
      return instance.get(url, config) as Promise<T>;
    },
    /**
     * 发送 POST 请求
     * @param url 请求地址
     * @param data 请求体数据
     * @param config Axios 配置
     */
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
      return instance.post(url, data, config) as Promise<T>;
    },
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
      return instance.put(url, data, config) as Promise<T>;
    },
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      return instance.delete(url, config) as Promise<T>;
    },
  };
}

// 导出默认 request 实例
// 可以直接 import { request } from '@/utils/request' 使用
export const request = createRequest({
  // 从环境变量 VITE_API_BASE_URL 获取基础地址，默认为 /api
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000, // 超时时间 10s
});
