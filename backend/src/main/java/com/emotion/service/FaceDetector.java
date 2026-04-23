package com.emotion.service;

import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.dnn.Dnn;
import org.opencv.dnn.Net;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Slf4j
@Service
public class FaceDetector {

    private Net faceDetector;

    private static final float DNN_CONFIDENCE = 0.5f;

    @PostConstruct
    public void init() throws IOException {
        log.info("初始化 OpenCV...");

        // 加载 OpenCV 本地库 (从 JAR 中提取)
        loadOpenCVLibrary();

        // 从 classpath 复制 DNN 模型文件到临时目录
        File tempDir = Files.createTempDirectory("facednn").toFile();
        tempDir.deleteOnExit();

        String[] modelFiles = {"deploy.prototxt", "res10_300x300_ssd_iter_140000.caffemodel"};
        String prototxtPath = null;
        String caffemodelPath = null;

        for (String modelFile : modelFiles) {
            ClassPathResource res = new ClassPathResource("opencv/" + modelFile);
            File temp = new File(tempDir, modelFile);
            Files.copy(res.getInputStream(), temp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            temp.deleteOnExit();
            if (modelFile.endsWith(".prototxt")) prototxtPath = temp.getAbsolutePath();
            else caffemodelPath = temp.getAbsolutePath();
        }

        faceDetector = Dnn.readNetFromCaffe(prototxtPath, caffemodelPath);

        if (faceDetector.empty()) {
            throw new RuntimeException("无法加载人脸检测器");
        }

        log.info("OpenCV face detector initialized (DNN Caffe SSD)");
    }

    /**
     * 解码图像字节数组为 Mat（避免重复解码）
     */
    public Mat decodeImage(byte[] imageBytes) {
        MatOfByte mob = new MatOfByte(imageBytes);
        Mat image = Imgcodecs.imdecode(mob, Imgcodecs.IMREAD_COLOR);
        mob.release();
        return image;
    }

    /**
     * 检测图像中的人脸（从已解码的 Mat，使用 DNN）
     */
    public Rect[] detectFaces(Mat image) {
        if (image.empty()) {
            log.error("图像为空");
            return new Rect[0];
        }

        int imgH = image.rows();
        int imgW = image.cols();

        Mat blob = Dnn.blobFromImage(image, 1.0, new Size(300, 300),
                new Scalar(104.0, 177.0, 123.0), false, false);
        faceDetector.setInput(blob);
        Mat detections = faceDetector.forward();
        blob.release();

        java.util.List<Rect> faceList = new java.util.ArrayList<>();
        int numDetections = (int) detections.size(2);
        float[] allData = new float[numDetections * 7];
        detections.get(new int[]{0, 0, 0, 0}, allData);
        for (int i = 0; i < numDetections; i++) {
            int off = i * 7;
            float confidence = allData[off + 2];
            if (confidence >= DNN_CONFIDENCE) {
                int x1 = (int) (allData[off + 3] * imgW);
                int y1 = (int) (allData[off + 4] * imgH);
                int x2 = (int) (allData[off + 5] * imgW);
                int y2 = (int) (allData[off + 6] * imgH);
                x1 = Math.max(0, Math.min(x1, imgW - 1));
                y1 = Math.max(0, Math.min(y1, imgH - 1));
                x2 = Math.max(0, Math.min(x2, imgW));
                y2 = Math.max(0, Math.min(y2, imgH));
                if (x2 > x1 && y2 > y1) {
                    faceList.add(new Rect(x1, y1, x2 - x1, y2 - y1));
                }
            }
        }
        detections.release();

        log.debug("检测到 {} 张人脸", faceList.size());
        return faceList.toArray(new Rect[0]);
    }

    /**
     * 检测图像中的人脸（从字节数组，兼容旧接口）
     */
    public Rect[] detectFaces(byte[] imageBytes) {
        Mat image = decodeImage(imageBytes);
        if (image.empty()) {
            log.error("无法解码图像");
            return new Rect[0];
        }
        Rect[] result = detectFaces(image);
        image.release();
        return result;
    }

    // ImageNet 标准化参数 (训练时使用的均值和标准差)
    private static final float[] IMAGENET_MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] IMAGENET_STD  = {0.229f, 0.224f, 0.225f};

