"""
情绪识别模型 - EfficientNet-B3
输入: 3x300x300 RGB 图像 (ImageNet 标准化)
输出: 7 类情绪 logits
"""
import torch.nn as nn
import torchvision.models as models


class EmotionNet(nn.Module):
    def __init__(self, num_classes=7, dropout_rate=0.4):
        super(EmotionNet, self).__init__()

        self.backbone = models.efficientnet_b3(weights=models.EfficientNet_B3_Weights.DEFAULT)

        in_features = self.backbone.classifier[1].in_features  # 1536

        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(in_features, num_classes)
        )

    def freeze_backbone(self):
        for name, param in self.backbone.named_parameters():
            if 'classifier' not in name:
                param.requires_grad = False

    def unfreeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = True

    def forward(self, x):
        return self.backbone(x)

    def get_param_groups(self, backbone_lr, fc_lr):
        backbone_params = []
        fc_params = []
        for name, param in self.backbone.named_parameters():
            if 'classifier' in name:
                fc_params.append(param)
            else:
                backbone_params.append(param)
        return [
            {'params': backbone_params, 'lr': backbone_lr},
            {'params': fc_params, 'lr': fc_lr},
        ]


if __name__ == "__main__":
    import torch
    model = EmotionNet(num_classes=7)
    x = torch.randn(1, 3, 300, 300)
    y = model(x)
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Input shape: {x.shape}")
    print(f"Output shape: {y.shape}")
    print(f"Total parameters: {total:,}")
    print(f"Trainable parameters: {trainable:,}")

    model.freeze_backbone()
    trainable_frozen = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"After freeze - Trainable: {trainable_frozen:,}")

    model.unfreeze_backbone()
    trainable_unfrozen = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"After unfreeze - Trainable: {trainable_unfrozen:,}")
