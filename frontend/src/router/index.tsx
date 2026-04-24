import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import WebsiteLayout from '../components/layout/WebsiteLayout';
import AdminLayout from '../components/layout/AdminLayout';

const HomePage = lazy(() => import('../pages/HomePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPage'));
const ProjectDemoPage = lazy(() => import('../pages/ProjectDemoPage'));
const BlogListPage = lazy(() => import('../pages/BlogListPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
const GuestbookPage = lazy(() => import('../pages/GuestbookPage'));
const FerDemoPage = lazy(() => import('../pages/FerDemoPage'));

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const AdminBlogList = lazy(() => import('../pages/admin/AdminBlogList'));
const AdminBlogEditor = lazy(() => import('../pages/admin/AdminBlogEditor'));
const AdminProjectList = lazy(() => import('../pages/admin/AdminProjectList'));
const AdminProjectEditor = lazy(() => import('../pages/admin/AdminProjectEditor'));
const AdminGuestbook = lazy(() => import('../pages/admin/AdminGuestbook'));
const AdminFerStats = lazy(() => import('../pages/admin/AdminFerStats'));

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    element: <WebsiteLayout />,
    children: [
      { path: '/', element: <Lazy><HomePage /></Lazy> },
      { path: '/about', element: <Lazy><AboutPage /></Lazy> },
      { path: '/projects', element: <Lazy><ProjectsPage /></Lazy> },
      { path: '/projects/:slug/demo', element: <Lazy><ProjectDemoPage /></Lazy> },
      { path: '/projects/:slug', element: <Lazy><ProjectDetailPage /></Lazy> },
      { path: '/blog', element: <Lazy><BlogListPage /></Lazy> },
      { path: '/blog/:slug', element: <Lazy><BlogPostPage /></Lazy> },
      { path: '/guestbook', element: <Lazy><GuestbookPage /></Lazy> },
      { path: '/fer-demo', element: <Lazy><FerDemoPage /></Lazy> },
    ],
  },
  { path: '/login', element: <Navigate to="/" replace /> },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Lazy><DashboardPage /></Lazy> },
      { path: 'blog', element: <Lazy><AdminBlogList /></Lazy> },
      { path: 'blog/new', element: <Lazy><AdminBlogEditor /></Lazy> },
      { path: 'blog/:id', element: <Lazy><AdminBlogEditor /></Lazy> },
      { path: 'projects', element: <Lazy><AdminProjectList /></Lazy> },
      { path: 'projects/new', element: <Lazy><AdminProjectEditor /></Lazy> },
      { path: 'projects/:id', element: <Lazy><AdminProjectEditor /></Lazy> },
      { path: 'guestbook', element: <Lazy><AdminGuestbook /></Lazy> },
      { path: 'fer', element: <Lazy><AdminFerStats /></Lazy> },
      { path: 'profile', element: <Lazy><ProfilePage /></Lazy> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
