"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "ELIMINAR",
  cancelText = "CANCELAR",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 p-6 rounded-2xl bg-[#18181b] border border-[#3f3f46] shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#ef4444]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
          </div>

          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {title}
          </h2>

          <p className="text-[#a1a1aa] text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 border border-[#3f3f46] text-[#a1a1aa] hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
