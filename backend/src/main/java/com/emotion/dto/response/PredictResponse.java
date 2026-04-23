package com.emotion.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictResponse {
    private FaceResult[] faces;
    private double processingTime;
    private ImageSize imageSize;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceResult {
        private int[] box;        // [x, y, width, height]
        private String emotion;   // 情绪名称 (中文)
        private double confidence; // 置信度
        private Map<String, Double> probabilities; // 各情绪概率
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageSize {
        private int width;
        private int height;
    }
}
