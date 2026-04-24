/**
 * FER 演示页面
 * 提供图片上传和实时摄像头两种情绪识别模式
 */
import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Camera, ArrowLeft, Cpu } from 'lucide-react';
import ImageUploader from '../components/image/ImageUploader';
const WebcamCapture = lazy(() => import('../components/webcam/WebcamCapture'));
import { emotionApi } from '../services/emotionApi';
import { FaceResult } from '../types/emotion';

/* 情绪颜色映射 */
const EMOTION_COLORS: Record<string, string> = {
  '愤怒': '#EF4444',
  '厌恶': '#8B5CF6',
  '恐惧': '#6366F1',
  '开心': '#22C55E',
  '悲伤': '#3B82F6',
  '惊讶': '#F59E0B',
  '中性': '#6B7280',
};

const EMOTIONS = ['愤怒', '厌恶', '恐惧', '开心', '悲伤', '惊讶', '中性'];

type Tab = 'upload' | 'webcam';

export default function FerDemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [result, setResult] = useState<{ faces: FaceResult[]; processingTime: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);

  /* 图片上传识别 */
  const handleImageSelect = async (file: File) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await emotionApi.predictByFile(file);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Prediction failed. Please check if the backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  /* 摄像头截图识别 */
  const handleWebcamCapture = async (imageData: string) => {
    try {
      const response = await emotionApi.predictByBase64(imageData);
      if (response.success) {
        setResult(response.data);
      }
    } catch {
      /* 静默处理，避免高频弹错 */
    }
  };

  return (
    <div className="min-h-screen bg-sw-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回链接 */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sw-muted hover:text-sw-text transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Projects</span>
        </Link>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-sw-text tracking-tight">
            Facial Emotion Recognition
          </h1>
          <p className="mt-3 text-sw-muted text-lg">
            Try our live emotion recognition demo
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-sw-border overflow-hidden">
            <button
              onClick={() => { setActiveTab('upload'); setResult(null); setError(''); }}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-sw-accent text-white'
                  : 'bg-sw-surface text-sw-muted hover:text-sw-text'
              }`}
            >
              <Upload size={16} />
              Upload Image
            </button>
            <button
              onClick={() => { setActiveTab('webcam'); setResult(null); setError(''); }}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'webcam'
                  ? 'bg-sw-accent text-white'
                  : 'bg-sw-surface text-sw-muted hover:text-sw-text'
              }`}
            >
              <Camera size={16} />
              Live Webcam
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-sw-surface rounded-xl border border-sw-border p-6 mb-8">
          {/* 上传图片 Tab */}
          {activeTab === 'upload' && (
            <div>
              <ImageUploader onImageSelect={handleImageSelect} />
              {loading && (
                <div className="mt-6 text-center text-sw-muted text-sm">
                  Analyzing...
                </div>
              )}
            </div>
          )}

          {/* 实时摄像头 Tab */}
          {activeTab === 'webcam' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sw-text font-medium">
                  {capturing ? 'Real-time detection active' : 'Start real-time detection'}
                </span>
                <button
                  onClick={() => {
                    setCapturing(!capturing);
                    if (!capturing) {
                      setResult(null);
                      setError('');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    capturing
                      ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20'
                      : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20'
                  }`}
                >
                  {capturing ? 'Stop' : 'Start'}
                </button>
              </div>
              <Suspense fallback={<div className="text-center py-8 text-sw-muted">Loading camera...</div>}>
                <WebcamCapture
                  onCapture={handleWebcamCapture}
                  isCapturing={capturing}
                />
              </Suspense>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 识别结果 */}
          {result && result.faces.length > 0 && !(activeTab === 'webcam' && capturing) && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-sw-text">Results</h3>
              {result.faces.map((face: FaceResult, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-sw-surface-2 border border-sw-border"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xl font-bold" style={{ color: EMOTION_COLORS[face.emotion] || '#6366f1' }}>
                        {face.emotion}
                      </p>
                      <p className="text-sw-muted text-sm">
                        Confidence: {(face.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* 情绪概率条形图 */}
                  <div className="space-y-1.5">
                    {EMOTIONS.map((emotion: string) => {
                      const prob = face.probabilities[emotion as keyof typeof face.probabilities] || 0;
                      return (
                        <div key={emotion} className="flex items-center gap-2">
                          <span className="w-14 text-xs text-sw-muted">{emotion}</span>
                          <div className="flex-1 h-2 bg-sw-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${(prob * 100).toFixed(1)}%`,
                                backgroundColor: EMOTION_COLORS[emotion] || '#6366f1',
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-sw-muted">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-sw-muted">
                Processing time: {result.processingTime.toFixed(2)}s
              </p>
            </div>
          )}
        </div>

        {/* 底部技术说明 */}
        <div className="flex items-center justify-center gap-2 text-sw-muted text-sm">
          <Cpu size={14} />
          <span>
            Built with Spring Boot, OpenCV SSD face detection, and ONNX emotion classification model
          </span>
        </div>
      </div>
    </div>
  );
}
