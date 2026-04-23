import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * 公开网站布局组件
 * - 顶部 Navbar（固定定位，占据 16 高度）
 * - 中间 Outlet 渲染子路由页面内容
 * - 底部 Footer
 * - 使用 flex 列布局确保 Footer 始终在底部
 */
export default function WebsiteLayout() {
  return (
    <div className="min-h-screen bg-sw-bg text-sw-text flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
