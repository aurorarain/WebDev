/**
 * 管理后台 — 项目列表管理页
 * 展示所有项目，支持编辑和删除操作
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { siteApi } from '../../services/siteApi';
import { Project } from '../../types/site';

export default function AdminProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await siteApi.getProjects();
      /* 后端返回 ApiResponse<List<Project>>，需要逐层解包：response.data = { success, message, data: [...] } */
      const projects = response.data?.data as Project[] | undefined;
      setProjects(Array.isArray(projects) ? projects : []);
    } catch {
      setError('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  /* 删除项目 */
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`删除 "${title}"？此操作不可撤销。`)) return;

    try {
      await siteApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('删除项目失败');
    }
  };

  /* 格式化标签列表 */
  const formatTags = (tags: string) => {
    if (!tags) return [];
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* 头部：标题 + 新建按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sw-text">项目管理</h1>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 transition-colors"
        >
          <Plus size={16} />
          新建项目
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
      ) : projects.length === 0 ? (
        /* 空状态 */
        <div className="bg-sw-surface rounded-xl border border-sw-border p-12 text-center">
          <p className="text-sw-muted">暂无项目，添加你的第一个项目。</p>
        </div>
      ) : (
        /* 项目列表 */
        <div className="bg-sw-surface rounded-xl border border-sw-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sw-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">标题</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">分类</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">精选</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">排序</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sw-border">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-sw-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-sw-text">{project.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sw-accent/15 text-sw-accent border border-sw-accent/20">
                        {project.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {project.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                          <Star size={12} fill="currentColor" />
                          精选
                        </span>
                      ) : (
                        <span className="text-xs text-sw-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-sw-muted">{project.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="p-1.5 rounded-md text-sw-muted hover:text-sw-text hover:bg-sw-surface-2 transition-colors"
                          title="编辑"
                        >
                          <Edit size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id, project.title)}
                          className="p-1.5 rounded-md text-sw-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="删除"
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
