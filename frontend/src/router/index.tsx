import { createBrowserRouter, Navigate } from 'react-router-dom';
import WebsiteLayout from '../components/layout/WebsiteLayout';
import AdminLayout from '../components/layout/AdminLayout';
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
 * 未登录时重定向到首页（登录通过弹窗完成）
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
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
  /* /login 重定向到首页，登录通过 Navbar 弹窗完成 */
  { path: '/login', element: <Navigate to="/" replace /> },
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
  { path: '*', element: <Navigate to="/" replace /> },
]);
