/**
 * 统一 API 客户端 — 所有 API 服务共享同一个 axios 实例
 * 通过请求拦截器自动附加 JWT token，避免手动 getAuthHeaders() 遗漏
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/* 请求拦截器：自动从 localStorage 读取 JWT token 并附加到请求头 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* 响应拦截器：401 时清理登录态并跳转（仅限已登录状态下的管理接口） */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      const url = error.config?.url || '';
      /* 公开 API 不触发登出跳转 */
      const publicPrefixes = ['/predict', '/health', '/projects', '/blog', '/guestbook', '/site'];
      const isPublicApi = publicPrefixes.some(ep => url.includes(ep));
      if (!isPublicApi) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
