/* 博文详情页 — 淡琥珀渐变背景 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { blogApi } from '../services/blogApi';
import type { BlogPost } from '../types/site';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (slug) {
      blogApi.getPost(slug).then(res => {
        setPost(res.data?.data);
      }).catch(() => {});
    }
  }, [slug]);

  if (!post) return <div className="min-h-screen flex items-center justify-center text-sw-muted">Loading...</div>;

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(170deg, #fffbeb 0%, #fef3c7 35%, #fff7ed 70%, #ffffff 100%)' }}>
      <div className="fixed top-[10%] right-[-5%] w-[300px] h-[300px] bg-amber-200/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-5%] w-[250px] h-[250px] bg-orange-200/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/blog" className="inline-flex items-center gap-2 text-sw-muted hover:text-sw-text mb-8 transition-colors">
            <ArrowLeft size={18} /> Back to Experiment Log
          </Link>
        </motion.div>

        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sw-muted text-sm mb-4">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display text-4xl font-bold mb-6">{post.title}</h1>

          {post.tags && (
            <div className="flex gap-2 mb-8">
              {post.tags.split(',').map(tag => (
                <span key={tag} className="text-xs px-3 py-1 bg-white/55 backdrop-blur-sm text-sw-accent rounded-full border border-white/40">{tag.trim()}</span>
              ))}
            </div>
          )}

          <div className="p-8 bg-white/55 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm prose max-w-none">
            <ReactMarkdown>{post.content || ''}</ReactMarkdown>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
