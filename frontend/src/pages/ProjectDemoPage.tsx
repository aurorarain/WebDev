/**
 * 嵌入式项目 Demo 页面
 * 点击 Demo 后自动启动项目后端，显示进度，加载 iframe
 * 离开页面时自动关闭后端，显示关闭进度
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { siteApi } from '../services/siteApi';
import type { Project } from '../types/site';

type DemoState = 'loading' | 'starting' | 'running' | 'stopping' | 'error';

interface StatusResponse {
  state: 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR';
  message: string;
  pid: number | null;
}

export default function ProjectDemoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [demoState, setDemoState] = useState<DemoState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const isLeaving = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 每个浏览器标签页的唯一 viewerId，用于服务端连接计数 */
  const viewerId = useRef(
    sessionStorage.getItem('sw_viewer_id') ||
    (() => { const id = crypto.randomUUID(); sessionStorage.setItem('sw_viewer_id', id); return id; })()
  );

  /* 加载项目数据 */
  useEffect(() => {
    if (!slug) return;
    siteApi.getProject(slug).then(res => {
      const p = res.data?.data;
      if (!p) { navigate('/projects'); return; }
      setProject(p);
    }).catch(() => navigate('/projects'));
  }, [slug, navigate]);

  /* 启动项目 demo */
  const startProjectDemo = useCallback(async () => {
    if (!project) return;

    if (!project.embeddedEnabled) {
      /* 非嵌入式项目，直接跳转到 demoUrl */
      if (project.demoUrl) navigate(project.demoUrl);
      else navigate('/projects');
      return;
    }

    setDemoState('starting');
    setProgress(0);

    /* 模拟进度增长 */
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const res = await siteApi.joinProject(project.id, viewerId.current);
      const status: StatusResponse = res.data?.data;

      if (status?.state === 'RUNNING') {
        clearInterval(progressInterval);
        setProgress(100);
        /* 短暂延迟以展示 100% */
        await new Promise(r => setTimeout(r, 300));
        setDemoState('running');
      } else if (status?.state === 'ERROR') {
        clearInterval(progressInterval);
        setDemoState('error');
        /* 处理 CONFLICT 状态：其他用户正在使用服务器 */
        if (status.message?.startsWith('CONFLICT:')) {
          setErrorMsg('有其他用户正在预览其他项目 — 当前服务器内存不足，无法同时运行多个项目，请稍后再试');
        } else {
          setErrorMsg(status.message || '启动失败');
        }
      } else {
        /* 需要轮询等待启动完成 */
        clearInterval(progressInterval);
        startPolling(project.id);
      }
    } catch {
      clearInterval(progressInterval);
      setDemoState('error');
      setErrorMsg('无法连接到服务器');
    }
  }, [project, navigate]);

  /* 轮询项目状态 */
  const startPolling = useCallback((projectId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await siteApi.getProjectStatus(projectId);
        const status: StatusResponse = res.data?.data;

        if (status?.state === 'RUNNING') {
          if (pollRef.current) clearInterval(pollRef.current);
          setProgress(100);
          await new Promise(r => setTimeout(r, 300));
          setDemoState('running');
        } else if (status?.state === 'ERROR') {
          if (pollRef.current) clearInterval(pollRef.current);
          setDemoState('error');
          setErrorMsg(status.message || '启动失败');
        } else {
          setProgress(prev => Math.min(prev + 5, 90));
        }
      } catch {
        /* 忽略轮询错误 */
      }
    }, 2000);
  }, []);

  /* 停止项目 */
  const stopProjectDemo = useCallback(async () => {
    if (!project || isLeaving.current) return;
    isLeaving.current = true;

    if (pollRef.current) clearInterval(pollRef.current);

    setDemoState('stopping');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 20, 90));
    }, 300);

    try {
      await siteApi.leaveProject(project.id, viewerId.current);
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      navigate(`/projects/${project.slug}`);
    } catch {
      clearInterval(progressInterval);
      navigate(`/projects/${project.slug}`);
    }
  }, [project, navigate]);

  /* 项目加载完成后自动启动 */
  useEffect(() => {
    if (project) startProjectDemo();
  }, [project, startProjectDemo]);

  /* 返回按钮处理 */
  const handleBack = useCallback(() => {
    if (demoState === 'starting' || demoState === 'stopping') return; /* 过渡期间禁止操作 */
    if (demoState === 'running') {
      stopProjectDemo();
    } else {
      navigate(`/projects/${slug}`);
    }
  }, [demoState, stopProjectDemo, navigate, slug]);

  /* 防止意外关闭页面 */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (demoState === 'starting' || demoState === 'running' || demoState === 'stopping') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [demoState]);

  /* 组件卸载时清理轮询 */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* 心跳：demo 运行中每 60s 刷新一次状态，保持服务端连接活跃 */
  useEffect(() => {
    if (demoState !== 'running' || !project) return;
    const heartbeat = setInterval(() => {
      siteApi.getProjectStatus(project.id).catch(() => {});
    }, 60000);
    return () => clearInterval(heartbeat);
  }, [demoState, project]);

  return (
    <div className="fixed inset-0 bg-sw-bg z-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-sw-surface border-b border-sw-border">
        <button
          onClick={handleBack}
          disabled={demoState === 'starting' || demoState === 'stopping'}
          className="flex items-center gap-2 text-sm text-sw-muted hover:text-sw-text transition-colors disabled:opacity-50"
        >
          &larr; 返回
        </button>
        <span className="text-sm font-medium text-sw-text">
          {project?.title || '加载中...'}
        </span>
        <div className="w-16" /> {/* 居中用占位符 */}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 relative">
        {/* 启动中遮罩层 */}
        {demoState === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-sw-bg/95 z-10">
            <div className="w-12 h-12 border-4 border-sw-accent border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-lg font-medium text-sw-text mb-2">正在启动项目前后端...</p>
            <p className="text-sm text-sw-muted mb-6">请稍候，这可能需要几分钟</p>
            <div className="w-64 h-2 bg-sw-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-sw-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-sw-muted mt-2">{Math.round(progress)}%</p>
          </div>
        )}

        {/* 关闭中遮罩层 */}
        {demoState === 'stopping' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-sw-bg/95 z-10">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-lg font-medium text-sw-text mb-2">正在关闭项目前后端...</p>
            <p className="text-sm text-sw-muted mb-6">请稍候</p>
            <div className="w-64 h-2 bg-sw-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 错误遮罩层 */}
        {demoState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-sw-bg/95 z-10">
            <div className="text-5xl mb-6 text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <p className="text-lg font-medium text-sw-text mb-2">网页出现问题，请联系管理员</p>
            <p className="text-sm text-sw-muted mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate(`/projects/${slug}`)}
              className="px-6 py-2 bg-sw-accent text-white rounded-lg hover:bg-sw-accent/90 transition-colors"
            >
              返回项目详情
            </button>
          </div>
        )}

        {/* 运行中 — 加载 iframe */}
        {demoState === 'running' && project && (
          <iframe
            src={`/embedded/${project.slug}/index.html`}
            className="w-full h-full border-0"
            title={`${project.title} Demo`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}
      </div>
    </div>
  );
}
