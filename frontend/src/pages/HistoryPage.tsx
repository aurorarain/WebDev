import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyApi } from '../services/authApi';

interface EmotionHistory {
  id: number;
  imagePath: string;
  emotion: string;
  confidence: number;
  faceCount: number;
  createdAt: string;
}

interface PaginationData {
  content: EmotionHistory[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

function HistoryPage() {
  const navigate = useNavigate();
  const [histories, setHistories] = useState<EmotionHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [statistics, setStatistics] = useState<any>(null);

  const emotions = ['全部', '愤怒', '厌恶', '恐惧', '开心', '悲伤', '惊讶', '中性'];

  useEffect(() => {
    loadHistory(currentPage);
    loadStatistics();
  }, [currentPage, selectedEmotion]);

  const loadHistory = async (page: number) => {
    setLoading(true);
    setError('');

    try {
      const response = selectedEmotion && selectedEmotion !== '全部'
        ? await historyApi.getMyHistoryByEmotion(selectedEmotion, page, 10)
        : await historyApi.getMyHistory(page, 10);

      if (response.data.success) {
        const data: PaginationData = response.data.data;
        setHistories(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await historyApi.getMyStatistics();
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err: any) {
      console.warn('加载统计数据失败:', err);
    }
  };

  const handleEmotionFilter = (emotion: string) => {
    setSelectedEmotion(emotion);
    setCurrentPage(0);
  };

  const handleDeleteHistory = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await historyApi.deleteMyHistory(id);
      if (response.data.success) {
        alert('删除成功');
        loadHistory(currentPage);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      '愤怒': '#E74C3C',
      '厌恶': '#8E44AD',
      '恐惧': '#9B59B6',
      '开心': '#F39C12',
      '悲伤': '#3498DB',
      '惊讶': '#1ABC9C',
      '中性': '#95A5A6',
    };
    return colors[emotion] || '#95A5A6';
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, string> = {
      '愤怒': '😠',
      '厌恶': '🤢',
      '恐惧': '😨',
      '开心': '😊',
      '悲伤': '😢',
      '惊讶': '😮',
      '中性': '😐',
    };
    return icons[emotion] || '😐';
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 历史记录</h1>
        <p className="text-gray-600">查看您的情绪识别历史记录</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {statistics && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <h2 className="text-xl font-semibold mb-4">📈 我的统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-80">总识别次数</p>
              <p className="text-3xl font-bold">{statistics.totalCount || 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-80">最常识别情绪</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const emotionEntry = (statistics.emotionDistribution || [])[0];
                  return emotionEntry ? emotionEntry[0] : '-';
                })()}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-80">情绪类型数</p>
              <p className="text-2xl font-bold">
                {(statistics.emotionDistribution || []).length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {emotions.map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleEmotionFilter(emotion)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedEmotion === emotion
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : histories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无历史记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((history) => (
            <div
              key={history.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-2xl"
                      style={{ color: getEmotionColor(history.emotion) }}
                    >
                      {getEmotionIcon(history.emotion)}
                    </span>
                    <span className="text-lg font-medium text-gray-900">
                      {history.emotion}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(history.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(history.createdAt).toLocaleString('zh-CN')}
                  </p>
                  {history.faceCount > 1 && (
                    <p className="text-xs text-gray-500">
                      检测到 {history.faceCount} 个人脸
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteHistory(history.id)}
                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-700">
            第 {currentPage + 1} 页，共 {totalPages} 页，总计 {totalElements} 条
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
