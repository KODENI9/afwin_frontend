import { useState, useEffect } from "react";

/**
 * CountdownTimer
 * Shows time remaining until the next 18:00 draw (same day or next day).
 */
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isDrawTime, setIsDrawTime] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(18, 0, 0, 0);

      // If it's past 18:00, set target to tomorrow 18:00
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setIsDrawTime(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsDrawTime(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (isDrawTime) {
    return (
      <div className="glass-emerald rounded-xl px-4 py-3 flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-emerald-brand rounded-full animate-ping" />
        <span className="text-sm font-display font-bold text-emerald-brand">Tirage en cours !</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 30;

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${isUrgent ? "glass-gold" : "glass"}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isUrgent ? "bg-gold animate-pulse" : "bg-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">Tirage dans</span>
      </div>
      <div className="flex items-center gap-1.5 font-display font-bold">
        <TimeBlock value={pad(timeLeft.hours)} label="h" />
        <span className={`text-lg ${isUrgent ? "text-gold" : "text-muted-foreground"}`}>:</span>
        <TimeBlock value={pad(timeLeft.minutes)} label="m" />
        <span className={`text-lg ${isUrgent ? "text-gold" : "text-muted-foreground"}`}>:</span>
        <TimeBlock value={pad(timeLeft.seconds)} label="s" urgent={isUrgent} />
      </div>
    </div>
  );
};

const TimeBlock = ({ value, label, urgent }: { value: string; label: string; urgent?: boolean }) => (
  <div className="flex flex-col items-center">
    <span className={`text-lg font-black tabular-nums ${urgent ? "text-gold" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

export default CountdownTimer;
