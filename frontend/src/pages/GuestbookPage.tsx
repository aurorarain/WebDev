/* 留言板页 — 提交留言 + 已审核留言列表 */
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
    // 加载已审核通过的留言
    guestbookApi.getMessages().then(res => {
      setMessages(res.data?.data?.content || []);
    }).catch(() => {});
  }, []);

  /* 提交留言 */
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
    <div className="max-w-3xl mx-auto px-4 py-20 relative">
      {/* 背景光斑 */}
      <div className="absolute top-[10%] left-[-10%] w-[300px] h-[300px] bg-pink-200/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] bg-purple-200/15 rounded-full blur-[70px] pointer-events-none" />

      <h1 className="font-display text-4xl font-bold text-center mb-4">Guestbook</h1>
      <p className="text-sw-muted text-center mb-12">Leave a message or share your thoughts</p>

      {/* 留言提交表单 */}
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-sw-border/60 shadow-sm mb-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text" placeholder="Your name *" required
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="px-4 py-2 bg-sw-bg border border-sw-border rounded-lg text-sw-text focus:border-sw-accent focus:outline-none"
          />
          <input
            type="email" placeholder="Email (optional)"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="px-4 py-2 bg-sw-bg border border-sw-border rounded-lg text-sw-text focus:border-sw-accent focus:outline-none"
          />
        </div>
        <textarea
          placeholder="Your message *" required rows={4}
          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          className="w-full px-4 py-2 bg-sw-bg border border-sw-border rounded-lg text-sw-text focus:border-sw-accent focus:outline-none mb-4 resize-none"
        />
        <div className="flex items-center justify-between">
          {submitted && <p className="text-green-600 text-sm">Message submitted for review!</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit"
            className="ml-auto px-6 py-2 bg-sw-accent text-white rounded-lg hover:bg-sw-accent/90 transition-all flex items-center gap-2">
            <Send size={16} /> Submit
          </button>
        </div>
      </form>

      {/* 已审核留言列表 */}
      <div className="space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            viewport={{ once: true }}
            className="p-4 bg-white rounded-2xl border border-sw-border/60 shadow-sm"
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
  );
}
