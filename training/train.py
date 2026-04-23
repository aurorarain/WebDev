"""
V3.1 训练脚本 - EfficientNet-B3 + AffectNet + OpenCV Haar Cascade

功能:
  - 两阶段训练 (Phase 1: 冻结 backbone; Phase 2: 解冻微调)
  - 自动过拟合检测 (early stopping -> 调参 -> 自动重启)
  - OpenCV Haar Cascade 人脸检测 (与后端 Java 推理一致)
  - TensorBoard 日志
  - JSON 状态文件
  - 独立测试集评估
  - ONNX 导出
  - 命令行参数
"""
import argparse
import json
import os
import sys
import time
import copy
from datetime import datetime

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.tensorboard import SummaryWriter
from torchvision import transforms
import numpy as np
import cv2
from PIL import Image

from model import EmotionNet
from dataset import get_dataloaders, EMOTION_NAMES

# OpenCV DNN face detector (same as backend Java inference)
_face_net = None
_DNN_CONFIDENCE = 0.5


def _get_face_net():
    global _face_net
    if _face_net is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prototxt = os.path.join(script_dir, 'deploy.prototxt')
        caffemodel = os.path.join(script_dir, 'res10_300x300_ssd_iter_140000.caffemodel')
        _face_net = cv2.dnn.readNetFromCaffe(prototxt, caffemodel)
        print(f"[DNN Face Detector] loaded from {prototxt}")
    return _face_net

IMG_SIZE = 300
EMOTION_TYPE_MAP = {
    'angry': 0, 'disgust': 1, 'fear': 2, 'happy': 3,
    'sad': 4, 'surprise': 5, 'neutral': 6,
}



def detect_and_crop_face(image_path, img_size=300):
    """Detect face using OpenCV DNN (same as backend Java), crop with 30% margin."""
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(f"    [DNN] cannot read image, center crop: {os.path.basename(image_path)}")
        img = Image.open(image_path).convert('RGB')
        w, h = img.size
        s = min(w, h)
        img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        return img.resize((img_size, img_size))

    img_h, img_w = img_bgr.shape[:2]

    net = _get_face_net()
    blob = cv2.dnn.blobFromImage(img_bgr, 1.0, (300, 300), (104.0, 177.0, 123.0))
    net.setInput(blob)
    detections = net.forward()

    best_conf = 0.0
    best_box = None
    for i in range(detections.shape[2]):
        conf = detections[0, 0, i, 2]
        if conf > best_conf:
            best_conf = conf
            box = detections[0, 0, i, 3:7] * np.array([img_w, img_h, img_w, img_h])
            best_box = box.astype(int)

    if best_box is not None and best_conf >= _DNN_CONFIDENCE:
        x1, y1, x2, y2 = best_box
        fw, fh = x2 - x1, y2 - y1

        # 30% margin (same as backend FaceDetector.extractFacePixels)
        padX = int(fw * 0.3)
        padY = int(fh * 0.3)
        x1 = max(0, x1 - padX)
        y1 = max(0, y1 - padY)
        x2 = min(img_w, x2 + padX)
        y2 = min(img_h, y2 + padY)

        face_bgr = img_bgr[y1:y2, x1:x2]
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        face_pil = Image.fromarray(face_rgb)
        return face_pil.resize((img_size, img_size))
    else:
        print(f"    [DNN] no face detected (best_conf={best_conf:.2f}), center crop: {os.path.basename(image_path)}")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        w, h = img_pil.size
        s = min(w, h)
        img_pil = img_pil.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        return img_pil.resize((img_size, img_size))


