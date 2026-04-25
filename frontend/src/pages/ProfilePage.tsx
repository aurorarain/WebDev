/**
 * 管理员个人资料页
 * 支持编辑 email、bio、avatarUrl，以及修改密码
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Clock, Key, FileText, Image } from 'lucide-react';
import { userApi } from '../services/authApi';

type Tab = 'profile' | 'password';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setEmail(userData.email || '');
        setBio(userData.bio || '');
        setAvatarUrl(userData.avatarUrl || '');
      }
    } catch {
      setError('加载个人资料失败');
    }
  };

  /* 更新个人资料（email、bio、avatarUrl） */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await userApi.updateProfile({ email, bio, avatarUrl });
      if (response.data.success) {
        setUser(response.data.data);
        setSuccess('个人资料已更新');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '更新个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  /* 修改密码 */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }

    setLoading(true);

    try {
      const response = await userApi.changePassword(oldPassword, newPassword);
      if (response.data.success) {
        setSuccess('密码已修改，正在跳转到登录...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-sw-text">个人设置</h1>
        <p className="text-sw-muted text-sm mt-1">管理你的账户设置，修改将在公开的关于页面中展示</p>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Tab 切换 */}
      <div className="inline-flex rounded-lg border border-sw-border overflow-hidden">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-sw-accent text-white'
              : 'bg-sw-surface text-sw-muted hover:text-sw-text'
          }`}
        >
          <User size={14} />
          个人资料
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors ${
            activeTab === 'password'
              ? 'bg-sw-accent text-white'
              : 'bg-sw-surface text-sw-muted hover:text-sw-text'
          }`}
        >
          <Key size={14} />
          修改密码
        </button>
      </div>

      {/* 个人信息 Tab */}
      {activeTab === 'profile' && (
        <div className="bg-sw-surface rounded-xl border border-sw-border p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* 用户名（只读） */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <User size={14} />
                用户名
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-3 py-2 bg-sw-surface-2/50 border border-sw-border rounded-lg text-sw-muted text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-sw-muted">用户名不可修改</p>
            </div>

            {/* 邮箱 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Mail size={14} />
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* 头像 URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Image size={14} />
                头像地址
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs text-sw-muted">将展示在公开的关于页面</p>
            </div>

            {/* 个人简介 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <FileText size={14} />
                个人简介
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-y"
                placeholder="介绍一下你自己..."
              />
              <p className="mt-1 text-xs text-sw-muted">展示在公开的关于页面，支持 Markdown 格式。</p>
            </div>

            {/* 角色（只读） */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Shield size={14} />
                角色
              </label>
              <input
                type="text"
                value="管理员"
                disabled
                className="w-full px-3 py-2 bg-sw-surface-2/50 border border-sw-border rounded-lg text-sw-muted text-sm cursor-not-allowed"
              />
            </div>

            {/* 注册时间（只读） */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Clock size={14} />
                注册时间
              </label>
              <input
                type="text"
                value={user?.createdAt ? formatDate(user.createdAt) : '-'}
                disabled
                className="w-full px-3 py-2 bg-sw-surface-2/50 border border-sw-border rounded-lg text-sw-muted text-sm cursor-not-allowed"
              />
            </div>

            {/* 保存按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </form>
        </div>
      )}

      {/* 修改密码 Tab */}
      {activeTab === 'password' && (
        <div className="bg-sw-surface rounded-xl border border-sw-border p-6">
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">
                当前密码
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="请输入当前密码"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="至少 6 个字符"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">
                确认新密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="再次输入新密码"
              />
            </div>

            {/* 修改密码按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
