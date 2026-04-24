/* 留言板页 — 淡玫瑰渐变背景 + 毛玻璃卡片 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { guestbookApi } from '../services/guestbookApi';
import type { GuestbookMessage } from '../types/site';

export default function GuestbookPage() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    guestbookApi.getMessages().then(res => {
      setMessages(res.data?.data?.content || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await guestbookApi.submitMessage(form);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError('Failed to submit. Please try again.');
    }
  };

  return (
    /* 淡玫瑰渐变整页背景 */
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(170deg, #fff1f2 0%, #fecdd3 35%, #fdf2f8 70%, #ffffff 100%)' }}>
      {/* 光斑装饰 — 精简至2个，缩小尺寸与模糊半径 */}
      <div className="fixed top-[10%] left-[-5%] w-[260px] h-[260px] bg-rose-200/10 rounded-full blur-[50px] pointer-events-none" />
      <div className="fixed bottom-[15%] right-[-5%] w-[220px] h-[220px] bg-pink-200/10 rounded-full blur-[45px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-bold text-center mb-4">Guestbook</h1>
          <p className="text-sw-muted text-center mb-12">Leave a message or share your thoughts</p>
        </motion.div>

        {/* 留言表单 */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white/55 backdrop-blur-md border border-white/50 shadow-sm mb-12"
        >
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-pink-400" />
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text" placeholder="Your name *" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl text-sw-text placeholder-sw-muted/50 focus:border-sw-accent focus:outline-none transition-colors"
              />
              <input
                type="email" placeholder="Email (optional)"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl text-sw-text placeholder-sw-muted/50 focus:border-sw-accent focus:outline-none transition-colors"
              />
            </div>
            <textarea
              placeholder="Your message *" required rows={4}
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl text-sw-text placeholder-sw-muted/50 focus:border-sw-accent focus:outline-none mb-4 resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              {submitted && <p className="text-green-600 text-sm">Message submitted for review!</p>}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit"
                className="ml-auto px-6 py-2 bg-sw-accent text-white rounded-full hover:bg-sw-accent/90 transition-all duration-300 flex items-center gap-2 shadow-md shadow-sw-accent/20">
                <Send size={16} /> Submit
              </button>
            </div>
          </div>
        </motion.form>

        {/* 留言列表 */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="p-5 bg-white/55 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{msg.name}</span>
                <span className="text-sw-muted text-xs">
                  {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sw-muted text-sm">{msg.message}</p>
            </motion.div>
          ))}
        </div>

        {messages.length === 0 && <p className="text-center text-sw-muted">No messages yet. Be the first!</p>}
      </div>
    </div>
  );
}
