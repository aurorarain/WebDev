/**
 * 管理后台 — 博客编辑器页
 * 支持新建和编辑博文，左侧表单 + 右侧 Markdown 实时预览
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save } from 'lucide-react';
import { blogApi } from '../../services/blogApi';
import { BlogPost, PaginatedResponse } from '../../types/site';

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  /* 表单状态 */
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* 加载已有博文 */
  useEffect(() => {
    if (!isEditing) return;

    const loadPost = async () => {
      setLoading(true);
      try {
        const response = await blogApi.getAllPosts(0, 100);
        const data = response.data as PaginatedResponse<BlogPost>;
        const post = data.content.find((p) => p.id === Number(id));
        if (post) {
          setTitle(post.title);
          setSlug(post.slug);
          setCategory(post.category || '');
          setTags(post.tags || '');
          setExcerpt(post.excerpt || '');
          setContent(post.content || '');
          setStatus(post.status);
        } else {
          setError('Post not found');
        }
      } catch {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, isEditing]);

  /* 根据标题自动生成 slug */
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );
    }
  };

  /* 保存博文 */
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      category: category.trim(),
      tags: tags.trim(),
      excerpt: excerpt.trim(),
      content,
      status,
    };

    try {
      if (isEditing) {
        await blogApi.updatePost(Number(id), postData);
      } else {
        await blogApi.createPost(postData);
      }
      navigate('/admin/blog');
    } catch {
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  /* Markdown 实时预览 */
  const markdownPreview = useMemo(() => content, [content]);

  /* 加载中 */
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/blog')}
            className="p-1.5 rounded-md text-sw-muted hover:text-sw-text hover:bg-sw-surface-2 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-sw-text">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 左右分栏：表单 + Markdown 预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：编辑表单 */}
        <div className="space-y-4">
          <div className="bg-sw-surface rounded-xl border border-sw-border p-5 space-y-4">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Post title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="post-url-slug"
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="e.g. AI, Tutorial"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Comma separated: AI, ML, OpenCV"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-none"
                placeholder="Brief description of the post"
              />
            </div>

            {/* 状态选择 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {/* 正文编辑 */}
          <div className="bg-sw-surface rounded-xl border border-sw-border p-5">
            <label className="block text-sm font-medium text-sw-muted mb-1.5">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm font-mono placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-y"
              placeholder="Write your post content in Markdown..."
            />
          </div>
        </div>

        {/* 右侧：Markdown 预览 */}
        <div className="bg-sw-surface rounded-xl border border-sw-border p-5">
          <h3 className="text-sm font-medium text-sw-muted mb-3">Preview</h3>
          <div className="prose prose-sm max-w-none text-sw-text">
            {markdownPreview ? (
              <ReactMarkdown>{markdownPreview}</ReactMarkdown>
            ) : (
              <p className="text-sw-muted italic">Start writing to see a preview...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
