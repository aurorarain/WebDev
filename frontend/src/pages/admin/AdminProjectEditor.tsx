/**
 * 管理后台 — 项目编辑器页
 * 支持新建和编辑项目，左侧表单 + 右侧 Markdown 实时预览
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  /* 嵌入式部署相关状态 */
  const [embeddedEnabled, setEmbeddedEnabled] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [backendPort, setBackendPort] = useState<number>(8081);
  const [backendStartCmd, setBackendStartCmd] = useState('');
  const [healthCheckUrl, setHealthCheckUrl] = useState('');
  const [frontendBuildDir, setFrontendBuildDir] = useState('');
  const [cloneStatus, setCloneStatus] = useState<'idle' | 'cloning' | 'building' | 'success' | 'error'>('idle');
  const [cloneMessage, setCloneMessage] = useState('');

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
        /* 后端返回 ApiResponse<List<Project>>，需要逐层解包 */
        const projects = (response.data?.data || []) as Project[];
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
          /* 加载嵌入式部署字段 */
          setEmbeddedEnabled(project.embeddedEnabled || false);
          setGithubRepoUrl(project.githubRepoUrl || '');
          setProjectPath(project.projectPath || '');
          setBackendPort(project.backendPort || 8081);
          setBackendStartCmd(project.backendStartCmd || '');
          setHealthCheckUrl(project.healthCheckUrl || '');
          setFrontendBuildDir(project.frontendBuildDir || '');
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
      embeddedEnabled,
      githubRepoUrl,
      projectPath,
      backendPort,
      backendStartCmd,
      healthCheckUrl,
      frontendBuildDir,
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

  /* 从 GitHub 拉取项目并构建 */
  const handleClone = async () => {
    if (!githubRepoUrl.trim() || !id) return;
    setCloneStatus('cloning');
    setCloneMessage('正在从 GitHub 拉取项目...');
    try {
      const res = await siteApi.cloneProject(Number(id), githubRepoUrl.trim());
      const result = res.data?.data;
      if (result?.success) {
        setCloneStatus('success');
        setCloneMessage('项目拉取和构建成功！');
        if (result.projectPath) setProjectPath(result.projectPath);
        if (result.frontendBuildDir) setFrontendBuildDir(result.frontendBuildDir);
        if (result.suggestedStartCmd) setBackendStartCmd(result.suggestedStartCmd);
        if (result.suggestedPort) setBackendPort(result.suggestedPort);
        if (result.suggestedPort) setHealthCheckUrl(`http://localhost:${result.suggestedPort}/api/health`);
      } else {
        setCloneStatus('error');
        setCloneMessage(result?.message || '拉取失败');
      }
    } catch {
      setCloneStatus('error');
      setCloneMessage('无法连接到服务器');
    }
  };

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

          {/* 嵌入式部署设置 */}
          <div className="bg-sw-surface rounded-xl border border-sw-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-sw-text">动态部署设置</h3>
              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={embeddedEnabled}
                  onChange={(e) => setEmbeddedEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-sw-border bg-sw-surface-2 text-sw-accent focus:ring-sw-accent/30"
                />
                <span className="text-sm text-sw-muted">启用动态部署</span>
              </label>
            </div>

            {embeddedEnabled && (
              <div className="space-y-3 pt-2 border-t border-sw-border">
                {/* GitHub URL + Clone */}
                <div>
                  <label className="block text-sm font-medium text-sw-muted mb-1.5">GitHub 仓库地址</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                      placeholder="https://github.com/user/repo"
                    />
                    <button
                      onClick={handleClone}
                      disabled={!githubRepoUrl.trim() || !id || cloneStatus === 'cloning'}
                      className="px-4 py-2 bg-sw-accent text-white rounded-lg text-sm hover:bg-sw-accent/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {cloneStatus === 'cloning' ? '拉取中...' : '拉取项目'}
                    </button>
                  </div>
                  {cloneMessage && (
                    <p className={`text-xs mt-1 ${cloneStatus === 'error' ? 'text-red-500' : cloneStatus === 'success' ? 'text-green-500' : 'text-sw-muted'}`}>
                      {cloneMessage}
                    </p>
                  )}
                </div>

                {/* 项目路径 */}
                <div>
                  <label className="block text-sm font-medium text-sw-muted mb-1.5">项目路径</label>
                  <input
                    type="text"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    placeholder="自动填充"
                  />
                </div>

                {/* 后端端口 + 健康检查 URL */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-sw-muted mb-1.5">后端端口</label>
                    <input
                      type="number"
                      value={backendPort}
                      onChange={(e) => setBackendPort(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sw-muted mb-1.5">健康检查 URL</label>
                    <input
                      type="text"
                      value={healthCheckUrl}
                      onChange={(e) => setHealthCheckUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                      placeholder="http://localhost:8081/api/health"
                    />
                  </div>
                </div>

                {/* 后端启动命令 */}
                <div>
                  <label className="block text-sm font-medium text-sw-muted mb-1.5">后端启动命令</label>
                  <input
                    type="text"
                    value={backendStartCmd}
                    onChange={(e) => setBackendStartCmd(e.target.value)}
                    className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm font-mono placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    placeholder="java -jar backend.jar --server.port=8081"
                  />
                </div>

                {/* 前端构建目录 */}
                <div>
                  <label className="block text-sm font-medium text-sw-muted mb-1.5">前端构建目录</label>
                  <input
                    type="text"
                    value={frontendBuildDir}
                    onChange={(e) => setFrontendBuildDir(e.target.value)}
                    className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    placeholder="自动填充"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：Markdown 预览 */}
        <div className="bg-sw-surface rounded-xl border border-sw-border p-5 h-fit">
          <h3 className="text-sm font-medium text-sw-muted mb-3">Preview</h3>
          <div className="prose prose-sm max-w-none text-sw-text">
            {markdownPreview ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownPreview}</ReactMarkdown>
            ) : (
              <p className="text-sw-muted italic">Start writing to see a preview...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
