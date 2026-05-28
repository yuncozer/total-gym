import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 p-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500/70 hover:text-red-500 transition-colors cursor-pointer shrink-0"
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
