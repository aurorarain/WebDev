import { createBrowserRouter, Navigate } from 'react-router-dom';
import WebsiteLayout from '../components/layout/WebsiteLayout';
import AdminLayout from '../components/layout/AdminLayout';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';
import BlogListPage from '../pages/BlogListPage';
import BlogPostPage from '../pages/BlogPostPage';
import GuestbookPage from '../pages/GuestbookPage';
import FerDemoPage from '../pages/FerDemoPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import AdminBlogList from '../pages/admin/AdminBlogList';
import AdminBlogEditor from '../pages/admin/AdminBlogEditor';
import AdminProjectList from '../pages/admin/AdminProjectList';
import AdminProjectEditor from '../pages/admin/AdminProjectEditor';
import AdminGuestbook from '../pages/admin/AdminGuestbook';
import AdminFerStats from '../pages/admin/AdminFerStats';

/**
 * 管理员路由守卫
 * 未登录时重定向到登录页
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/**
 * 路由配置
 * - 公开网站使用 WebsiteLayout（Navbar + Footer）
 * - 管理后台使用 AdminLayout（侧边栏）
 * - 登录页独立无布局
 */
export const router = createBrowserRouter([
  // 公开网站路由
  {
    element: <WebsiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:slug', element: <ProjectDetailPage /> },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/guestbook', element: <GuestbookPage /> },
      { path: '/fer-demo', element: <FerDemoPage /> },
    ],
  },
  // 登录页（独立，无布局）
  { path: '/login', element: <LoginPage /> },
  // 管理后台路由（需要登录）
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'blog', element: <AdminBlogList /> },
      { path: 'blog/new', element: <AdminBlogEditor /> },
      { path: 'blog/:id', element: <AdminBlogEditor /> },
      { path: 'projects', element: <AdminProjectList /> },
      { path: 'projects/new', element: <AdminProjectEditor /> },
      { path: 'projects/:id', element: <AdminProjectEditor /> },
      { path: 'guestbook', element: <AdminGuestbook /> },
      { path: 'fer', element: <AdminFerStats /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  // 兜底：未匹配路由重定向到首页
  { path: '*', element: <Navigate to="/" replace /> },
]);
