import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// 管理员请求需要带 token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const blogApi = {
  /* 获取已发布的博文列表 */
  getPublishedPosts: (page = 0, size = 10) =>
    api.get('/blog', { params: { page, size } }),
  /* 获取单篇博文详情 */
  getPost: (slug: string) =>
    api.get(`/blog/${slug}`),
  /* 管理员：获取所有博文 */
  getAllPosts: (page = 0, size = 20) =>
    api.get('/blog/admin/all', { params: { page, size }, headers: getAuthHeaders() }),
  /* 管理员：创建博文 */
  createPost: (data: any) =>
    api.post('/blog', data, { headers: getAuthHeaders() }),
  /* 管理员：更新博文 */
  updatePost: (id: number, data: any) =>
    api.put(`/blog/${id}`, data, { headers: getAuthHeaders() }),
  /* 管理员：删除博文 */
  deletePost: (id: number) =>
    api.delete(`/blog/${id}`, { headers: getAuthHeaders() }),
};
