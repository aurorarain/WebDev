/* 关于页 — 个人简介、技术栈、教育经历 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail } from 'lucide-react';

/* GitHub 图标 — lucide-react 此版本没有 Github 导出，使用内联 SVG */
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

interface AboutData {
  name: string;
  bio: string;
  avatar: string;
  location: string;
  email: string;
  github: string;
  skills: { category: string; items: string[] }[];
  education: { school: string; degree: string; period: string }[];
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null);

  useEffect(() => {
    // 从站点配置接口加载 About 数据（合并了数据库管理员信息）
    siteApi.getAboutData().then(res => {
      const aboutData = res.data?.data;
      if (aboutData) setAbout(aboutData as AboutData);
    }).catch(() => {});
  }, []);

  if (!about) return <div className="min-h-screen flex items-center justify-center text-sw-muted">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 relative">
      {/* 背景彩色光斑 */}
      <div className="absolute top-[-5%] right-[-10%] w-[400px] h-[400px] bg-purple-300/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-pink-200/15 rounded-full blur-[90px] pointer-events-none" />

      {/* 头像和基本信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-sw-accent to-sw-accent-2 p-1 shadow-lg shadow-sw-accent/20">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-sw-accent">
            {about.name?.[0] || '?'}
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold mb-2">{about.name}</h1>
        <div className="flex items-center justify-center gap-4 text-sw-muted">
          {about.location && <span className="flex items-center gap-1"><MapPin size={16} /> {about.location}</span>}
          <a href={`mailto:${about.email}`} className="flex items-center gap-1 hover:text-sw-accent"><Mail size={16} /> {about.email}</a>
          <a href={about.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-sw-accent"><GithubIcon size={16} /> GitHub</a>
        </div>
      </motion.div>

      {/* 个人简介（Markdown 渲染） */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="prose max-w-none mb-16"
      >
        <ReactMarkdown>{about.bio}</ReactMarkdown>
      </motion.div>

      {/* 技术栈 */}
      {about.skills?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-2xl font-bold mb-8">Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {about.skills.map(group => (
              <div key={group.category} className="p-6 bg-white rounded-2xl border border-sw-border/60 shadow-sm">
                <h3 className="font-semibold mb-4 text-sw-accent">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(skill => (
                    <span key={skill} className="text-sm px-3 py-1 bg-sw-surface-2 rounded-full text-sw-muted">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 教育经历 */}
      {about.education?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl font-bold mb-8">Education</h2>
          <div className="space-y-4">
            {about.education.map(edu => (
              <div key={edu.school} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-sw-border/60 shadow-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-sw-accent shrink-0" />
                <div>
                  <h3 className="font-semibold">{edu.school}</h3>
                  <p className="text-sw-muted text-sm">{edu.degree}</p>
                  <p className="text-sw-muted/60 text-xs">{edu.period}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
