"""
AffectNet 数据集加载器 (Kaggle YOLO 格式)
结构: YOLO_format/{train,valid,test}/{images,labels}/
标签: YOLO 格式 class x_center y_center width height (每图一个标签)

Kaggle 标签映射:
  0=Anger, 1=Contempt, 2=Disgust, 3=Fear, 4=Happy, 5=Neutral, 6=Sad, 7=Surprise

EmotionType 映射:
  0=ANGRY, 1=DISGUST, 2=FEAR, 3=HAPPY, 4=SAD, 5=SURPRISE, 6=NEUTRAL
"""
import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
import numpy as np
from PIL import Image
import os


# Kaggle AffectNet -> EmotionType (丢弃 Contempt=1)
AFFECTNET_TO_EMOTION = {
    0: 0,  # Anger -> ANGRY
    # 1: Contempt -> 丢弃
    2: 1,  # Disgust -> DISGUST
    3: 2,  # Fear -> FEAR
    4: 3,  # Happy -> HAPPY
    5: 6,  # Neutral -> NEUTRAL
    6: 4,  # Sad -> SAD
    7: 5,  # Surprise -> SURPRISE
}

EMOTION_NAMES = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']


class AffectNetDataset(Dataset):
    def __init__(self, root_dir, split='train', transform=None):
        """
        Args:
            root_dir: AffectNet YOLO_format 根目录
            split: 'train', 'valid', 'test'
            transform: 图像变换
        """
        self.transform = transform
        self.samples = []

        images_dir = os.path.join(root_dir, split, 'images')
        labels_dir = os.path.join(root_dir, split, 'labels')

        if not os.path.exists(images_dir):
            raise FileNotFoundError(f"目录不存在: {images_dir}")

        skipped = 0
        for fname in sorted(os.listdir(images_dir)):
            if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            label_path = os.path.join(labels_dir, os.path.splitext(fname)[0] + '.txt')
            if not os.path.exists(label_path):
                skipped += 1
                continue

            with open(label_path, 'r') as f:
                line = f.readline().strip()
                if not line:
                    skipped += 1
                    continue
                affectnet_class = int(line.split()[0])

            if affectnet_class not in AFFECTNET_TO_EMOTION:
                skipped += 1
                continue

            emotion_idx = AFFECTNET_TO_EMOTION[affectnet_class]
            self.samples.append((os.path.join(images_dir, fname), emotion_idx))

        print(f"  [AffectNet {split}] {len(self.samples)} 张图片 (跳过 {skipped} 张含 Contempt/无标签)")
        self._print_counts()

    def _print_counts(self):
        counts = np.bincount([s[1] for s in self.samples], minlength=7)
        for i, name in enumerate(EMOTION_NAMES):
            print(f"    {name}: {counts[i]}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, label


def get_data_transforms(img_size=300):
    normalize = transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )

    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(10),
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.15, hue=0.05),
        transforms.ToTensor(),
        normalize,
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.08)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        normalize,
    ])

    return train_transform, val_transform


def get_dataloaders(data_path, batch_size=32, num_workers=4, img_size=300):
    """
    Args:
        data_path: AffectNet YOLO_format 根目录
        batch_size: 批次大小
        num_workers: 数据加载工作进程数
        img_size: 输入图像尺寸
    Returns:
        train_loader, val_loader, class_counts
    """
    train_transform, val_transform = get_data_transforms(img_size)

    print("加载 AffectNet 数据集...")
    train_dataset = AffectNetDataset(data_path, split='train', transform=train_transform)
    val_dataset = AffectNetDataset(data_path, split='valid', transform=val_transform)

    # 类别平衡采样
    all_train_labels = [s[1] for s in train_dataset.samples]
    class_counts = np.bincount(all_train_labels, minlength=7).astype(float)
    sample_weights = 1.0 / class_counts[all_train_labels]
    sample_weights = torch.from_numpy(sample_weights).double()
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    print(f"\n{'='*50}")
    print(f"训练集: {len(train_dataset)} 张")
    print(f"验证集: {len(val_dataset)} 张")
    print(f"类别分布: {dict(zip(EMOTION_NAMES, class_counts.astype(int)))}")
    print(f"{'='*50}")

    return train_loader, val_loader, class_counts


if __name__ == "__main__":
    # 本地测试 (解压后)
    import sys
    data_path = sys.argv[1] if len(sys.argv) > 1 else r'E:\0000Database\YOLO_format'
    train_loader, val_loader, counts = get_dataloaders(data_path, batch_size=4, num_workers=0)
    for images, labels in train_loader:
        print(f"Batch: images={images.shape}, labels={labels.shape}")
        print(f"Labels: {[EMOTION_NAMES[l] for l in labels]}")
        break
