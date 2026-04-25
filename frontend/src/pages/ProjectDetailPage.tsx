/* 项目详情页 — 淡青蓝渐变背景 + README 内容展示 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { siteApi } from '../services/siteApi';
import type { Project } from '../types/site';

/**
 * 从后端 API 获取项目 README 内容
 */
async function fetchReadmeFromBackend(slug: string): Promise<string | null> {
  try {
    const response = await siteApi.getProjectReadme(slug);
    return response.data?.data || null;
  } catch {
    return null;
  }
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  /* README 内容状态 */
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(false);

  useEffect(() => {
    if (slug) {
      siteApi.getProject(slug).then(res => {
        setProject(res.data?.data);
      }).catch(() => {});
    }
  }, [slug]);

  /**
   * 当项目数据加载后，从后端获取 README
   */
  const loadReadme = useCallback(async (project: Project) => {
    if (!project.slug) return;

    setReadmeLoading(true);
    setReadmeError(false);

    try {
      const content = await fetchReadmeFromBackend(project.slug);
      if (content) {
        setReadmeContent(content);
      } else {
        setReadmeContent(project.description || '暂无详细描述。');
        setReadmeError(true);
      }
    } catch {
      setReadmeContent(project.description || 'README 加载失败。');
      setReadmeError(true);
    } finally {
      setReadmeLoading(false);
    }
  }, []);

  /* 当 project 变化时触发 README 加载 */
  useEffect(() => {
    if (project) {
      loadReadme(project);
    }
  }, [project, loadReadme]);

  if (!project) return <div className="min-h-screen flex items-center justify-center text-sw-muted">加载中...</div>;

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(170deg, #f0fdfa 0%, #ccfbf1 35%, #f0f9ff 70%, #ffffff 100%)' }}>
      <div className="fixed top-[10%] right-[-5%] w-[350px] h-[350px] bg-teal-200/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[5%] left-[-5%] w-[300px] h-[300px] bg-cyan-200/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/projects" className="inline-flex items-center gap-2 text-sw-muted hover:text-sw-text mb-8 transition-colors">
            <ArrowLeft size={18} /> 返回项目列表
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-bold mb-4">{project.title}</h1>

          {/* 缩略图 */}
          {project.thumbnailUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden border border-white/50 shadow-sm w-48 h-48 flex-shrink-0">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags?.split(',').map(tag => (
              <span key={tag} className="text-xs px-3 py-1 bg-white/55 backdrop-blur-sm text-sw-accent rounded-full border border-white/40">
                {tag.trim()}
              </span>
            ))}
          </div>

          <div className="flex gap-4 mb-8">
            {(project.embeddedEnabled || project.demoUrl) && (
              <Link
                to={project.embeddedEnabled ? `/projects/${project.slug}/demo` : project.demoUrl}
                className="px-6 py-2 bg-sw-accent text-white rounded-full hover:bg-sw-accent/90 transition-all duration-300 flex items-center gap-2 shadow-md shadow-sw-accent/20"
              >
                <ExternalLink size={16} /> 在线演示
              </Link>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                className="px-6 py-2 bg-white/55 backdrop-blur-sm border border-white/50 text-sw-text rounded-full hover:border-sw-accent/40 transition-all duration-300 flex items-center gap-2">
                <GithubIcon size={16} /> 源代码
              </a>
            )}
          </div>

          {/* README / Markdown 内容区域 */}
          <div className="p-8 bg-white/55 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm prose max-w-none">
            {/* 加载中状态 */}
            {readmeLoading && (
              <div className="flex items-center gap-3 text-sw-muted py-8">
                <div className="w-5 h-5 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
                <span>正在从 GitHub 加载 README...</span>
              </div>
            )}

            {/* GitHub 获取失败提示 */}
            {readmeError && !readmeLoading && (
              <div className="flex items-center gap-2 text-amber-600 text-sm mb-6 p-3 bg-amber-50/50 rounded-lg border border-amber-200/30">
                <AlertCircle size={16} />
                <span>无法从 GitHub 加载 README，正在显示基本描述。</span>
              </div>
            )}

            {/* Markdown 渲染 */}
            {!readmeLoading && readmeContent && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent.replace(/\\n/g, '\n')}</ReactMarkdown>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
