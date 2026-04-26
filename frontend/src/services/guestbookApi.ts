/**
 * 留言板 API — 留言的提交、查询、管理
 * 使用统一的 apiClient，JWT token 由拦截器自动附加
 */
import apiClient from './apiClient';

export const guestbookApi = {
  /* 获取已审核的留言列表（公开） */
  getMessages: (page = 0, size = 20) =>
    apiClient.get('/guestbook', { params: { page, size } }),

  /* 提交新留言（公开） */
  submitMessage: (data: { name: string; email?: string; message: string }) =>
    apiClient.post('/guestbook', data),

  /* 管理员：获取所有留言（含待审核） */
  getAllMessages: (page = 0, size = 20) =>
    apiClient.get('/guestbook/admin/all', { params: { page, size } }),

  /* 管理员：审核通过留言 */
  approveMessage: (id: number) =>
    apiClient.put(`/guestbook/admin/${id}/approve`),

  /* 管理员：删除留言 */
  deleteMessage: (id: number) =>
    apiClient.delete(`/guestbook/admin/${id}`),
};
