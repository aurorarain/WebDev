import axios from 'axios';
import { ApiResponse, PredictResponse, RealtimeFaceResponse } from '../types/emotion';

/* 使用相对路径，让 Nginx 反向代理统一处理 API 转发 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* 请求拦截器：添加JWT token */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* 响应拦截器：仅对需要认证的管理接口跳转，公开 API 不触发跳转 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      const url = error.config?.url || '';
      const publicEndpoints = ['/predict', '/health', '/projects', '/blog', '/guestbook', '/site'];
      const isPublicApi = publicEndpoints.some(ep => url.includes(ep));
      if (!isPublicApi) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const emotionApi = {
  /**
   * 健康检查
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; modelLoaded: boolean }>> {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * 通过文件上传预测情绪
   */
  async predictByFile(file: File): Promise<ApiResponse<PredictResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<PredictResponse>>('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * 通过 Base64 预测情绪 (摄像头)
   */
  async predictByBase64(base64Image: string): Promise<ApiResponse<PredictResponse>> {
    const response = await api.post<ApiResponse<PredictResponse>>('/predict', {
      image: base64Image
    });

    return response.data;
  },

  /**
   * 实时多人脸识别 (轻量版, 高频调用)
   */
  async predictRealtime(base64Image: string): Promise<ApiResponse<RealtimeFaceResponse>> {
    const response = await api.post<ApiResponse<RealtimeFaceResponse>>('/predict-realtime', {
      image: base64Image
    });

    return response.data;
  },
};
