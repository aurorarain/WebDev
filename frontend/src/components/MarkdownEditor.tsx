/**
 * Markdown 编辑器 — 支持拖拽/粘贴/按钮上传图片
 */
import { useRef, useState, useCallback } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { siteApi } from '../services/siteApi';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 14 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const insertMarkdown = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // Set cursor after inserted text
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  }, [value, onChange]);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const res = await siteApi.uploadImage(file);
      const url: string = res.data?.data?.url;
      if (url) {
        insertMarkdown(`![${file.name.replace(/\.[^.]+$/, '')}](${url})`);
      }
    } catch {
      // Silent fail for upload
    } finally {
      setUploading(false);
    }
  }, [insertMarkdown]);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadFile(file);
    };
    input.click();
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) uploadFile(file);
        return;
      }
    }
  }, [uploadFile]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sw-muted hover:text-sw-text bg-sw-surface-2 border border-sw-border rounded-lg hover:border-sw-accent/40 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? '上传中...' : '上传图片'}
        </button>
        <span className="text-xs text-sw-muted/50">Support drag & drop, Ctrl+V paste</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onPaste={handlePaste}
        rows={rows}
        className={`w-full px-3 py-2 bg-sw-surface-2 border rounded-lg text-sw-text text-sm font-mono placeholder-sw-muted/50 focus:outline-none focus:ring-1 focus:ring-sw-accent/30 transition-colors resize-y ${
          dragOver ? 'border-sw-accent ring-2 ring-sw-accent/20' : 'border-sw-border focus:border-sw-accent'
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}
