/**
 * 登录页面
 * 唯一管理员登录入口，登录成功后跳转到 /admin
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* 检查是否已登录，已登录则直接跳转管理后台 */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

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

        navigate('/admin', { replace: true });
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sw-bg flex items-center justify-center px-4">
      {/* 背景装饰光晕 — 更大的彩色光斑 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-purple-300/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-pink-200/15 rounded-full blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-200/10 rounded-full blur-[80px]" />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-sw-border/60 p-8 shadow-xl">
          {/* 品牌标题 */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-sw-text tracking-tight">
              SingularityWalk
            </h1>
            <p className="mt-2 text-sw-muted text-sm">
              Sign in to Admin Panel
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-sw-muted mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sw-muted mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-sw-accent hover:bg-sw-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-sw-accent/50 focus:ring-offset-2 focus:ring-offset-sw-surface"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
