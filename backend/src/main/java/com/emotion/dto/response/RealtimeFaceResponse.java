package com.emotion.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 实时多人脸识别响应（轻量版，适合高频调用）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeFaceResponse {
    private FaceInfo[] faces;
    private int imageWidth;   // 后端解码后的图像宽度
    private int imageHeight;  // 后端解码后的图像高度

    public RealtimeFaceResponse(FaceInfo[] faces) {
        this.faces = faces;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceInfo {
        private int x;
        private int y;
        private int width;
        private int height;
        private String emotion;
        private double confidence;
    }
}
