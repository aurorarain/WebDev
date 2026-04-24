package com.emotion.controller;

import com.emotion.dto.response.ApiResponse;
import com.emotion.dto.response.PredictResponse;
import com.emotion.dto.response.RealtimeFaceResponse;
import com.emotion.entity.EmotionHistory;
import com.emotion.model.EmotionType;
import com.emotion.service.EmotionClassifier;
import com.emotion.service.EmotionHistoryService;
import com.emotion.service.FaceDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opencv.core.Mat;
import org.opencv.core.Rect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmotionController {

    private final FaceDetector faceDetector;
    private final EmotionClassifier emotionClassifier;
    private final EmotionHistoryService historyService;

    /**
     * 文件上传方式识别情绪
     */
    @PostMapping(value = "/predict", consumes = "multipart/form-data")
    public ApiResponse<PredictResponse> predictFile(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            long startTime = System.currentTimeMillis();
            byte[] imageBytes = file.getBytes();
            log.info("收到文件上传: {}, 大小: {} bytes", file.getOriginalFilename(), imageBytes.length);
            return processImage(imageBytes, startTime);
        } catch (IOException e) {
            log.error("图像处理错误", e);
            return ApiResponse.error("图像处理失败: " + e.getMessage());
        }
    }

    /**
     * Base64 方式识别情绪（摄像头实时捕获）
     */
    @PostMapping(value = "/predict", consumes = "application/json")
    public ApiResponse<PredictResponse> predictBase64(
            @RequestBody Map<String, String> body
    ) {
        try {
            long startTime = System.currentTimeMillis();

            String base64Image = body.get("image");
            if (base64Image == null || base64Image.isEmpty()) {
                return ApiResponse.error("请提供 image 字段");
            }

            if (base64Image.startsWith("data:image/")) {
                base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            log.info("收到 Base64 图像, 大小: {} bytes", imageBytes.length);
            return processImage(imageBytes, startTime);
        } catch (Exception e) {
            log.error("预测错误", e);
            return ApiResponse.error("预测失败: " + e.getMessage());
        }
    }

    private ApiResponse<PredictResponse> processImage(byte[] imageBytes, long startTime) throws IOException {
        // 验证图像大小
        if (imageBytes.length > 10 * 1024 * 1024) {
            return ApiResponse.error("图像太大，请上传小于 10MB 的图像");
        }

        // 检测人脸
        Rect[] faces = faceDetector.detectFaces(imageBytes);

        if (faces.length == 0) {
            return ApiResponse.error("未检测到人脸");
        }

        // 读取图像尺寸
        BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
        int width = bufferedImage.getWidth();
        int height = bufferedImage.getHeight();

        // 识别每张人脸的情绪
        PredictResponse.FaceResult[] results = new PredictResponse.FaceResult[faces.length];

        for (int i = 0; i < faces.length; i++) {
            Rect face = faces[i];

            // 提取人脸像素
            float[] pixels = faceDetector.extractFacePixels(imageBytes, face);

            // 预测情绪
            float[] probabilities = emotionClassifier.predict(pixels);

            // 找到最高概率的情绪
            int maxIndex = 0;
            float maxProb = probabilities[0];
            for (int j = 1; j < probabilities.length; j++) {
                if (probabilities[j] > maxProb) {
                    maxProb = probabilities[j];
                    maxIndex = j;
                }
            }

            EmotionType emotion = EmotionType.fromIndex(maxIndex);

            // 构建概率映射
            Map<String, Double> probMap = new HashMap<>();
            for (EmotionType type : EmotionType.values()) {
                probMap.put(type.getZhName(), (double) probabilities[type.getIndex()]);
            }

            // 构建结果
            results[i] = new PredictResponse.FaceResult(
                    new int[]{face.x, face.y, face.width, face.height},
                    emotion.getZhName(),
                    maxProb,
                    probMap
            );

            log.info("人脸 {}: {} ({}%)", i + 1, emotion.getZhName(), String.format("%.2f", maxProb * 100));
        }

        // 构建响应
        long processingTime = System.currentTimeMillis() - startTime;
        PredictResponse response = new PredictResponse(
                results,
                processingTime / 1000.0,
                new PredictResponse.ImageSize(width, height)
        );

        // 保存历史记录（异步）
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) {
                String username = authentication.getName();
                String imagePath = "uploads/" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".jpg";
                historyService.saveHistory(username, imagePath, response);
                log.info("历史记录已保存");
            }
        } catch (Exception e) {
            log.warn("保存历史记录失败（用户未登录或其他错误）: {}", e.getMessage());
        }

        return ApiResponse.ok(response);
    }

    /**
     * 实时多人脸识别（轻量版，适合前端高频调用）
     * 接收 Base64 图像，返回所有检测到的人脸坐标 + 情绪 + 置信度
     */
    @PostMapping(value = "/predict-realtime", consumes = "application/json")
    public ApiResponse<RealtimeFaceResponse> predictRealtime(
            @RequestBody Map<String, String> body
    ) {
        try {
            String base64Image = body.get("image");
            if (base64Image == null || base64Image.isEmpty()) {
                return ApiResponse.error("请提供 image 字段");
            }

            if (base64Image.startsWith("data:image/")) {
                base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            // 只解码一次图像，避免 N+1 次重复解码
            Mat image = faceDetector.decodeImage(imageBytes);
            if (image.empty()) {
                return ApiResponse.ok(new RealtimeFaceResponse(new RealtimeFaceResponse.FaceInfo[0]));
            }
            try {
                Rect[] detectedFaces = faceDetector.detectFaces(image);

                if (detectedFaces.length == 0) {
                    return ApiResponse.ok(new RealtimeFaceResponse(new RealtimeFaceResponse.FaceInfo[0]));
                }

                RealtimeFaceResponse.FaceInfo[] faceInfos = new RealtimeFaceResponse.FaceInfo[detectedFaces.length];

                for (int i = 0; i < detectedFaces.length; i++) {
                    Rect face = detectedFaces[i];

                    float[] pixels = faceDetector.extractFacePixels(image, face);
                    float[] probabilities = emotionClassifier.predict(pixels);

                    int maxIndex = 0;
                    float maxProb = probabilities[0];
                    for (int j = 1; j < probabilities.length; j++) {
                        if (probabilities[j] > maxProb) {
                            maxProb = probabilities[j];
                            maxIndex = j;
                        }
                    }

                    EmotionType emotion = EmotionType.fromIndex(maxIndex);

                    faceInfos[i] = new RealtimeFaceResponse.FaceInfo(
                            face.x, face.y, face.width, face.height,
                            emotion.getZhName(),
                            Math.round(maxProb * 1000) / 1000.0  // 保留3位小数
                    );
                }

            log.debug("实时识别: 检测到 {} 张人脸, 图像尺寸: {}x{}", faceInfos.length, image.cols(), image.rows());
            return ApiResponse.ok(new RealtimeFaceResponse(faceInfos, image.cols(), image.rows()));
            } finally {
                image.release();
            }

        } catch (Exception e) {
            log.error("实时预测错误", e);
            return ApiResponse.error("实时预测失败: " + e.getMessage());
        }
    }
}
