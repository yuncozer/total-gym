"use client";

interface TimerCircleProps {
  seconds: number;
  maxSeconds?: number;
  isResting: boolean;
  size?: number;
  strokeWidth?: number;
}

export function TimerCircle({
  seconds,
  maxSeconds = 120,
  isResting,
  size = 260,
  strokeWidth = 6,
}: TimerCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const isOvertime = seconds > maxSeconds;

  const goldProgress = isOvertime ? 1 : seconds / maxSeconds;
  const goldOffset = circumference * (1 - goldProgress);

  const overtimeSeconds = seconds - maxSeconds;
  const overtimeMax = maxSeconds;
  const overtimeProgress = Math.min(overtimeSeconds / overtimeMax, 1);
  const overtimeOffset = circumference * (1 - overtimeProgress);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(39, 39, 42)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(234, 179, 8)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={goldOffset}
          className="transition-all duration-1000 ease-linear"
          style={{
            opacity: isOvertime ? 0.3 : 1,
            filter: "drop-shadow(0 0 6px rgba(234, 179, 8, 0.3))",
          }}
        />
        {isOvertime && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(239, 68, 68)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overtimeOffset}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))",
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm uppercase tracking-wider font-medium ${isOvertime ? "text-red-500" : "text-icon"}`}>
          {isOvertime ? "SOBRE TIEMPO" : "DESCANSO"}
        </span>
        <span
          className={`text-6xl font-bold mt-1 leading-none ${isOvertime ? "text-red-500" : "text-white"}`}
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          {minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </span>
        <span className="text-[10px] text-icon mt-2">toca para saltar</span>
      </div>
    </div>
  );
}
