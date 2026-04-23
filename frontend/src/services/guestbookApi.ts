import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// 管理员请求需要带 token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const guestbookApi = {
  /* 获取已审核的留言列表 */
  getMessages: (page = 0, size = 20) =>
    api.get('/guestbook', { params: { page, size } }),
  /* 提交新留言 */
  submitMessage: (data: { name: string; email?: string; message: string }) =>
    api.post('/guestbook', data),
  /* 管理员：获取所有留言 */
  getAllMessages: (page = 0, size = 20) =>
    api.get('/guestbook/admin/all', { params: { page, size }, headers: getAuthHeaders() }),
  /* 管理员：审核通过留言 */
  approveMessage: (id: number) =>
    api.put(`/guestbook/admin/${id}/approve`, null, { headers: getAuthHeaders() }),
  /* 管理员：删除留言 */
  deleteMessage: (id: number) =>
    api.delete(`/guestbook/admin/${id}`, { headers: getAuthHeaders() }),
};
