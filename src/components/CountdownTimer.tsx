import { useState, useEffect } from "react";

/**
 * CountdownTimer
 * Shows time remaining until the draw's specific endTime.
 */
interface Props {
  endTime?: string;
  status?: string;
}

const CountdownTimer = ({ endTime, status }: Props) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!endTime || status !== 'OPEN') {
      setTimeLeft(null);
      return;
    }

    const calculate = () => {
      const now = new Date();
      const target = new Date(endTime);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  if (status !== 'OPEN' || !timeLeft) {
    return (
      <div className="glass-emerald rounded-xl px-4 py-3 flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-emerald-brand rounded-full" />
        <span className="text-sm font-display font-bold text-emerald-brand">
          Tirage {status === 'CLOSED' ? 'en cours de résolution...' : 'terminé'}
        </span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 15;

  return (
    <div className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-3 transition-all duration-500 shadow-xl ${isUrgent ? "glass-gold border-gold/30 animate-pulse-slow" : "glass border-white/5"}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${isUrgent ? "bg-gold animate-pulse" : "bg-muted-foreground/40"}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? "text-gold" : "text-muted-foreground"}`}>
          {isUrgent ? 'Fermeture Imminente' : 'Temps restant'}
        </span>
      </div>
      <div className="flex items-center gap-2 font-display font-black">
        <TimeBlock value={pad(timeLeft.hours)} label="h" urgent={isUrgent} />
        <span className={`text-xl -mt-1 ${isUrgent ? "text-gold/50" : "text-muted-foreground/30"}`}>:</span>
        <TimeBlock value={pad(timeLeft.minutes)} label="m" urgent={isUrgent} />
        <span className={`text-xl -mt-1 ${isUrgent ? "text-gold/50" : "text-muted-foreground/30"}`}>:</span>
        <TimeBlock value={pad(timeLeft.seconds)} label="s" urgent={isUrgent} />
      </div>
    </div>
  );
};

const TimeBlock = ({ value, urgent }: { value: string; label: string; urgent?: boolean }) => (
  <div className="flex flex-col items-center">
    <span className={`text-lg font-black tabular-nums ${urgent ? "text-gold" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

export default CountdownTimer;
