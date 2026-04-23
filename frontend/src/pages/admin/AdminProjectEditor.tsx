/**
 * 管理后台 — 项目编辑器页
 * 支持新建和编辑项目，左侧表单 + 右侧 Markdown 实时预览
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save } from 'lucide-react';
import { siteApi } from '../../services/siteApi';
import { Project } from '../../types/site';

export default function AdminProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  /* 表单状态 */
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* 加载已有项目 */
  useEffect(() => {
    if (!isEditing) return;

    const loadProject = async () => {
      setLoading(true);
      try {
        const response = await siteApi.getProjects();
        const projects = response.data as Project[];
        const project = projects.find((p) => p.id === Number(id));
        if (project) {
          setTitle(project.title);
          setSlug(project.slug);
          setDescription(project.description || '');
          setLongDescription(project.longDescription || '');
          setThumbnailUrl(project.thumbnailUrl || '');
          setDemoUrl(project.demoUrl || '');
          setRepoUrl(project.repoUrl || '');
          setTags(project.tags || '');
          setCategory(project.category || '');
          setFeatured(project.featured);
          setSortOrder(project.sortOrder);
        } else {
          setError('Project not found');
        }
      } catch {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
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

  /* 保存项目 */
  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    const projectData = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      longDescription,
      thumbnailUrl: thumbnailUrl.trim(),
      demoUrl: demoUrl.trim(),
      repoUrl: repoUrl.trim(),
      tags: tags.trim(),
      category: category.trim(),
      featured,
      sortOrder,
    };

    try {
      if (isEditing) {
        await siteApi.updateProject(Number(id), projectData);
      } else {
        await siteApi.createProject(projectData);
      }
      navigate('/admin/projects');
    } catch {
      setError('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  /* Markdown 实时预览 */
  const markdownPreview = useMemo(() => longDescription, [longDescription]);

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
            onClick={() => navigate('/admin/projects')}
            className="p-1.5 rounded-md text-sw-muted hover:text-sw-text hover:bg-sw-surface-2 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-sw-text">
            {isEditing ? 'Edit Project' : 'New Project'}
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

      {/* 左右分栏 */}
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
                placeholder="Project title"
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
                placeholder="project-url-slug"
              />
            </div>

            {/* 简短描述 */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-none"
                placeholder="Brief project description"
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
                placeholder="e.g. AI, Web, Robotics"
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
                placeholder="Comma separated: ONNX, OpenCV, React"
              />
            </div>

            {/* 缩略图 URL */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Thumbnail URL</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="https://example.com/image.png"
              />
            </div>

            {/* Demo URL */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Demo URL</label>
              <input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="https://demo.example.com"
              />
            </div>

            {/* Repo URL */}
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">Repo URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="https://github.com/user/repo"
              />
            </div>

            {/* Featured + Sort Order */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-sw-border bg-sw-surface-2 text-sw-accent focus:ring-sw-accent/30"
                />
                <span className="text-sm text-sw-muted">Featured</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-sw-muted">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 长描述编辑 */}
          <div className="bg-sw-surface rounded-xl border border-sw-border p-5">
            <label className="block text-sm font-medium text-sw-muted mb-1.5">
              Long Description (Markdown)
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm font-mono placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-y"
              placeholder="Detailed project description in Markdown..."
            />
          </div>
        </div>

        {/* 右侧：Markdown 预览 */}
        <div className="bg-sw-surface rounded-xl border border-sw-border p-5 h-fit">
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
