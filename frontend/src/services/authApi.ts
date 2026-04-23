import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加JWT token
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

// 响应拦截器：处理token过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (username: string, password: string, email: string) =>
    api.post('/api/auth/register', { username, password, email }),
  
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  
  getCurrentUser: () =>
    api.get('/api/auth/me'),
};

export const historyApi = {
  getMyHistory: (page: number = 0, size: number = 10) =>
    api.get(`/api/history/my?page=${page}&size=${size}`),
  
  getMyHistoryByEmotion: (emotion: string, page: number = 0, size: number = 10) =>
    api.get(`/api/history/my/filter?emotion=${emotion}&page=${page}&size=${size}`),
  
  getMyHistoryByDateRange: (startDate: string, endDate: string) =>
    api.get(`/api/history/my/date-range?startDate=${startDate}&endDate=${endDate}`),
  
  getMyStatistics: () =>
    api.get('/api/history/my/statistics'),
  
  deleteMyHistory: (id: number) =>
    api.delete(`/api/history/my/${id}`),
};

export const userApi = {
  getProfile: () =>
    api.get('/api/users/profile'),

  updateProfile: (data: { email?: string; bio?: string; avatarUrl?: string }) =>
    api.put('/api/users/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/api/users/change-password', null, {
      params: { oldPassword, newPassword }
    }),

  deleteAccount: () =>
    api.delete('/api/users/delete-me'),
};

export default api;