    /**
     * 从已解码的 Mat 中裁剪人脸并预处理（避免重复解码）
     */
    public float[] extractFacePixels(Mat image, Rect face) {
        int padX = (int) (face.width * 0.3);
        int padY = (int) (face.height * 0.3);
        int x1 = Math.max(0, face.x - padX);
        int y1 = Math.max(0, face.y - padY);
        int x2 = Math.min(image.cols(), face.x + face.width + padX);
        int y2 = Math.min(image.rows(), face.y + face.height + padY);
        Rect paddedFace = new Rect(x1, y1, x2 - x1, y2 - y1);

        Mat faceROI = new Mat(image, paddedFace);
        Mat resized = new Mat();
        Imgproc.resize(faceROI, resized, new Size(300, 300));

        Mat rgb = new Mat();
        Imgproc.cvtColor(resized, rgb, Imgproc.COLOR_BGR2RGB);

        float[] pixels = new float[3 * 300 * 300];
        byte[] data = new byte[(int) (rgb.total() * rgb.channels())];
        rgb.get(0, 0, data);

        int idx = 0;
        for (int c = 0; c < 3; c++) {
            for (int h = 0; h < 300; h++) {
                for (int w = 0; w < 300; w++) {
                    int pixelIdx = (h * 300 + w) * 3 + c;
                    float normalized = ((data[pixelIdx] & 0xFF) / 255.0f - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
                    pixels[idx++] = normalized;
                }
            }
        }

        faceROI.release();
        resized.release();
        rgb.release();
        return pixels;
    }

    /**
     * 从字节数组中裁剪人脸（兼容旧接口，内部会解码图像）
     */
    public float[] extractFacePixels(byte[] imageBytes, Rect face) {
        Mat image = decodeImage(imageBytes);
        if (image.empty()) {
            throw new RuntimeException("无法解码图像");
        }
        float[] result = extractFacePixels(image, face);
        image.release();
        return result;
    }

    /**
     * 从 JAR 中提取并加载 OpenCV 本地库
     */
    private void loadOpenCVLibrary() throws IOException {
        try {
            // 尝试直接加载（如果已安装到系统路径）
            System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
            log.info("✓ 从系统路径加载 OpenCV");
            return;
        } catch (UnsatisfiedLinkError ignored) {
            // 继续尝试从 JAR 中提取
        }

        // 从 openpnp opencv JAR 中提取本地库
        String nativeLibName = System.mapLibraryName(Core.NATIVE_LIBRARY_NAME);
        String osName = System.getProperty("os.name").toLowerCase();
        String arch = System.getProperty("os.arch").toLowerCase();

        // 确定 OS 目录名
        String osDir = osName.contains("win") ? "windows" :
                       osName.contains("mac") ? "osx" : "linux";
        // 确定架构目录名
        String archDir = arch.contains("64") ? "x86_64" : "x86_32";

        String resourcePath = "/nu/pattern/opencv/" + osDir + "/" + archDir + "/" + nativeLibName;

        InputStream is = getClass().getResourceAsStream(resourcePath);
        if (is == null) {
            throw new RuntimeException("无法找到 OpenCV 本地库: " + resourcePath);
        }

        String ext = osName.contains("win") ? ".dll" : osName.contains("mac") ? ".dylib" : ".so";
        Path tempLib = Files.createTempFile("opencv", ext);
        Files.copy(is, tempLib, StandardCopyOption.REPLACE_EXISTING);
        is.close();
        System.load(tempLib.toString());
        log.info("✓ 从 JAR 提取并加载 OpenCV: {}", resourcePath);
    }
}