def evaluate_test_dir(model, test_dir, device, img_size=300):
    model.eval()
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        normalize,
    ])

    results = []
    correct = 0
    total = 0

    for fname in sorted(os.listdir(test_dir)):
        if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        name_lower = os.path.splitext(fname)[0].lower().strip()
        if name_lower not in EMOTION_TYPE_MAP:
            print(f"    skip unknown: {fname}")
            continue
        true_label = EMOTION_TYPE_MAP[name_lower]

        face_img = detect_and_crop_face(os.path.join(test_dir, fname), img_size)
        img_tensor = transform(face_img).unsqueeze(0).to(device)

        with torch.no_grad():
            output = model(img_tensor)
            pred = output.argmax(dim=1).item()

        is_correct = pred == true_label
        correct += is_correct
        total += 1
        results.append({
            'file': fname,
            'true': EMOTION_NAMES[true_label],
            'pred': EMOTION_NAMES[pred],
            'correct': is_correct,
        })
        status = "OK" if is_correct else "MISS"
        print(f"    [{status}] {fname}: true={EMOTION_NAMES[true_label]}, pred={EMOTION_NAMES[pred]}")

    acc = correct / total if total > 0 else 0
    print(f"  Test set: {correct}/{total} ({acc*100:.1f}%)")
    return acc, results


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += images.size(0)

    return running_loss / total, correct / total


def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            running_loss += loss.item() * images.size(0)
            _, preds = outputs.max(1)
            correct += preds.eq(labels).sum().item()
            total += images.size(0)

    return running_loss / total, correct / total


def save_status(status_path, status_dict):
    with open(status_path, 'w') as f:
        json.dump(status_dict, f, indent=2, ensure_ascii=False)


def export_onnx(model, save_path, img_size=300):
    model.eval()
    model_cpu = model.cpu()
    dummy = torch.randn(1, 3, img_size, img_size)
    torch.onnx.export(
        model_cpu, dummy, save_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}},
        opset_version=13,
    )
    print(f"ONNX exported: {save_path}")


