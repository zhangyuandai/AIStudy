/**
 * 管理后台 - Axios 请求封装
 * 统一处理：Token 注入 / 401 跳转 / 错误提示
 */
import axios from 'axios';
import { ElMessage, ElLoading } from 'element-plus';
import config from '../config/index';

// 创建实例
const request = axios.create({
  baseURL: config.apiBase,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求计数器（控制 loading）
let loadingCount = 0;
let loadingInstance = null;

function showLoading(text = '加载中...') {
  if (loadingCount === 0) {
    loadingInstance = ElLoading.service({ text, background: 'rgba(0,0,0,0.5)' });
  }
  loadingCount++;
}

function hideLoading() {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    loadingInstance?.close?.();
    loadingInstance = null;
  }
}

// 请求拦截器 - 自动注入 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
request.interceptors.response.use(
  (response) => {
    const data = response.data;
    // 后端统一格式: { code: 0, message, data }
    if (data.code === 0 || data.data !== undefined) {
      return data.data ?? data;  // 兼容两种返回格式
    }
    ElMessage.error(data.message || '请求失败');
    return Promise.reject(data);
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      ElMessage.error('登录已过期，请重新登录');
      window.location.hash = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      ElMessage.error('无权限访问此资源');
      return Promise.reject(error);
    }

    if (status === 422) {
      ElMessage.error('参数校验失败');
      return Promise.reject(error);
    }

    if (status >= 500) {
      ElMessage.error('服务器内部错误，请稍后重试');
      return Promise.reject(error);
    }

    // 网络错误
    if (!status && error.message.includes('Network')) {
      ElMessage.error('网络连接失败，请检查后端服务是否启动');
      return Promise.reject(error);
    }

    const msg = error.response?.data?.message || '请求异常';
    ElMessage.error(msg);
    return Promise.reject(error);
  }
);

export default request;

/**
 * 带 Loading 的请求方法
 */
export function requestWithLoading(config, text) {
  showLoading(text);
  return request(config).finally(() => hideLoading());
}
