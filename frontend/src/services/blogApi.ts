/**
 * 博客 API — 博客文章的增删改查
 * 使用统一的 apiClient，JWT token 由拦截器自动附加
 */
import apiClient from './apiClient';

export const blogApi = {
  /* 获取已发布的博文列表（公开） */
  getPublishedPosts: (page = 0, size = 10) =>
    apiClient.get('/blog', { params: { page, size } }),

  /* 获取单篇博文详情（公开） */
  getPost: (slug: string) =>
    apiClient.get(`/blog/${slug}`),

  /* 管理员：获取所有博文（含草稿） */
  getAllPosts: (page = 0, size = 20) =>
    apiClient.get('/blog/admin/all', { params: { page, size } }),

  /* 管理员：创建博文 */
  createPost: (data: any) =>
    apiClient.post('/blog', data),

  /* 管理员：更新博文 */
  updatePost: (id: number, data: any) =>
    apiClient.put(`/blog/${id}`, data),

  /* 管理员：删除博文 */
  deletePost: (id: number) =>
    apiClient.delete(`/blog/${id}`),
};
