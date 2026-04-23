-- 插入管理员账户（密码: jzh145145 的 BCrypt 加密）
INSERT INTO users (username, password, email, role, status, avatar_url, bio, created_at, updated_at)
SELECT 'admin', '$2b$10$zDdmgmaFcIVOG563pvGsB.BsOeYWU27x.zipbAJ5aI0EGQGa5jUGW', 'admin@deepzho.top', 'ADMIN', 'ACTIVE', null, 'Site Administrator', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 插入 FER 项目种子数据
INSERT INTO projects (title, slug, description, long_description, demo_url, repo_url, tags, category, featured, sort_order, created_at, updated_at)
SELECT 'Facial Emotion Recognition', 'fer',
'Real-time facial emotion recognition using OpenCV and ONNX neural networks, supporting 7 emotions detection.',
'## Overview\n\nA real-time facial emotion recognition system built with Spring Boot, React, OpenCV, and ONNX. The system detects faces in images or webcam feeds and classifies emotions into 7 categories: Angry, Disgust, Fear, Happy, Sad, Surprise, and Neutral.\n\n## Tech Stack\n\n- **Backend**: Spring Boot 3.2 + Java 17\n- **Frontend**: React 18 + TypeScript + Vite\n- **ML**: OpenCV DNN (SSD face detection) + ONNX Runtime (emotion classification)\n- **Model**: Custom CNN trained on FER2013 dataset\n\n## Features\n\n- Upload image for emotion analysis\n- Real-time webcam emotion detection\n- Emotion history tracking\n- Statistics dashboard',
'/fer-demo',
'https://github.com/aurorarain/FacialEmotionRecognizer',
'Spring Boot,React,OpenCV,ONNX,TypeScript',
'AI/ML',
true,
1,
NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'fer');
