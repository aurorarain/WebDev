export interface EmotionProbabilities {
  '愤怒': number;
  '厌恶': number;
  '恐惧': number;
  '开心': number;
  '悲伤': number;
  '惊讶': number;
  '中性': number;
}

export interface FaceResult {
  box: number[];  // [x, y, width, height]
  emotion: string;
  confidence: number;
  probabilities: EmotionProbabilities;
}

export interface PredictResponse {
  faces: FaceResult[];
  processingTime: number;
  imageSize: {
    width: number;
    height: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 实时多人脸识别响应（轻量版）
export interface RealtimeFaceInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  emotion: string;
  confidence: number;
}

export interface RealtimeFaceResponse {
  faces: RealtimeFaceInfo[];
  imageWidth: number;
  imageHeight: number;
}
