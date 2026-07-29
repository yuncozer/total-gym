"use client";

interface AvatarProps {
  src?: string | null;
  fallback: string;
  className: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
}

const OSWALD: React.CSSProperties = { fontFamily: "var(--font-oswald)" };

export function Avatar({ src, fallback, className, textClassName, textStyle = OSWALD }: AvatarProps) {
  return (
    <div className={`${className} overflow-hidden`}>
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={textClassName} style={textStyle}>{fallback.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
