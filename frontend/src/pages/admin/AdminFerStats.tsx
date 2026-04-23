/**
 * 管理后台 — FER 统计页
 * 展示情绪识别历史数据，使用 historyApi 获取当前用户记录
 * 由于系统只有唯一管理员，此处即展示所有识别历史
 */
import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { historyApi } from '../../services/authApi';

/* 历史记录数据结构 */
interface HistoryRecord {
  id: number;
  emotion: string;
  confidence: number;
  faceCount: number;
  imagePath: string;
  createdAt: string;
  user?: { username: string };
}

export default function AdminFerStats() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await historyApi.getMyHistory(page, 20);
      if (response.data.success) {
        const pageData = response.data.data;
        setRecords(pageData.content);
        setTotalPages(pageData.totalPages);
      }
    } catch {
      setError('Failed to load FER history');
    } finally {
      setLoading(false);
    }
  };

  /* 格式化日期 */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* 情绪颜色 */
  const emotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      '愤怒': 'text-red-600',
      '厌恶': 'text-purple-600',
      '恐惧': 'text-indigo-600',
      '开心': 'text-green-600',
      '悲伤': 'text-blue-600',
      '惊讶': 'text-yellow-600',
      '中性': 'text-gray-600',
    };
    return colors[emotion] || 'text-sw-accent';
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="text-sw-accent" size={24} />
          <h1 className="text-2xl font-bold text-sw-text">FER Statistics</h1>
        </div>
        <p className="text-sw-muted text-sm mt-1">
          View emotion recognition history for all users
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-sw-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        /* 空状态 */
        <div className="bg-sw-surface rounded-xl border border-sw-border p-12 text-center">
          <p className="text-sw-muted">No recognition history yet.</p>
        </div>
      ) : (
        <>
          {/* 历史记录表格 */}
          <div className="bg-sw-surface rounded-xl border border-sw-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sw-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Emotion</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Confidence</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-sw-muted uppercase tracking-wider">Faces</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sw-border">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-sw-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-sw-muted">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-sw-text">
                        {record.user?.username || 'admin'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${emotionColor(record.emotion)}`}>
                          {record.emotion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-sw-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sw-accent rounded-full"
                              style={{ width: `${(record.confidence * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-sm text-sw-muted">
                            {(record.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-sw-muted">
                        {record.faceCount || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-md text-sm bg-sw-surface border border-sw-border text-sw-muted hover:text-sw-text disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-sw-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-md text-sm bg-sw-surface border border-sw-border text-sw-muted hover:text-sw-text disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
