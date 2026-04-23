import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamCapture from '../components/webcam/WebcamCapture';
import { emotionApi } from '../services/emotionApi';

type Tab = 'image' | 'webcam';

function ImagePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturing, setCapturing] = useState(false);

  const handleImageSelect = async (file: File) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await emotionApi.predictByFile(file);
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError('预测失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleWebcamCapture = async (imageData: string) => {
    try {
      const response = await emotionApi.predictByBase64(imageData);
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (err: any) {
      console.error('预测失败:', err);
    }
  };

  const EMOTIONS = ['愤怒', '厌恶', '恐惧', '开心', '悲伤', '惊讶', '中性'];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">😊 人脸情绪识别</h1>

        {/* 标签切换 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-6 py-2 rounded-l-lg ${
              activeTab === 'image'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📷 图片识别
          </button>
          <button
            onClick={() => setActiveTab('webcam')}
            className={`px-6 py-2 rounded-r-lg ${
              activeTab === 'webcam'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🎥 实时识别
          </button>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'image' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  上传图片
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="mt-1 block w-full text-sm text-gray-500"
                />
              </div>
              {loading && (
                <p className="text-center mt-4">识别中...</p>
              )}
            </div>
          )}

          {activeTab === 'webcam' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">实时识别</h2>
                <button
                  onClick={() => {
                    setCapturing(!capturing);
                    if (!capturing) {
                      setResult(null);
                      setError('');
                    }
                  }}
                  className={`px-4 py-2 rounded ${
                    capturing
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {capturing ? '停止实时识别' : '开始实时识别'}
                </button>
              </div>
              <WebcamCapture
                onCapture={handleWebcamCapture}
                isCapturing={capturing}
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* 结果展示 */}
          {result && result.faces.length > 0 && !(activeTab === 'webcam' && capturing) && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">识别结果</h3>
              {result.faces.map((face: any, index: number) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {face.emotion}
                      </p>
                      <p className="text-gray-600">
                        置信度: {(face.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>位置: ({face.box[0]}, {face.box[1]})</p>
                      <p>大小: {face.box[2]} x {face.box[3]}</p>
                    </div>
                  </div>

                  {/* 概率条形图 */}
                  <div className="mt-4 space-y-2">
                    {EMOTIONS.map((emotion: string) => (
                      <div key={emotion} className="flex items-center">
                        <span className="w-12 text-sm">{emotion}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${(face.probabilities[emotion] * 100).toFixed(1)}%`
                            }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm">
                          {(face.probabilities[emotion] * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-sm text-gray-500 mt-2">
                处理时间: {result.processingTime.toFixed(2)}s
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImagePage;
