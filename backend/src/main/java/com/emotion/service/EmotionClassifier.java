package com.emotion.service;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmotionClassifier {

    @Value("${model.path}")
    private String modelPath;

    private OrtEnvironment env;
    private OrtSession session;

    @PostConstruct
    public void init() throws Exception {
        log.info("加载 ONNX 模型...");

        // 从 classpath 复制模型到临时文件
        ClassPathResource resource = new ClassPathResource("models/emotion_model.onnx");
        Path tempModel = Files.createTempFile("emotion_model", ".onnx");
        Files.copy(resource.getInputStream(), tempModel, StandardCopyOption.REPLACE_EXISTING);

        // 创建 ONNX 环境
        env = OrtEnvironment.getEnvironment();
        session = env.createSession(tempModel.toString());

        log.info("✓ ONNX 模型加载成功");
        log.info("输入: {}", session.getInputNames());
        log.info("输出: {}", session.getOutputNames());
    }

    @PreDestroy
    public void cleanup() {
        if (session != null) {
            try { session.close(); } catch (OrtException ignored) {}
        }
        if (env != null) {
            env.close();
        }
    }

    /**
     * 预测情绪
     *
     * @param imageData 预处理后的图像数据 (300x300x3 CHW float array, ImageNet normalized)
     * @return 7 类情绪的概率
     */
    public float[] predict(float[] imageData) {
        try {
            long[] shape = {1, 3, 300, 300};
            FloatBuffer inputBuffer = FloatBuffer.wrap(imageData);
            var inputTensor = ai.onnxruntime.OnnxTensor.createTensor(env, inputBuffer, shape);

            // 运行推理
            OrtSession.Result result = session.run(
                    Map.of("input", inputTensor)
            );

            // 获取输出
            float[][] output = (float[][]) result.get(0).getValue();

            // 应用 softmax 将原始 logits 转换为概率
            return softmax(output[0]);

        } catch (OrtException e) {
            log.error("ONNX 推理错误", e);
            throw new RuntimeException("情绪预测失败", e);
        }
    }

    /**
     * Softmax 函数：将原始 logits 转换为概率分布 (0-1, 总和为 1)
     */
    private float[] softmax(float[] logits) {
        float maxVal = logits[0];
        for (int i = 1; i < logits.length; i++) {
            if (logits[i] > maxVal) maxVal = logits[i];
        }

        float[] exp = new float[logits.length];
        float sum = 0;
        for (int i = 0; i < logits.length; i++) {
            exp[i] = (float) Math.exp(logits[i] - maxVal);
            sum += exp[i];
        }

        float[] probs = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            probs[i] = exp[i] / sum;
        }
        return probs;
    }
}
