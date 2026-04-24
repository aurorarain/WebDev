import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, Settings } from 'lucide-react';
import { useLoginModal } from '../../contexts/LoginModalContext';

/**
 * 顶部导航栏组件
 * - 滚动感知：顶部透明，滚动后添加背景模糊和底部边框
 * - 移动端汉堡菜单
 * - 未登录点击图标弹出登录弹窗，已登录跳转 admin
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { open: openLogin } = useLoginModal();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isAuthenticated = !!localStorage.getItem('token');

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/projects', label: 'Projects' },
    { to: '/blog', label: 'Experiment Log' },
    { to: '/guestbook', label: 'Guestbook' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-sm border-b border-sw-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="font-display font-bold text-xl text-sw-accent hover:text-sw-accent-2 transition-colors"
          >
            SingularityWalk
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-sw-accent'
                    : 'text-sw-muted hover:text-sw-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                to="/admin"
                className="text-sw-muted hover:text-sw-accent transition-colors"
              >
                <Settings size={20} />
              </Link>
            ) : (
              <button
                onClick={openLogin}
                className="text-sw-muted hover:text-sw-accent transition-colors"
              >
                <LogIn size={20} />
              </button>
            )}
          </div>

          {/* 移动端汉堡按钮 */}
          <button
            className="md:hidden text-sw-muted hover:text-sw-text"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 移动端展开菜单 */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-sw-border">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block py-2 text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'text-sw-accent'
                    : 'text-sw-muted hover:text-sw-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                to="/admin"
                className="block py-2 text-sm text-sw-muted hover:text-sw-accent"
              >
                Admin Panel
              </Link>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); openLogin(); }}
                className="block py-2 text-sm text-sw-muted hover:text-sw-accent"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
