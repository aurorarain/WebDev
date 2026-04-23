/* 项目列表页 — 按分类筛选，卡片网格布局 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { siteApi } from '../services/siteApi';
import type { Project } from '../types/site';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // 加载全部项目
    siteApi.getProjects().then(res => {
      setProjects(res.data?.data || []);
    }).catch(() => {});
  }, []);

  /* 动态提取分类列表 */
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 relative">
      {/* 标题区背景光斑 */}
      <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] bg-indigo-200/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-[5%] right-[10%] w-[300px] h-[300px] bg-purple-200/15 rounded-full blur-[80px] pointer-events-none" />

      <h1 className="font-display text-4xl font-bold text-center mb-4">Projects</h1>
      <p className="text-sw-muted text-center mb-12">A collection of my experiments and builds</p>

      {/* 分类筛选按钮组 */}
      <div className="flex flex-wrap gap-2 justify-center mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              filter === cat
                ? 'bg-sw-accent text-white'
                : 'bg-sw-surface text-sw-muted hover:text-sw-text border border-sw-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 项目卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="p-6 bg-white rounded-2xl border border-sw-border/60 shadow-sm hover:shadow-lg hover:border-sw-accent/40 transition-all group h-full flex flex-col">
              <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-sw-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sw-muted text-sm mb-4 flex-1">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags?.split(',').map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-sw-surface rounded-full text-sw-muted">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/projects/${project.slug}`}
                  className="text-sm text-sw-accent hover:underline">View Details</Link>
                {project.demoUrl && (
                  <Link to={project.demoUrl} className="text-sm text-sw-muted hover:text-sw-text flex items-center gap-1">
                    <ExternalLink size={14} /> Demo
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sw-muted py-12">No projects found.</p>
      )}
    </div>
  );
}
