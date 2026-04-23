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
      setError('Failed to load profile');
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
        setSuccess('Profile updated successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
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
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await userApi.changePassword(oldPassword, newPassword);
      if (response.data.success) {
        setSuccess('Password changed. Redirecting to login...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-sw-text">Admin Profile</h1>
        <p className="text-sw-muted text-sm mt-1">Manage your account settings — changes will appear on the public About page</p>
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
          Profile
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
          Password
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
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-3 py-2 bg-sw-surface-2/50 border border-sw-border rounded-lg text-sw-muted text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-sw-muted">Username cannot be changed</p>
            </div>

            {/* 邮箱 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Mail size={14} />
                Email
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
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs text-sw-muted">Used on the public About page</p>
            </div>

            {/* 个人简介 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <FileText size={14} />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-y"
                placeholder="Tell visitors about yourself..."
              />
              <p className="mt-1 text-xs text-sw-muted">Displayed on the public About page. Markdown supported.</p>
            </div>

            {/* 角色（只读） */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Shield size={14} />
                Role
              </label>
              <input
                type="text"
                value="Administrator"
                disabled
                className="w-full px-3 py-2 bg-sw-surface-2/50 border border-sw-border rounded-lg text-sw-muted text-sm cursor-not-allowed"
              />
            </div>

            {/* 注册时间（只读） */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-sw-muted mb-1.5">
                <Clock size={14} />
                Member Since
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
              {loading ? 'Saving...' : 'Save Changes'}
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
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sw-muted mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-sw-surface-2 border border-sw-border rounded-lg text-sw-text text-sm placeholder-sw-muted/50 focus:outline-none focus:border-sw-accent focus:ring-1 focus:ring-sw-accent/30 transition-colors"
                placeholder="Re-enter new password"
              />
            </div>

            {/* 修改密码按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-sw-accent text-white hover:bg-sw-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