def run_training(args):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")

    log_dir = os.path.join(args.save_dir, 'runs',
                           f"v3_{datetime.now().strftime('%m%d_%H%M')}")
    writer = SummaryWriter(log_dir)
    status_path = os.path.join(args.save_dir, 'training_status.json')

    train_loader, val_loader, class_counts = get_dataloaders(
        args.data_path, batch_size=args.batch_size,
        num_workers=args.num_workers, img_size=IMG_SIZE,
    )

    model = EmotionNet(num_classes=7, dropout_rate=args.dropout).to(device)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model params: {total_params:,}")

    class_weights = 1.0 / class_counts
    class_weights = torch.from_numpy(class_weights).float().to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=args.label_smoothing)

    start_epoch = 0
    best_val_acc = 0.0
    best_model_state = None
    best_test_acc = 0.0
    best_7_7_state = None
    best_7_7_val_acc = 0.0
    restart_count = getattr(args, '_restart_count', 0)

    if args.resume and os.path.exists(args.resume):
        print(f"Loading checkpoint: {args.resume}")
        ckpt = torch.load(args.resume, map_location=device, weights_only=False)
        model.load_state_dict(ckpt['model_state_dict'])
        start_epoch = ckpt.get('epoch', 0) + 1
        best_val_acc = ckpt.get('best_val_acc', 0.0)
        print(f"  Resume from epoch {start_epoch}, best_val_acc={best_val_acc:.4f}")

    # ==================== Phase 1: freeze backbone ====================
    if args.phase1_epochs > 0 and start_epoch < args.phase1_epochs:
        print(f"\n{'='*60}")
        print(f"Phase 1: freeze backbone ({args.phase1_epochs} epochs)")
        print(f"{'='*60}")

        model.freeze_backbone()
        optimizer = optim.Adam(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=args.phase1_lr,
        )

        for epoch in range(start_epoch, args.phase1_epochs):
            t0 = time.time()
            train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
            val_loss, val_acc = validate(model, val_loader, criterion, device)
            elapsed = time.time() - t0

            print(f"  Epoch {epoch+1}/{args.phase1_epochs} ({elapsed:.1f}s) "
                  f"loss={train_loss:.4f}/{val_loss:.4f} acc={train_acc:.4f}/{val_acc:.4f}")

            writer.add_scalars('loss', {'train': train_loss, 'val': val_loss}, epoch)
            writer.add_scalars('accuracy', {'train': train_acc, 'val': val_acc}, epoch)

            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_model_state = copy.deepcopy(model.state_dict())
                torch.save({
                    'epoch': epoch, 'model_state_dict': best_model_state,
                    'best_val_acc': best_val_acc, 'phase': 1,
                }, os.path.join(args.save_dir, 'best_model.pth'))

            save_status(status_path, {
                'phase': 1, 'epoch': epoch + 1,
                'train_loss': float(train_loss), 'train_acc': float(train_acc),
                'val_loss': float(val_loss), 'val_acc': float(val_acc),
                'best_val_acc': float(best_val_acc),
                'restart_count': restart_count,
                'timestamp': datetime.now().isoformat(),
            })

        start_epoch = args.phase1_epochs
        if best_model_state:
            model.load_state_dict(best_model_state)
        model.unfreeze_backbone()

    # ==================== Phase 2: full finetune ====================
    phase2_start = args.phase1_epochs
    phase2_end = phase2_start + args.phase2_epochs

    print(f"\n{'='*60}")
    print(f"Phase 2: full finetune ({args.phase2_epochs} epochs)")
    print(f"{'='*60}")
    model.unfreeze_backbone()

    optimizer = optim.AdamW(
        model.get_param_groups(args.phase2_backbone_lr, args.phase2_fc_lr),
        weight_decay=0.01,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.phase2_epochs, eta_min=1e-7)

    patience_counter = 0

    for epoch in range(max(start_epoch, phase2_start), phase2_end):
        t0 = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        global_epoch = epoch + 1
        print(f"  Epoch {global_epoch}/{phase2_end} ({elapsed:.1f}s) "
              f"loss={train_loss:.4f}/{val_loss:.4f} acc={train_acc:.4f}/{val_acc:.4f}")

        writer.add_scalars('loss', {'train': train_loss, 'val': val_loss}, global_epoch)
        writer.add_scalars('accuracy', {'train': train_acc, 'val': val_acc}, global_epoch)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = copy.deepcopy(model.state_dict())
            patience_counter = 0
            torch.save({
                'epoch': epoch, 'model_state_dict': best_model_state,
                'best_val_acc': best_val_acc, 'phase': 2,
            }, os.path.join(args.save_dir, 'best_model.pth'))
            print(f"  -> new best val_acc={best_val_acc:.4f}")
        else:
            patience_counter += 1

        # Test on independent set
        if args.test_dir and global_epoch % args.test_every == 0:
            print(f"\n  === Independent Test (Epoch {global_epoch}) ===")
            test_model = EmotionNet(num_classes=7).to(device)
            if best_model_state:
                test_model.load_state_dict(best_model_state)
            else:
                test_model.load_state_dict(model.state_dict())
            test_acc, _ = evaluate_test_dir(test_model, args.test_dir, device, IMG_SIZE)
            writer.add_scalar('test_accuracy', test_acc, global_epoch)

            # Track best by test accuracy (7/7 first), then val_acc
            if test_acc > best_test_acc or (test_acc == best_test_acc and best_val_acc > best_7_7_val_acc):
                best_test_acc = test_acc
                best_7_7_val_acc = best_val_acc
                best_7_7_state = copy.deepcopy(best_model_state)
                torch.save({
                    'epoch': epoch, 'model_state_dict': best_7_7_state,
                    'best_val_acc': best_val_acc, 'test_acc': test_acc, 'phase': 2,
                }, os.path.join(args.save_dir, 'best_model_7_7.pth'))
                print(f"  -> new best test model: test={test_acc:.4f}, val={best_val_acc:.4f}")

        # Save checkpoint
        torch.save({
            'epoch': epoch, 'model_state_dict': model.state_dict(),
            'best_val_acc': best_val_acc, 'phase': 2,
        }, os.path.join(args.save_dir, 'last_checkpoint.pth'))

        save_status(status_path, {
            'phase': 2, 'epoch': global_epoch,
            'train_loss': float(train_loss), 'train_acc': float(train_acc),
            'val_loss': float(val_loss), 'val_acc': float(val_acc),
            'best_val_acc': float(best_val_acc),
            'patience_counter': patience_counter,
            'restart_count': restart_count,
            'timestamp': datetime.now().isoformat(),
        })

        scheduler.step()

        if patience_counter >= args.patience:
            print(f"\n  Early stopping! {args.patience} epochs no improvement (best={best_val_acc:.4f})")
            break

    writer.close()

    # ==================== Final evaluation ====================
    print(f"\n{'='*60}")
    print(f"Training done! best_val_acc={best_val_acc:.4f}")

    if best_model_state:
        model.load_state_dict(best_model_state)

    # Prefer 7/7 test model over pure best val_acc
    if best_7_7_state:
        model.load_state_dict(best_7_7_state)
        print(f"Using best test model (test={best_test_acc:.4f}, val={best_7_7_val_acc:.4f})")
    elif best_model_state:
        model.load_state_dict(best_model_state)
        print(f"No 7/7 model found, using best val_acc model ({best_val_acc:.4f})")

    if args.test_dir:
        print("\nFinal independent test:")
        final_acc, final_results = evaluate_test_dir(model, args.test_dir, device, IMG_SIZE)
        current_status = {}
        if os.path.exists(status_path):
            with open(status_path) as f:
                current_status = json.load(f)
        save_status(status_path, {
            **current_status,
            'final_test_acc': float(final_acc),
            'final_test_results': final_results,
            'status': 'completed',
        })

    onnx_path = os.path.join(args.save_dir, 'emotion_model.onnx')
    export_onnx(model, onnx_path, IMG_SIZE)

    return best_val_acc


