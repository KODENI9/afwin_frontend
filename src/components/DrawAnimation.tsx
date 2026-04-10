import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, Trophy, Sparkles } from "lucide-react";
import { useSound } from "@/hooks/useSound";

interface Props {
  winningNumber: number | null;
  isVisible: boolean;
  onClose: () => void;
}

const DrawAnimation = ({ winningNumber, isVisible, onClose }: Props) => {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const { playRoll, playWin, playTick } = useSound();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");

  useEffect(() => {
    if (isVisible && winningNumber !== null) {
      startAnimation();
    }
  }, [isVisible, winningNumber]);

  const startAnimation = async () => {
    setPhase("spinning");
    playRoll();
    
    // Simuler le défilement pendant 4 secondes
    const duration = 4000;
    const startTime = Date.now();
    
    const intervalId = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 9) + 1);
      playTick();
    }, 100);

    setTimeout(() => {
      clearInterval(intervalId);
      setDisplayNumber(winningNumber);
      setPhase("result");
      playWin();
      
      // Fermer automatiquement après 5 secondes d'affichage du résultat
      setTimeout(onClose, 6000);
    }, duration);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      >
        <div className="relative max-w-sm w-full p-8 text-center space-y-8">
          
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center animate-pulse">
                <Zap className="w-6 h-6 text-gold" />
              </div>
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-gold italic">
              Résolution en cours...
            </h2>
          </motion.div>

          {/* Slot Machine Display */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl shadow-gold/20">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
            
            <motion.div
              key={displayNumber}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`text-9xl font-black font-display pointer-events-none ${
                phase === "result" ? "text-gold glow-gold-strong" : "text-white/20 blur-[2px]"
              }`}
            >
              {displayNumber || "?"}
            </motion.div>

            {/* Decorations */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-gold/40 rounded-full z-20" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-gold/40 rounded-full z-20" />
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            {phase === "result" ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-lg">
                  <Trophy className="w-6 h-6" /> Le gagnant est le {winningNumber} ! <Trophy className="w-6 h-6" />
                </div>
                <div className="flex justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold animate-bounce" />
                  <p className="text-xs text-muted-foreground uppercase font-bold">Consultez votre balance</p>
                  <Sparkles className="w-4 h-4 text-gold animate-bounce" />
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground italic animate-pulse">
                Le destin est en train de choisir...
              </p>
            )}
          </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DrawAnimation;
