/* 博文详情页 — Markdown 渲染博文内容 */
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
    // 根据 slug 加载博文详情
    if (slug) {
      blogApi.getPost(slug).then(res => {
        setPost(res.data?.data);
      }).catch(() => {});
    }
  }, [slug]);

  if (!post) return <div className="min-h-screen flex items-center justify-center text-sw-muted">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      {/* 返回列表 */}
      <Link to="/blog" className="flex items-center gap-2 text-sw-muted hover:text-sw-text mb-8">
        <ArrowLeft size={18} /> Back to Experiment Log
      </Link>

      <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sw-muted text-sm mb-4">
          {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-4xl font-bold mb-6">{post.title}</h1>

        {/* 标签 */}
        {post.tags && (
          <div className="flex gap-2 mb-8">
            {post.tags.split(',').map(tag => (
              <span key={tag} className="text-xs px-3 py-1 bg-sw-accent/10 text-sw-accent rounded-full">{tag.trim()}</span>
            ))}
          </div>
        )}

        {/* 正文（Markdown 渲染） */}
        <div className="prose max-w-none">
          <ReactMarkdown>{post.content || ''}</ReactMarkdown>
        </div>
      </motion.article>
    </div>
  );
}
