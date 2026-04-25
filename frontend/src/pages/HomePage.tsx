/* 首页 — 丝滑板块过渡 + 交替渐变背景 + 毛玻璃卡片 */
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Code2, Brain, Globe, PenTool, MessageCircle, ChevronDown } from 'lucide-react';
import TiltCard from '../components/ui/TiltCard';
const ParticleBackground = lazy(() => import('../components/effects/ParticleBackground'));
import { siteApi } from '../services/siteApi';
import { blogApi } from '../services/blogApi';
import type { Project, BlogPost } from '../types/site';

/* ========== 动画配置 ========== */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* 板块整体入场：从下往上淡入，更慢更柔 */
const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

const techHighlights = [
  { icon: <Brain size={28} />, title: 'AI 与机器学习', desc: '探索情绪识别、计算机视觉和智能系统。' },
  { icon: <Code2 size={28} />, title: '全栈开发', desc: '使用 React、TypeScript、Spring Boot 及现代云工具构建。' },
  { icon: <Globe size={28} />, title: '开源与社区', desc: '参与开源项目，分享技术知识。' },
  { icon: <PenTool size={28} />, title: '实验与创造', desc: '记录实验过程、踩坑经验与心得体会。' },
];

/* ========== 板块标题 ========== */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="text-center mb-16"
    >
      <h2 className="font-display text-3xl sm:text-4xl font-bold">{title}</h2>
      {subtitle && <p className="text-sw-muted mt-3 max-w-2xl mx-auto">{subtitle}</p>}
      <div className="mt-5 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-sw-accent to-sw-accent-2" />
    </motion.div>
  );
}

