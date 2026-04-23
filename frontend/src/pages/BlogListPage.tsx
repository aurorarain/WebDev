/* 博客列表页 — 分页展示已发布博文 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogApi } from '../services/blogApi';
import type { BlogPost } from '../types/site';

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // 按页加载已发布博文
    blogApi.getPublishedPosts(page, 6).then(res => {
      const data = res.data?.data;
      setPosts(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    }).catch(() => {});
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 relative">
      {/* 背景光斑 */}
      <div className="absolute top-[5%] right-[-5%] w-[300px] h-[300px] bg-purple-200/15 rounded-full blur-[80px] pointer-events-none" />

      <h1 className="font-display text-4xl font-bold text-center mb-4">Experiment Log</h1>
      <p className="text-sw-muted text-center mb-12">Notes, insights, and experiments</p>

      {/* 博文列表 */}
      <div className="space-y-6">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            viewport={{ once: true }}
          >
            <Link to={`/blog/${post.slug}`}
              className="block p-6 bg-white rounded-2xl border border-sw-border/60 shadow-sm hover:shadow-lg hover:border-sw-accent/40 transition-all group">
              <p className="text-sw-muted text-xs mb-2">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-sw-accent transition-colors">{post.title}</h2>
              {post.excerpt && <p className="text-sw-muted text-sm">{post.excerpt}</p>}
              {post.tags && (
                <div className="flex gap-2 mt-3">
                  {post.tags.split(',').map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-sw-surface rounded-full text-sw-muted">{tag.trim()}</span>
                  ))}
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      {posts.length === 0 && <p className="text-center text-sw-muted py-12">No posts yet.</p>}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 bg-sw-surface rounded-lg text-sm disabled:opacity-50 border border-sw-border">
            Previous
          </button>
          <span className="px-4 py-2 text-sw-muted text-sm">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-sw-surface rounded-lg text-sm disabled:opacity-50 border border-sw-border">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
