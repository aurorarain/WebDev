# ONNX 模型文件

此目录包含后端推理使用的 ONNX 模型。

## 文件说明

- `emotion_model.onnx`: 情绪识别模型（已包含在仓库中）

## 模型参数 (V3.0)

| 参数 | 值 |
|------|-----|
| 架构 | EfficientNet-B3 |
| 输入 | `[1, 3, 300, 300]` (batch, channel, height, width) |
| 输入名称 | `input` |
| 输出 | `[1, 7]` (batch, 7 类情绪 logits) |
| 输出名称 | `output` |
| 文件大小 | 约 41MB |

## 预处理

1. 人脸检测并裁剪（OpenCV Haar Cascade）
2. Resize 到 300 × 300
3. BGR → RGB
4. 像素值归一化到 [0, 1]
5. ImageNet 标准化：`(pixel - mean) / std`，其中 mean=[0.485, 0.456, 0.406]，std=[0.229, 0.224, 0.225]
6. HWC → CHW 排列

## 输出类别

| 索引 | 情绪 |
|------|------|
| 0 | Angry (愤怒) |
| 1 | Disgust (厌恶) |
| 2 | Fear (恐惧) |
| 3 | Happy (开心) |
| 4 | Sad (悲伤) |
| 5 | Surprise (惊讶) |
| 6 | Neutral (中性) |

输出为原始 logits，需经 softmax 转换为概率分布。
