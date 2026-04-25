/* 博客列表页 — 淡琥珀渐变背景 + 毛玻璃卡片 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogApi } from '../services/blogApi';
import TiltCard from '../components/ui/TiltCard';
import type { BlogPost } from '../types/site';

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    blogApi.getPublishedPosts(page, 6).then(res => {
      const data = res.data?.data;
      setPosts(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    }).catch(() => {});
  }, [page]);

  return (
    /* 淡琥珀渐变整页背景 */
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(170deg, #fffbeb 0%, #fef3c7 35%, #fff7ed 70%, #ffffff 100%)' }}>
      {/* 光斑装饰 — 精简至2个，缩小尺寸与模糊半径 */}
      <div className="fixed top-[5%] right-[-5%] w-[260px] h-[260px] bg-amber-200/10 rounded-full blur-[50px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-5%] w-[220px] h-[220px] bg-orange-200/8 rounded-full blur-[45px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-bold text-center mb-4">实验日志</h1>
          <p className="text-sw-muted text-center mb-12">笔记、洞察与实验记录</p>
        </motion.div>

        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <TiltCard>
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="relative overflow-hidden rounded-2xl bg-white/55 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-xl hover:bg-white/70 transition-all duration-300 group">
                  <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
                  <div className="p-6">
                    <p className="text-sw-muted text-xs mb-2">
                      {new Date(post.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-sw-accent transition-colors duration-300">{post.title}</h2>
                    {post.excerpt && <p className="text-sw-muted text-sm">{post.excerpt}</p>}
                    {post.tags && (
                      <div className="flex gap-2 mt-3">
                        {post.tags.split(',').map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sw-muted border border-white/30">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {posts.length === 0 && <p className="text-center text-sw-muted py-12">暂无文章。</p>}

        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-12">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-5 py-2 bg-white/55 backdrop-blur-sm rounded-full text-sm disabled:opacity-50 border border-white/50 hover:border-sw-accent/30 transition-all">
              上一页
            </button>
            <span className="px-4 py-2 text-sw-muted text-sm">第 {page + 1} 页，共 {totalPages} 页</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-5 py-2 bg-white/55 backdrop-blur-sm rounded-full text-sm disabled:opacity-50 border border-white/50 hover:border-sw-accent/30 transition-all">
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
