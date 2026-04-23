import { useEffect, useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { emotionApi } from '../../services/emotionApi';
import { RealtimeFaceInfo } from '../../types/emotion';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  '愤怒': '#EF4444',
  '厌恶': '#8B5CF6',
  '恐惧': '#6366F1',
  '开心': '#22C55E',
  '悲伤': '#3B82F6',
  '惊讶': '#F59E0B',
  '中性': '#6B7280',
};

interface FaceOverlay {
  face: RealtimeFaceInfo;
  imgW: number;
  imgH: number;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isCapturing }) => {
  const webcamRef = useRef<Webcam>(null);
  const [overlays, setOverlays] = useState<FaceOverlay[]>([]);
  const processingRef = useRef(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const processRealtimeFrame = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      processingRef.current = false;
      return;
    }

    try {
      const response = await emotionApi.predictRealtime(imageSrc);
      if (response.success && response.data && response.data.faces.length > 0) {
        const imgW = response.data.imageWidth;
        const imgH = response.data.imageHeight;
        setOverlays(response.data.faces.map(face => ({ face, imgW, imgH })));
      } else {
        setOverlays([]);
      }
    } catch {
      setOverlays([]);
    } finally {
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isCapturing) {
      setOverlays([]);
      return;
    }

    let stopped = false;
    const loop = async () => {
      while (!stopped) {
        await processRealtimeFrame();
      }
    };
    loop();

    return () => { stopped = true; };
  }, [isCapturing, processRealtimeFrame]);

  const hasFaces = overlays.length > 0;

  return (
    <div className="relative w-full" style={{ lineHeight: 0 }}>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.5}
        className="w-full rounded-lg shadow-lg"
        style={{ display: 'block' }}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user',
        }}
      />

      {/* 人脸框 — 用后端返回的图像尺寸计算百分比，消除坐标空间不匹配 */}
      {isCapturing && hasFaces && overlays.map(({ face, imgW, imgH }, idx) => {
        const leftPct = (face.x / imgW) * 100;
        const topPct = (face.y / imgH) * 100;
        const widthPct = (face.width / imgW) * 100;
        const heightPct = (face.height / imgH) * 100;
        const color = EMOTION_COLORS[face.emotion] || '#22C55E';
        const label = `${face.emotion} ${(face.confidence * 100).toFixed(0)}%`;

        return (
          <div
            key={idx}
            className="absolute pointer-events-none"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              zIndex: 10,
            }}
          >
            {/* 半透明填充 */}
            <div className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.08 }} />
            {/* 四角装饰线 */}
            <div className="absolute top-0 left-0" style={{ width: '20%', height: '20%', borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}` }} />
            <div className="absolute top-0 right-0" style={{ width: '20%', height: '20%', borderTop: `3px solid ${color}`, borderRight: `3px solid ${color}` }} />
            <div className="absolute bottom-0 left-0" style={{ width: '20%', height: '20%', borderBottom: `3px solid ${color}`, borderLeft: `3px solid ${color}` }} />
            <div className="absolute bottom-0 right-0" style={{ width: '20%', height: '20%', borderBottom: `3px solid ${color}`, borderRight: `3px solid ${color}` }} />
            {/* 情绪标签 */}
            <div
              className="absolute left-0 px-2 py-0.5 rounded text-white text-xs font-bold whitespace-nowrap"
              style={{
                backgroundColor: color,
                opacity: 0.85,
                bottom: 'calc(100% + 2px)',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* 无人脸提示 */}
      {isCapturing && !hasFaces && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full"
             style={{ zIndex: 20 }}>
          未检测到人脸
        </div>
      )}
      {/* 人脸数量提示 */}
      {isCapturing && hasFaces && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-sm px-3 py-1 rounded-full"
             style={{ zIndex: 20 }}>
          检测到 {overlays.length} 张人脸
        </div>
      )}
      {!isCapturing && (
        <button
          onClick={capture}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          拍照识别
        </button>
      )}
    </div>
  );
};

export default WebcamCapture;
