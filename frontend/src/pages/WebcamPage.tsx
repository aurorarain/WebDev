import { useState } from 'react';
import WebcamCapture from '../components/webcam/WebcamCapture';
import { emotionApi } from '../services/emotionApi';

function WebcamPage() {
  const [capturing, setCapturing] = useState(false);

  const handleWebcamCapture = async (imageData: string) => {
    try {
      const response = await emotionApi.predictByBase64(imageData);
      console.log('识别结果：', response);
    } catch (err: any) {
      console.error('预测失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-4">🎥 实时识别</h1>
        <p className="text-center text-gray-600 mb-8">
          开启摄像头进行实时多人脸情绪识别
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!capturing ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">点击下方按钮开始实时识别</p>
              <button
                onClick={() => setCapturing(true)}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
              >
                🎥 开始实时识别
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold">实时识别中...</div>
                <button
                  onClick={() => setCapturing(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium"
                >
                  ⏹ 停止识别
                </button>
              </div>

              <WebcamCapture
                onCapture={handleWebcamCapture}
                isCapturing={capturing}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebcamPage;