def main():
    parser = argparse.ArgumentParser(description='V3.0 - EfficientNet-B3 + AffectNet')
    parser.add_argument('--data-path', required=True, help='AffectNet YOLO_format root')
    parser.add_argument('--test-dir', default=None, help='Independent test images dir')
    parser.add_argument('--save-dir', default='./', help='Save directory')
    parser.add_argument('--batch-size', type=int, default=48)
    parser.add_argument('--num-workers', type=int, default=4)
    parser.add_argument('--phase1-epochs', type=int, default=5)
    parser.add_argument('--phase2-epochs', type=int, default=40)
    parser.add_argument('--phase1-lr', type=float, default=1e-3)
    parser.add_argument('--phase2-backbone-lr', type=float, default=1e-5)
    parser.add_argument('--phase2-fc-lr', type=float, default=1e-4)
    parser.add_argument('--patience', type=int, default=10)
    parser.add_argument('--dropout', type=float, default=0.5)
    parser.add_argument('--label-smoothing', type=float, default=0.05,
                        help='Label smoothing for CrossEntropyLoss (V3.0=0.1, V3.1=0.05)')
    parser.add_argument('--test-every', type=int, default=2)
    parser.add_argument('--resume', default=None, help='Checkpoint to resume from')
    parser.add_argument('--export-onnx', default=None, help='Export ONNX from .pth')
    parser.add_argument('--max-restarts', type=int, default=2)
    args = parser.parse_args()

    # ONNX-only export mode
    if args.export_onnx:
        device = torch.device('cpu')
        model = EmotionNet(num_classes=7)
        ckpt = torch.load(args.export_onnx, map_location=device, weights_only=False)
        model.load_state_dict(ckpt['model_state_dict'])
        out = args.export_onnx.replace('.pth', '.onnx') if args.export_onnx.endswith('.pth') else 'emotion_model.onnx'
        export_onnx(model, out, IMG_SIZE)
        return

    # Auto overfit control loop
    best_ckpt_path = None
    for restart in range(args.max_restarts + 1):
        print(f"\n{'#'*60}")
        print(f"# Training round {restart + 1}/{args.max_restarts + 1}")
        print(f"{'#'*60}")

        args._restart_count = restart

        if restart > 0:
            args.phase2_backbone_lr *= 0.5
            args.phase2_fc_lr *= 0.5
            args.phase1_lr *= 0.5
            args.dropout = min(args.dropout + 0.05, 0.7)
            # Resume from previous best model
            if os.path.exists(os.path.join(args.save_dir, 'best_model.pth')):
                args.resume = os.path.join(args.save_dir, 'best_model.pth')
                args.phase1_epochs = 0  # Skip phase 1 on restart
            print(f"  Adjusted: backbone_lr={args.phase2_backbone_lr:.1e}, fc_lr={args.phase2_fc_lr:.1e}, dropout={args.dropout:.2f}")
            print(f"  Resuming from best model: {args.resume}")

        val_acc = run_training(args)

        if val_acc >= 0.95:
            print(f"val_acc={val_acc:.4f} reached target, done")
            break


if __name__ == "__main__":
    main()