/* ========== 毛玻璃卡片 ========== */
function GlassCard({
  children,
  gradient = 'from-purple-500 to-indigo-500',
  className = '',
}: {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/55 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-xl hover:bg-white/70 transition-all duration-300 group ${className}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ========== 主页 ========== */
export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [slogan, setSlogan] = useState('行走于技术与好奇心的边缘');

  useEffect(() => {
    siteApi.getSiteConfig().then(res => {
      const site = res.data?.data?.site;
      if (site) setSlogan(site.slogan || slogan);
    }).catch(() => {});
    siteApi.getProjects().then(res => {
      const projects = (res.data?.data || []) as Project[];
      setFeaturedProjects(projects.filter((p: Project) => p.featured).slice(0, 3));
    }).catch(() => {});
    blogApi.getPublishedPosts(0, 3).then(res => {
      setRecentPosts(res.data?.data?.content || []);
    }).catch(() => {});
  }, []);

  return (
    <div>

      {/* ====== Hero — 白色 + 粒子 + 光斑 ====== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-400/15 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-purple-300/15 rounded-full blur-[40px] pointer-events-none" />
        <Suspense fallback={null}>
          <ParticleBackground />
        </Suspense>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-normal pb-3 mb-6 bg-gradient-to-r from-sw-accent via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            SingularityWalk
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl sm:text-2xl text-sw-muted mb-10"
          >
            {slogan}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/projects"
              className="px-8 py-3 bg-sw-accent hover:bg-sw-accent/90 text-white rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-sw-accent/25 hover:-translate-y-0.5 flex items-center gap-2 justify-center">
              探索项目 <ArrowRight size={18} />
            </Link>
            <Link to="/about"
              className="px-8 py-3 border border-sw-border hover:border-sw-accent/40 text-sw-text rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 justify-center">
              <Sparkles size={18} /> 了解更多
            </Link>
          </motion.div>
        </div>
        {/* 滚动指示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-sw-muted/60 text-xs tracking-wider uppercase">向下滚动</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} className="text-sw-muted/50" />
          </motion.div>
        </motion.div>
        {/* 过渡 → About */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #faf8ff 100%)' }} />
      </section>

      {/* ====== About — 极淡薰衣草 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #faf8ff 0%, #f5f0ff 40%, #fdfbff 100%)' }}>
        <div className="absolute top-0 right-[-10%] w-[350px] h-[350px] bg-purple-100/12 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[250px] h-[250px] bg-violet-100/8 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="关于本站" subtitle="一个 AI 实验、开源项目与技术探索的个人空间。" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {techHighlights.map(item => (
              <motion.div key={item.title} variants={fadeUp}>
                <TiltCard>
                <GlassCard gradient="from-purple-400 to-indigo-400">
                  <div className="text-sw-accent mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{item.icon}</div>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">{item.title}</h3>
                  <p className="text-sw-muted text-sm leading-relaxed">{item.desc}</p>
                </GlassCard>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center mt-12"
          >
            <Link to="/about" className="inline-flex items-center gap-2 text-sw-accent hover:text-sw-accent-2 font-medium transition-colors duration-300">
              查看完整介绍 <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
        {/* 过渡 → 技术栈 */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #ffffff 100%)' }} />
      </section>

      {/* ====== 技术栈 — 白色 ====== */}
      <section className="relative py-28 px-4 overflow-hidden bg-white">
        <div className="absolute bottom-0 left-[-5%] w-[250px] h-[250px] bg-blue-100/8 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="技术栈" subtitle="驱动这些实验的工具和框架。" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
          >
            {['React', 'TypeScript', 'Spring Boot', 'Python', 'OpenCV', 'ONNX', 'PyTorch', 'Tailwind CSS', 'MySQL', 'Docker'].map(tag => (
              <motion.span
                key={tag}
                variants={scaleIn}
                whileHover={{ scale: 1.1, y: -4 }}
                className="px-5 py-2.5 bg-sw-surface/60 backdrop-blur-sm rounded-full border border-sw-border/50 text-sm font-medium text-sw-muted hover:text-sw-accent hover:border-sw-accent/40 hover:shadow-md transition-all duration-300 cursor-default"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>
        {/* 过渡 → 精选项目 */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #fefafc 100%)' }} />
      </section>

      {/* ====== 精选项目 — 极淡玫瑰 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #fefafc 0%, #fdf0f5 40%, #fff8fa 100%)' }}>
        <div className="absolute top-0 left-[-5%] w-[300px] h-[300px] bg-pink-100/8 rounded-full blur-[45px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-5%] w-[250px] h-[250px] bg-rose-100/6 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="精选项目" subtitle="精选作品，展示 AI 与 Web 工程的实践成果。" />
          {featuredProjects.length > 0 ? (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
              >
                {featuredProjects.map((project) => (
                  <motion.div key={project.id} variants={fadeUp}>
                    <TiltCard>
                    <Link to={`/projects/${project.slug}`} className="block h-full">
                      <GlassCard gradient="from-pink-400 to-rose-400" className="h-full">
                        <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-sw-muted text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags?.split(',').map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sw-muted">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </GlassCard>
                    </Link>
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center mt-12"
              >
                <Link to="/projects" className="inline-flex items-center gap-2 text-sw-accent hover:text-sw-accent-2 font-medium transition-colors duration-300">
                  查看全部项目 <ArrowRight size={16} />
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <p className="text-sw-muted/60 text-sm mb-4">暂无精选项目</p>
              <Link to="/projects" className="inline-flex items-center gap-2 text-sw-accent hover:text-sw-accent-2 text-sm font-medium transition-colors duration-300">
                浏览全部项目 <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
        {/* 过渡 → 最新实验 */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #f8f9ff 100%)' }} />
      </section>

      {/* ====== 最新实验 — 极淡蓝 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #f8f9ff 0%, #f2f4ff 40%, #fafaff 100%)' }}>
        <div className="absolute top-[-10%] left-[20%] w-[300px] h-[300px] bg-indigo-100/6 rounded-full blur-[45px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[250px] h-[250px] bg-blue-100/6 rounded-full blur-[40px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="最新实验" subtitle="来自工作台的笔记、洞察与经验。" />
          {recentPosts.length > 0 ? (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto"
              >
                {recentPosts.map((post) => (
                  <motion.div key={post.id} variants={fadeUp}>
                    <TiltCard>
                    <Link to={`/blog/${post.slug}`} className="block h-full">
                      <GlassCard gradient="from-blue-400 to-indigo-400" className="h-full">
                        <p className="text-sw-muted text-xs mb-3">
                          {new Date(post.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <h3 className="font-display font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">{post.title}</h3>
                        <p className="text-sw-muted text-sm line-clamp-2">{post.excerpt}</p>
                      </GlassCard>
                    </Link>
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center mt-12"
              >
                <Link to="/blog" className="inline-flex items-center gap-2 text-sw-accent hover:text-sw-accent-2 font-medium transition-colors duration-300">
                  阅读更多文章 <ArrowRight size={16} />
                </Link>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <p className="text-sw-muted/60 text-sm mb-4">暂无文章，敬请期待！</p>
              <Link to="/blog" className="inline-flex items-center gap-2 text-sw-accent hover:text-sw-accent-2 text-sm font-medium transition-colors duration-300">
                前往博客 <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
        {/* 过渡 → CTA */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #fdf9ff 100%)' }} />
      </section>

      {/* ====== CTA — 极淡粉紫 → 白 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #fdf9ff 0%, #fef6fb 40%, #ffffff 100%)' }}>
        <div className="absolute -top-20 right-[-5%] w-[300px] h-[300px] bg-purple-100/6 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-20 left-[-5%] w-[300px] h-[300px] bg-pink-100/6 rounded-full blur-[45px] pointer-events-none" />
        <div className="relative z-10">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="p-12 bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <MessageCircle size={40} className="mx-auto mb-6 text-sw-accent" />
                <h2 className="font-display text-3xl font-bold mb-4">联系我</h2>
                <p className="text-sw-muted mb-8 max-w-lg mx-auto">
                  有问题、有想法，或者只是想打个招呼？欢迎在留言板留言，期待与你的交流。
                </p>
                <Link to="/guestbook"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-sw-accent hover:bg-sw-accent/90 text-white rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-sw-accent/25 hover:-translate-y-0.5">
                  前往留言板 <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
