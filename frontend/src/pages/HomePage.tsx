/* 首页 — 丝滑板块过渡 + 交替渐变背景 + 毛玻璃卡片 */
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Code2, Brain, Globe, PenTool, MessageCircle, ChevronDown } from 'lucide-react';
import ParticlesBackground from '../components/effects/ParticleBackground';
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
  { icon: <Brain size={28} />, title: 'AI & Machine Learning', desc: 'Exploring emotion recognition, computer vision, and intelligent systems.' },
  { icon: <Code2 size={28} />, title: 'Full-Stack Engineering', desc: 'Building with React, TypeScript, Spring Boot, and modern cloud tools.' },
  { icon: <Globe size={28} />, title: 'Open Source & Community', desc: 'Contributing to open-source projects and sharing knowledge.' },
  { icon: <PenTool size={28} />, title: 'Experiment & Create', desc: 'Documenting experiments, pitfalls, and insights along the way.' },
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
    <div className={`relative overflow-hidden rounded-2xl bg-white/55 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-xl hover:bg-white/70 transition-all duration-500 group ${className}`}>
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ========== 主页 ========== */
export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [slogan, setSlogan] = useState('Walking the edge of technology and curiosity');

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
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-indigo-300/10 rounded-full blur-[80px] pointer-events-none" />
        <ParticlesBackground />
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
              Explore Projects <ArrowRight size={18} />
            </Link>
            <Link to="/about"
              className="px-8 py-3 border border-sw-border hover:border-sw-accent/40 text-sw-text rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 justify-center">
              <Sparkles size={18} /> Learn More
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
          <span className="text-sw-muted/60 text-xs tracking-wider uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} className="text-sw-muted/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ====== About — 淡紫渐变 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)' }}>
        <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] bg-purple-200/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[300px] h-[300px] bg-violet-200/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="About This Site" subtitle="A personal space for AI experiments, open-source projects, and technical explorations." />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {techHighlights.map(item => (
              <motion.div key={item.title} variants={fadeUp}>
                <GlassCard gradient="from-purple-500 to-indigo-500">
                  <div className="text-sw-accent mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{item.icon}</div>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">{item.title}</h3>
                  <p className="text-sw-muted text-sm leading-relaxed">{item.desc}</p>
                </GlassCard>
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
              Read full bio <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== Tech Stack — 白色 ====== */}
      <section className="relative py-28 px-4 overflow-hidden bg-white">
        <div className="absolute bottom-0 left-[-5%] w-[300px] h-[300px] bg-blue-200/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <SectionTitle title="Tech Stack" subtitle="Tools and frameworks powering these experiments." />
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
      </section>

      {/* ====== Featured Projects — 淡粉渐变 ====== */}
      {featuredProjects.length > 0 && (
        <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 50%, #fff5f5 100%)' }}>
          <div className="absolute top-0 left-[-5%] w-[350px] h-[350px] bg-pink-200/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 right-[-5%] w-[300px] h-[300px] bg-rose-200/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <SectionTitle title="Featured Projects" subtitle="Handpicked works that showcase practical AI and web engineering." />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
            >
              {featuredProjects.map((project) => (
                <motion.div key={project.id} variants={fadeUp}>
                  <Link to={`/projects/${project.slug}`} className="block h-full">
                    <GlassCard gradient="from-pink-500 to-rose-400" className="h-full">
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
                View all projects <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ====== Latest Experiments — 淡蓝渐变 ====== */}
      {recentPosts.length > 0 && (
        <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 50%, #f0f9ff 100%)' }}>
          <div className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] bg-indigo-200/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] bg-blue-200/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <SectionTitle title="Latest Experiments" subtitle="Notes, insights, and lessons from the workbench." />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto"
            >
              {recentPosts.map((post) => (
                <motion.div key={post.id} variants={fadeUp}>
                  <Link to={`/blog/${post.slug}`} className="block h-full">
                    <GlassCard gradient="from-blue-500 to-indigo-400" className="h-full">
                      <p className="text-sw-muted text-xs mb-3">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <h3 className="font-display font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">{post.title}</h3>
                      <p className="text-sw-muted text-sm line-clamp-2">{post.excerpt}</p>
                    </GlassCard>
                  </Link>
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
                Read more posts <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ====== CTA — 淡紫粉渐变 ====== */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #faf5ff 0%, #fdf2f8 50%, #ffffff 100%)' }}>
        <div className="absolute -top-20 right-[-5%] w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-[-5%] w-[350px] h-[350px] bg-pink-200/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative z-10">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="p-12 bg-white/65 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-300/15 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-200/15 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10">
                <MessageCircle size={40} className="mx-auto mb-6 text-sw-accent" />
                <h2 className="font-display text-3xl font-bold mb-4">Get in Touch</h2>
                <p className="text-sw-muted mb-8 max-w-lg mx-auto">
                  Have a question, idea, or just want to say hello? Leave a message on the guestbook — I would love to hear from you.
                </p>
                <Link to="/guestbook"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-sw-accent hover:bg-sw-accent/90 text-white rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-sw-accent/25 hover:-translate-y-0.5">
                  Visit Guestbook <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
