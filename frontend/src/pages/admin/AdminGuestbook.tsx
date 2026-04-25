/**
 * 管理后台 — 留言板管理页
 * 展示所有留言，支持审核和删除操作
 */
import { useState, useEffect } from 'react';
import { Check, Trash2, Mail } from 'lucide-react';
import { guestbookApi } from '../../services/guestbookApi';
import { GuestbookMessage, PaginatedResponse } from '../../types/site';

type Tab = 'pending' | 'all';

export default function AdminGuestbook() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    try {
      /* 加载所有留言（最多200条） */
      const response = await guestbookApi.getAllMessages(0, 200);
      /* 后端返回 ApiResponse<Page<GuestbookMessage>>，需要逐层解包 */
      const pageData = response.data?.data as PaginatedResponse<GuestbookMessage> | undefined;
      setMessages(pageData?.content || []);
    } catch {
      setError('加载留言失败');
    } finally {
      setLoading(false);
    }
  };

  /* 审核通过留言 */
  const handleApprove = async (id: number) => {
    try {
      await guestbookApi.approveMessage(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, approved: true } : m))
      );
    } catch {
      setError('审核留言失败');
    }
  };

  /* 删除留言 */
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条留言？')) return;

    try {
      await guestbookApi.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('删除留言失败');
    }
  };

  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* 根据当前 Tab 过滤留言 */
  const filteredMessages =
    activeTab === 'pending'
      ? messages.filter((m) => !m.approved)
      : messages;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-sw-text">留言管理</h1>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Tab 切换 */}
      <div className="inline-flex rounded-lg border border-sw-border overflow-hidden">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-sw-accent text-white'
              : 'bg-sw-surface text-sw-muted hover:text-sw-text'
          }`}
        >
          待审核 ({messages.filter((m) => !m.approved).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-sw-accent text-white'
              : 'bg-sw-surface text-sw-muted hover:text-sw-text'
          }`}
        >
          全部 ({messages.length})
        </button>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMessages.length === 0 ? (
        /* 空状态 */
        <div className="bg-sw-surface rounded-xl border border-sw-border p-12 text-center">
          <p className="text-sw-muted">
            {activeTab === 'pending' ? '暂无待审核留言。' : '暂无留言。'}
          </p>
        </div>
      ) : (
        /* 留言列表 */
        <div className="space-y-3">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-sw-surface rounded-xl border border-sw-border p-4"
            >
              {/* 留言头部：名字 + 邮箱 + 时间 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-sw-text">{msg.name}</span>
                  {msg.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-sw-muted">
                      <Mail size={11} />
                      {msg.email}
                    </span>
                  )}
                  {msg.approved ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600 border border-green-200">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
                      Pending
                    </span>
                  )}
                </div>
                <span className="text-xs text-sw-muted">{formatDate(msg.createdAt)}</span>
              </div>

              {/* 留言内容 */}
              <p className="text-sm text-sw-text/80 mb-3 leading-relaxed">{msg.message}</p>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                {!msg.approved && (
                  <button
                    onClick={() => handleApprove(msg.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    <Check size={13} />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-sw-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
