package com.emotion.controller;

import com.emotion.dto.response.ApiResponse;
import com.emotion.dto.response.PredictResponse;
import com.emotion.dto.response.RealtimeFaceResponse;
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

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmotionController {

    private final FaceDetector faceDetector;
    private final EmotionClassifier emotionClassifier;
    private final EmotionHistoryService historyService;

    private final ConcurrentHashMap<String, Long> lastRequestTime = new ConcurrentHashMap<>();
    private static final long MIN_REALTIME_INTERVAL_MS = 100;

    @PostMapping(value = "/predict", consumes = "multipart/form-data")
    public ApiResponse<PredictResponse> predictFile(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            long startTime = System.currentTimeMillis();
            byte[] imageBytes = file.getBytes();
            log.info("收到文件上传: {}, 大小: {} bytes", file.getOriginalFilename(), imageBytes.length);
            return processImage(imageBytes, startTime);
        } catch (Exception e) {
            log.error("图像处理错误", e);
            return ApiResponse.error("图像处理失败: " + e.getMessage());
        }
    }

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

    private ApiResponse<PredictResponse> processImage(byte[] imageBytes, long startTime) {
        if (imageBytes.length > 10 * 1024 * 1024) {
            return ApiResponse.error("图像太大，请上传小于 10MB 的图像");
        }

        Mat image = faceDetector.decodeImage(imageBytes);
        if (image.empty()) {
            return ApiResponse.error("无法解码图像");
        }

        try {
            int width = image.cols();
            int height = image.rows();

            Rect[] faces = faceDetector.detectFaces(image);
            if (faces.length == 0) {
                return ApiResponse.error("未检测到人脸");
            }

            PredictResponse.FaceResult[] results = new PredictResponse.FaceResult[faces.length];

            for (int i = 0; i < faces.length; i++) {
                Rect face = faces[i];
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

                Map<String, Double> probMap = new HashMap<>();
                for (EmotionType type : EmotionType.values()) {
                    probMap.put(type.getZhName(), (double) probabilities[type.getIndex()]);
                }

                results[i] = new PredictResponse.FaceResult(
                        new int[]{face.x, face.y, face.width, face.height},
                        emotion.getZhName(),
                        maxProb,
                        probMap
                );

                log.info("人脸 {}: {} ({}%)", i + 1, emotion.getZhName(), String.format("%.2f", maxProb * 100));
            }

            long processingTime = System.currentTimeMillis() - startTime;
            PredictResponse response = new PredictResponse(
                    results,
                    processingTime / 1000.0,
                    new PredictResponse.ImageSize(width, height)
            );

            try {
                var authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getName())) {
                    String username = authentication.getName();
                    String imagePath = "uploads/" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".jpg";
                    historyService.saveHistory(username, imagePath, response);
                }
            } catch (Exception e) {
                log.warn("保存历史记录失败: {}", e.getMessage());
            }

            return ApiResponse.ok(response);
        } finally {
            image.release();
        }
    }

    @PostMapping(value = "/predict-realtime", consumes = "application/json")
    public ApiResponse<RealtimeFaceResponse> predictRealtime(
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        String clientKey = request.getRemoteAddr();
        long now = System.currentTimeMillis();
        Long last = lastRequestTime.get(clientKey);
        if (last != null && now - last < MIN_REALTIME_INTERVAL_MS) {
            return ApiResponse.ok(new RealtimeFaceResponse(new RealtimeFaceResponse.FaceInfo[0]));
        }
        lastRequestTime.put(clientKey, now);

        try {
            String base64Image = body.get("image");
            if (base64Image == null || base64Image.isEmpty()) {
                return ApiResponse.error("请提供 image 字段");
            }

            if (base64Image.startsWith("data:image/")) {
                base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

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
                            Math.round(maxProb * 1000) / 1000.0
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
