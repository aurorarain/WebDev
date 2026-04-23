/**
 * 管理后台仪表盘
 * 展示博客、项目、留言等核心统计数据
 */
import { useState, useEffect } from 'react';
import { FileText, FolderOpen, MessageSquare, MessageCircle } from 'lucide-react';
import { blogApi } from '../services/blogApi';
import { siteApi } from '../services/siteApi';
import { guestbookApi } from '../services/guestbookApi';
import { Project, GuestbookMessage, PaginatedResponse } from '../types/site';

/* 统计卡片数据结构 */
interface StatCard {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  loading: boolean;
}

function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Blog Posts', value: '-', description: 'Total published and draft posts', icon: <FileText size={20} />, loading: true },
    { title: 'Projects', value: '-', description: 'Showcase projects', icon: <FolderOpen size={20} />, loading: true },
    { title: 'Pending Messages', value: '-', description: 'Awaiting review', icon: <MessageSquare size={20} />, loading: true },
    { title: 'Total Messages', value: '-', description: 'All guestbook entries', icon: <MessageCircle size={20} />, loading: true },
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    /* 并行加载所有统计数据 */
    const [blogRes, projectRes, messageRes] = await Promise.allSettled([
      blogApi.getAllPosts(0, 1),
      siteApi.getProjects(),
      guestbookApi.getAllMessages(0, 1),
    ]);

    /* 博客文章总数 — 后端返回 ApiResponse<Page<BlogPost>> */
    let blogCount = 0;
    if (blogRes.status === 'fulfilled') {
      const pageData = blogRes.value.data?.data as PaginatedResponse<any> | undefined;
      blogCount = pageData?.totalElements ?? 0;
    }

    /* 项目总数 — 后端返回 ApiResponse<List<Project>> */
    let projectCount = 0;
    if (projectRes.status === 'fulfilled') {
      const projects = projectRes.value.data?.data as Project[] | undefined;
      projectCount = Array.isArray(projects) ? projects.length : 0;
    }

    /* 留言统计 — 后端返回 ApiResponse<Page<GuestbookMessage>> */
    let pendingCount = 0;
    let totalMessages = 0;
    if (messageRes.status === 'fulfilled') {
      const pageData = messageRes.value.data?.data as PaginatedResponse<GuestbookMessage> | undefined;
      totalMessages = pageData?.totalElements ?? 0;

      /* 加载全部留言来计算 pending 数量 */
      try {
        const allMsgRes = await guestbookApi.getAllMessages(0, totalMessages || 200);
        const allData = allMsgRes.data?.data as PaginatedResponse<GuestbookMessage> | undefined;
        pendingCount = (allData?.content || []).filter((m) => !m.approved).length;
      } catch {
        /* 如果加载失败，尝试用单页数据估算 */
        pendingCount = (pageData?.content || []).filter((m) => !m.approved).length;
      }
    }

    setStats([
      { title: 'Blog Posts', value: blogCount, description: 'Total published and draft posts', icon: <FileText size={20} />, loading: false },
      { title: 'Projects', value: projectCount, description: 'Showcase projects', icon: <FolderOpen size={20} />, loading: false },
      { title: 'Pending Messages', value: pendingCount, description: 'Awaiting review', icon: <MessageSquare size={20} />, loading: false },
      { title: 'Total Messages', value: totalMessages, description: 'All guestbook entries', icon: <MessageCircle size={20} />, loading: false },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-sw-text">Dashboard</h1>
        <p className="text-sw-muted text-sm mt-1">Overview of your site content</p>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((card) => (
          <div
            key={card.title}
            className="bg-sw-surface rounded-xl border border-sw-border p-6 flex items-start gap-4"
          >
            {/* 图标 */}
            <div className="p-3 rounded-lg bg-sw-accent/10 text-sw-accent">
              {card.icon}
            </div>

            {/* 数据 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sw-muted">{card.title}</p>
              <p className="text-2xl font-bold text-sw-text mt-1">
                {card.loading ? (
                  <span className="inline-block w-8 h-7 bg-sw-border animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </p>
              <p className="text-xs text-sw-muted mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
