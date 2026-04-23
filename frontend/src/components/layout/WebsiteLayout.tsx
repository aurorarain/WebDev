import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from '../auth/LoginModal';

/**
 * 公开网站布局组件
 * - Navbar + 页面内容 + Footer
 * - LoginModal 在 router context 内渲染
 */
export default function WebsiteLayout() {
  return (
    <div className="min-h-screen bg-sw-bg text-sw-text flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
}
