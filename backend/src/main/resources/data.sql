-- 插入管理员账户（密码: jzh145145 的 BCrypt 加密）
INSERT INTO users (username, password, email, role, status, avatar_url, bio, created_at, updated_at)
SELECT 'admin', '$2b$10$zDdmgmaFcIVOG563pvGsB.BsOeYWU27x.zipbAJ5aI0EGQGa5jUGW', 'admin@deepzho.top', 'ADMIN', 'ACTIVE', null, 'Site Administrator', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 插入 FER 项目种子数据
INSERT INTO projects (title, slug, description, long_description, demo_url, repo_url, tags, category, featured, sort_order, created_at, updated_at)
SELECT 'Facial Emotion Recognition', 'fer',
'Real-time facial emotion recognition using OpenCV and ONNX neural networks, supporting 7 emotions detection.',
'# 人脸情绪识别系统 - Facial Emotion Recognition

基于 EfficientNet-B3 的人脸情绪识别 Web 应用，支持图片上传和摄像头实时多人脸识别，可识别 7 种情绪。

## 快速开始

克隆项目后，按以下步骤运行：

```bash
# 1. 克隆项目
git clone https://github.com/aurorarain/FacialEmotionRecognizer.git
cd FacialEmotionRecognizer

# 2. 前端：安装依赖
cd frontend
npm install

# 3. 后端：编译（会自动下载 Java 依赖）
cd ../backend
mvn clean package -DskipTests

# 4. 启动后端
mvn spring-boot:run

# 5. 启动前端（另开一个终端）
cd frontend
npm run dev
```

启动后访问：
- 前端页面：http://localhost:5173
- 后端健康检查：http://localhost:8080/api/health

## 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Java | 17+ | 后端运行 |
| Maven | 3.6+ | 后端构建 |
| Node.js | 16+ | 前端运行 |

## 功能

- **图片上传识别**：上传人脸图片，返回 7 类情绪及置信度
- **摄像头实时多人脸识别**：开启摄像头，实时检测所有可见人脸并用彩色方框标注情绪
- **7 种情绪**：愤怒(Angry)、厌恶(Disgust)、恐惧(Fear)、开心(Happy)、悲伤(Sad)、惊讶(Surprise)、中性(Neutral)
- **REST API**：支持文件上传和 Base64 两种接口

## 技术栈

| 层级 | 技术 |
|------|------|
| 模型架构 | EfficientNet-B3（ImageNet 预训练 + 迁移学习） |
| 训练数据 | AffectNet（8 类情绪，去掉 Contempt 为 7 类，约 20,000 张） |
| 人脸检测 | OpenCV DNN (SSD) |
| 模型部署 | ONNX Runtime 1.16.0 |
| 后端 | Java 17 + Spring Boot 3.2.0 |
| 前端 | React 18 + TypeScript + Vite 5 + TailwindCSS |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/predict` (multipart) | 文件上传识别 |
| POST | `/api/predict` (JSON) | Base64 图片识别 |
| POST | `/api/predict-realtime` | 摄像头实时识别（多人脸） |

## 模型信息

- 架构：EfficientNet-B3（~12M 参数，ImageNet 预训练）
- 输入：3 x 300 x 300 RGB 图像
- 输出：7 类情绪 logits（经 softmax 转为概率）
- 预处理：ImageNet 标准化
- 训练方式：两阶段训练（冻结 backbone -> 全量微调）

## 作者

Zhihao_Ji嵇志豪',
'/fer-demo',
'https://github.com/aurorarain/FacialEmotionRecognizer',
'Spring Boot,React,OpenCV,ONNX,TypeScript',
'AI/ML',
true,
1,
NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'fer');
