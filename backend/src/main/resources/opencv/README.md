# OpenCV 级联分类器

将 `haarcascade_frontalface_default.xml` 文件放在这个目录。

## 下载方式

### 方式 1: 从 OpenCV 官方仓库下载
访问: https://github.com/opencv/opencv/tree/master/data/haarcascades

下载 `haarcascade_frontalface_default.xml` 文件。

### 方式 2: 使用 Python OpenCV
```python
import cv2
import os

# 获取 OpenCV 安装路径
cv2_path = os.path.dirname(cv2.__file__)
source_path = os.path.join(cv2_path, 'data', 'haarcascade_frontalface_default.xml')

# 复制到当前目录
import shutil
shutil.copy(source_path, './haarcascade_frontalface_default.xml')
```

## 文件说明

- `haarcascade_frontalface_default.xml`: OpenCV 人脸检测器级联分类器
- 用于检测图像中的人脸位置
- 大小约 920KB
