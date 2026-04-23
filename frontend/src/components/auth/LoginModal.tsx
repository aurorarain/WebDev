/* 登录弹窗 — 毛玻璃遮罩 + 居中卡片，带关闭按钮 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { useLoginModal } from '../../contexts/LoginModalContext';

export default function LoginModal() {
  const { isOpen, close } = useLoginModal();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* 已登录则关闭弹窗 */
  useEffect(() => {
    if (isOpen && localStorage.getItem('token')) {
      close();
      navigate('/admin', { replace: true });
    }
  }, [isOpen, close, navigate]);

  /* 打开时清空表单 */
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(username, password);
      if (response.data.success) {
        const { token, username: userName, role } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username: userName, role }));
        close();
        navigate('/admin', { replace: true });
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        /* 遮罩层 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          {/* 背景模糊遮罩 */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* 登录卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/60 p-8 shadow-2xl relative overflow-hidden">
              {/* 光斑装饰 */}
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-300/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-pink-200/15 rounded-full blur-[80px] pointer-events-none" />

              {/* 关闭按钮 */}
              <button
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-sw-muted hover:text-sw-text hover:bg-sw-surface/60 transition-all z-10"
              >
                <X size={18} />
              </button>

              {/* 品牌标题 */}
              <div className="text-center mb-8 relative z-10">
                <h2 className="font-display text-3xl font-bold text-sw-text tracking-tight">
                  SingularityWalk
                </h2>
                <p className="mt-2 text-sw-muted text-sm">Sign in to Admin Panel</p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                  <label htmlFor="modal-username" className="block text-sm font-medium text-sw-muted mb-1.5">
                    Username
                  </label>
                  <input
                    id="modal-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl text-sw-text placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    placeholder="Enter username"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="modal-password" className="block text-sm font-medium text-sw-muted mb-1.5">
                    Password
                  </label>
                  <input
                    id="modal-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl text-sw-text placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                    placeholder="Enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-full text-sm font-semibold text-white bg-sw-accent hover:bg-sw-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sw-accent/50 shadow-md shadow-sw-accent/20"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
