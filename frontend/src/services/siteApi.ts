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
  /* 获取项目 README（公开） */
  getProjectReadme: (slug: string) => api.get(`/projects/${slug}/readme`),

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

  /* === 动态部署 === */
  /* 加入 demo（启动或复用进程） */
  joinProject: (id: number, viewerId: string) =>
    api.post(`/projects/${id}/join`, { viewerId }),
  /* 离开 demo（最后一个离开则关闭） */
  leaveProject: (id: number, viewerId: string) =>
    api.post(`/projects/${id}/leave`, { viewerId }),
  /* 获取项目运行状态（同时作为心跳） */
  getProjectStatus: (id: number) => api.get(`/projects/${id}/status`),
  /* 从 GitHub 拉取项目（管理员） */
  cloneProject: (id: number, githubUrl: string, branch?: string) =>
    api.post(`/projects/${id}/clone`, { githubUrl, branch: branch || '' }, { headers: getAuthHeaders() }),

  /* === 图片上传 === */
  /* 上传图片（管理员） */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
  },
  /* 清理孤立图片（管理员） */
  cleanupImages: (content: string) =>
    api.post('/upload/cleanup-images', { content }, { headers: getAuthHeaders() }),
};
