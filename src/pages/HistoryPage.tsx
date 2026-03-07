import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { History, Dices, Trophy, Clock } from "lucide-react";
import { betsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useSound } from "@/hooks/useSound";
import { toast } from "sonner";

const statusConfig = {
  pending: {
    label: "En attente",
    badgeClass: "bg-amber-500/15 text-amber-400",
    rowClass: "border-amber-500/10",
  },
  won: {
    label: "🏆 Gagné",
    badgeClass: "bg-emerald-500/15 text-emerald-400",
    rowClass: "border-emerald-500/15",
  },
  lost: {
    label: "Perdu",
    badgeClass: "bg-destructive/15 text-destructive",
    rowClass: "border-border",
  },
};

const HistoryPage = () => {
  const { user } = useAuth();

  const { data: bets = [], isLoading, error } = useQuery({
    queryKey: ["myBets"],
    queryFn: () => betsApi.getMyBets(),
    enabled: !!user,
  });

  const { playWin, playLose } = useSound();

  useEffect(() => {
    if (error) toast.error("Erreur de chargement de l'historique");
  }, [error]);

  useEffect(() => {
    if (!bets || bets.length === 0) return;
    
    // Auto-play sound for the latest bet if it just got resolved
    const latestBet = bets[0];
    if (latestBet.status !== 'pending') {
      const storageKey = `bet_sound_played_${latestBet.id}`;
      const alreadyPlayed = localStorage.getItem(storageKey);
      
      if (!alreadyPlayed) {
        if (latestBet.status === 'won') playWin();
        else if (latestBet.status === 'lost') playLose();
        
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [bets, playWin, playLose]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
            <History className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Historique</h1>
            <p className="text-xs text-muted-foreground">{bets.length} paris enregistrés</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
        ) : bets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center space-y-3">
            <Dices className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground text-sm">Vous n'avez pas encore parié.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(bets) && bets.map((bet: any) => {
              const cfg = statusConfig[bet.status as keyof typeof statusConfig] || statusConfig.pending;
              const isWon = bet.status === "won";
              return (
                <div
                  key={bet.id}
                  className={`glass-card rounded-xl px-4 py-4 flex items-center justify-between border ${cfg.rowClass} transition-all duration-200 hover:border-white/10`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Number badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display text-xl font-bold flex-shrink-0 ${
                      isWon ? "gradient-gold glow-gold text-primary-foreground" : "glass text-foreground"
                    }`}>
                      {bet.number}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {Number(bet.amount).toLocaleString("fr-FR")} CFA misés
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(bet.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                    {isWon && (
                      <p className="text-emerald-brand text-sm font-display font-bold mt-1">
                        +{Number(bet.payout).toLocaleString("fr-FR")} CFA
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
