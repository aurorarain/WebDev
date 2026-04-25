import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  History,
  User,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

/**
 * 管理后台布局组件
 * - 左侧固定宽度侧边栏，包含导航菜单、返回站点、登出按钮
 * - 右侧主内容区渲染子路由页面
 * - 高亮当前激活的导航项
 */

/* 侧边栏导航项配置 */
const navItems = [
  { to: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { to: '/admin/blog', label: '博客管理', icon: FileText },
  { to: '/admin/projects', label: '项目管理', icon: FolderOpen },
  { to: '/admin/guestbook', label: '留言管理', icon: MessageSquare },
  { to: '/admin/fer', label: '情绪统计', icon: History },
  { to: '/admin/profile', label: '个人设置', icon: User },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // 判断导航项是否激活（exact 模式精确匹配，否则前缀匹配）
  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-sw-bg text-sw-text flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-sw-surface border-r border-sw-border flex flex-col shrink-0">
        {/* 侧边栏标题 */}
        <div className="p-4 border-b border-sw-border">
          <h2 className="font-bold text-sw-accent">管理后台</h2>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item)
                  ? 'bg-sw-accent/10 text-sw-accent'
                  : 'text-sw-muted hover:bg-sw-surface-2 hover:text-sw-text'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 底部操作区：返回站点 + 登出 */}
        <div className="p-2 border-t border-sw-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sw-muted hover:bg-sw-surface-2 hover:text-sw-text transition-colors"
          >
            <ArrowLeft size={18} />
            返回网站
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
