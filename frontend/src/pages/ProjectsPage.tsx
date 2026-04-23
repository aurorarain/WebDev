/* 项目列表页 — 淡青蓝渐变背景 + 毛玻璃卡片 */
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
    siteApi.getProjects().then(res => {
      setProjects(res.data?.data || []);
    }).catch(() => {});
  }, []);

  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    /* 淡青蓝渐变整页背景 */
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(170deg, #f0fdfa 0%, #ccfbf1 35%, #f0f9ff 70%, #ffffff 100%)' }}>
      <div className="fixed top-[5%] left-[10%] w-[400px] h-[400px] bg-teal-200/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-[5%] right-[10%] w-[350px] h-[350px] bg-cyan-200/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[30%] w-[250px] h-[250px] bg-sky-200/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-bold text-center mb-4">Projects</h1>
          <p className="text-sw-muted text-center mb-12">A collection of my experiments and builds</p>
        </motion.div>

        {/* 分类筛选 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center mb-12"
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm transition-all duration-300 ${
                filter === cat
                  ? 'bg-sw-accent text-white shadow-md shadow-sw-accent/20'
                  : 'bg-white/55 backdrop-blur-sm text-sw-muted hover:text-sw-text border border-white/50 hover:border-sw-accent/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* 项目卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/55 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-xl hover:bg-white/70 transition-all duration-500 group h-full flex flex-col">
                <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-cyan-400" />
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-sw-muted text-sm mb-4 flex-1">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags?.split(',').map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sw-muted border border-white/30">
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
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sw-muted py-12">No projects found.</p>
        )}
      </div>
    </div>
  );
}
