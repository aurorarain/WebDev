/**
 * 站点 & 项目 API — 项目展示、动态部署、图片上传等
 * 使用统一的 apiClient，JWT token 由拦截器自动附加
 */
import apiClient from './apiClient';

export const siteApi = {
  /* 获取站点配置 */
  getSiteConfig: () => apiClient.get('/site'),

  /* 获取关于页面数据（合并数据库管理员信息） */
  getAboutData: () => apiClient.get('/site/about'),

  /* 获取项目列表（公开） */
  getProjects: () => apiClient.get('/projects'),

  /* 获取单个项目详情（公开） */
  getProject: (slug: string) => apiClient.get(`/projects/${slug}`),

  /* 获取项目 README（公开） */
  getProjectReadme: (slug: string) => apiClient.get(`/projects/${slug}/readme`),

  /* === 管理员项目操作 === */
  /* 创建项目 */
  createProject: (data: any) =>
    apiClient.post('/projects', data),

  /* 更新项目 */
  updateProject: (id: number, data: any) =>
    apiClient.put(`/projects/${id}`, data),

  /* 删除项目 */
  deleteProject: (id: number) =>
    apiClient.delete(`/projects/${id}`),

  /* === 动态部署 === */
  /* 加入 demo（启动或复用进程） */
  joinProject: (id: number, viewerId: string) =>
    apiClient.post(`/projects/${id}/join`, { viewerId }),

  /* 离开 demo（最后一个离开则关闭） */
  leaveProject: (id: number, viewerId: string) =>
    apiClient.post(`/projects/${id}/leave`, { viewerId }),

  /* 获取项目运行状态（同时作为心跳） */
  getProjectStatus: (id: number) => apiClient.get(`/projects/${id}/status`),

  /* 从 GitHub 拉取项目（管理员） */
  cloneProject: (id: number, githubUrl: string, branch?: string) =>
    apiClient.post(`/projects/${id}/clone`, { githubUrl, branch: branch || '' }),

  /* === 图片上传 === */
  /* 上传图片（管理员） */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /* 清理孤立图片（管理员） */
  cleanupImages: (content: string) =>
    apiClient.post('/upload/cleanup-images', { content }),
};
