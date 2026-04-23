/**
 * 管理后台 — 博客列表管理页
 * 展示所有博文，支持编辑和删除操作
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { blogApi } from '../../services/blogApi';
import { BlogPost, PaginatedResponse } from '../../types/site';

export default function AdminBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await blogApi.getAllPosts(0, 50);
      /* 后端返回 ApiResponse<Page<BlogPost>>，需要逐层解包：response.data = { success, message, data: Page } */
      const pageData = response.data?.data as PaginatedResponse<BlogPost> | undefined;
      setPosts(pageData?.content || []);
    } catch {
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  /* 删除博文 */
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await blogApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete post');
    }
  };

  /* 状态标签样式 */
  const statusBadge = (status: string) => {
    if (status === 'PUBLISHED') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-600 border border-green-200">
          Published
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
        Draft
      </span>
    );
  };

  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 头部：标题 + 新建按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sw-text">Blog Posts</h1>
        <Link
          to="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 transition-colors"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        /* 空状态 */
        <div className="bg-sw-surface rounded-xl border border-sw-border p-12 text-center">
          <p className="text-sw-muted">No blog posts yet. Create your first post.</p>
        </div>
      ) : (
        /* 博文列表 */
        <div className="bg-sw-surface rounded-xl border border-sw-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sw-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sw-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-sw-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-sw-text">{post.title}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(post.status)}</td>
                    <td className="px-4 py-3 text-sm text-sw-muted">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/blog/${post.id}`}
                          className="p-1.5 rounded-md text-sw-muted hover:text-sw-text hover:bg-sw-surface-2 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-md text-sw-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
