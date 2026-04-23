import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

/* 管理员请求需要带 token */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const siteApi = {
  /* 获取站点配置 */
  getSiteConfig: () => api.get('/site'),
  /* 获取关于页面数据（合并数据库管理员信息） */
  getAboutData: () => api.get('/site/about'),
  /* 获取项目列表（公开） */
  getProjects: () => api.get('/projects'),
  /* 获取单个项目详情（公开） */
  getProject: (slug: string) => api.get(`/projects/${slug}`),

  /* === 管理员项目操作 === */
  /* 创建项目 */
  createProject: (data: any) =>
    api.post('/projects', data, { headers: getAuthHeaders() }),
  /* 更新项目 */
  updateProject: (id: number, data: any) =>
    api.put(`/projects/${id}`, data, { headers: getAuthHeaders() }),
  /* 删除项目 */
  deleteProject: (id: number) =>
    api.delete(`/projects/${id}`, { headers: getAuthHeaders() }),
};
