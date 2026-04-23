/* 项目详情页 — 展示完整项目信息，支持 Markdown 长描述 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';

/* GitHub 图标 — 内联 SVG */
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}
import ReactMarkdown from 'react-markdown';
import { siteApi } from '../services/siteApi';
import type { Project } from '../types/site';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    // 根据 slug 加载项目详情
    if (slug) {
      siteApi.getProject(slug).then(res => {
        setProject(res.data?.data);
      }).catch(() => {});
    }
  }, [slug]);

  if (!project) return <div className="min-h-screen flex items-center justify-center text-sw-muted">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      {/* 返回项目列表 */}
      <Link to="/projects" className="flex items-center gap-2 text-sw-muted hover:text-sw-text mb-8">
        <ArrowLeft size={18} /> Back to Projects
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold mb-4">{project.title}</h1>

        {/* 技术标签 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags?.split(',').map(tag => (
            <span key={tag} className="text-xs px-3 py-1 bg-sw-accent/10 text-sw-accent rounded-full">
              {tag.trim()}
            </span>
          ))}
        </div>

        {/* 外部链接按钮 */}
        <div className="flex gap-4 mb-8">
          {project.demoUrl && (
            <Link to={project.demoUrl}
              className="px-6 py-2 bg-sw-accent text-white rounded-lg hover:bg-sw-accent/90 transition-all flex items-center gap-2">
              <ExternalLink size={16} /> Live Demo
            </Link>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
              className="px-6 py-2 border border-sw-border text-sw-text rounded-lg hover:border-sw-accent transition-all flex items-center gap-2">
              <GithubIcon size={16} /> Source Code
            </a>
          )}
        </div>

        {/* 项目详情（Markdown 渲染） */}
        <div className="prose max-w-none">
          <ReactMarkdown>{project.longDescription || project.description}</ReactMarkdown>
        </div>
      </motion.div>
    </div>
  );
}
