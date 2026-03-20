import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Trophy, CalendarDays, Sparkles } from "lucide-react";
import { drawsApi, betsApi } from "@/services/api";
import { toast } from "sonner";
import { fireWinConfetti } from "@/components/ConfettiEffect";
import CountUp from "@/components/CountUp";

const ResultsPage = () => {
  const { data: draws = [], isLoading, error } = useQuery({
    queryKey: ["draws"],
    queryFn: () => drawsApi.getHistory(),
  });

  const { data: myBets = [] } = useQuery({
    queryKey: ["myBets"],
    queryFn: () => betsApi.getMyBets(),
  });

  useEffect(() => {
    if (error) toast.error("Erreur de chargement des résultats");
  }, [error]);

  // Find the latest resolved
  const drawnResults = Array.isArray(draws) ? draws.filter((d: any) => d.status === "RESOLVED") : [];
  const latest = drawnResults[0];
  const previous = drawnResults.slice(1);

  // Check if current user is a winner
  const winningBet = latest 
    ? myBets.find((b: any) => b.draw_id === latest.id && b.status === "won")
    : null;

  useEffect(() => {
    if (winningBet) {
      fireWinConfetti();
    }
  }, [winningBet?.id]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Résultats</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
        ) : !latest ? (
          <div className="glass rounded-2xl p-12 text-center space-y-3">
            <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground text-sm">Aucun tirage terminé pour le moment.</p>
            <p className="text-muted-foreground/50 text-xs">Revenez après le tirage de 18h.</p>
          </div>
        ) : (
          <>
            {/* Featured result */}
            <div className={`relative glass-card rounded-3xl p-8 text-center overflow-hidden highlight-top ${winningBet ? 'border-gold/50 glow-gold-strong' : ''}`}>
              {/* Glow orb */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gold/8 blur-[50px] pointer-events-none" />

              {winningBet && (
                <div className="mb-6 animate-bounce">
                  <span className="bg-gold/20 text-gold text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-gold/30">
                    Vous avez gagné ! 🏆
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest mb-4">
                <CalendarDays className="w-3.5 h-3.5" />
                {latest.draw_date}
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Chiffre Gagnant</p>

              {/* Number */}
              <div className="relative inline-flex mb-4">
                <div className="w-28 h-28 mx-auto rounded-3xl gradient-gold flex items-center justify-center glow-gold-strong animate-float">
                  <span className="font-display text-6xl font-black text-primary-foreground">
                    {latest.winningNumber ?? "?"}
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full glass-gold flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
              </div>

              {winningBet && (
                <div className="space-y-1 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Votre gain</p>
                  <p className="text-3xl font-display font-black text-gold">
                    <CountUp end={winningBet.payout} suffix=" CFA" />
                  </p>
                </div>
              )}
            </div>

            {/* Previous results */}
            
            {previous.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-xs uppercase tracking-widest text-muted-foreground pt-1">
                  Tirages précédents
                </h2>
                <div className="space-y-2">
                  {Array.isArray(previous) && previous.map((result: any) => (
                    <div key={result.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/10 transition-all duration-200">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {result.draw_date}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center font-display text-lg font-bold text-gold">
                          {result.winningNumber ?? "?"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ResultsPage;
