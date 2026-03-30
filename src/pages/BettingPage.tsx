import { useEffect, useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dices, Zap, AlertCircle, ChevronRight, Sparkles, Plus, Trash2 } from "lucide-react";
import { drawsApi, betsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useSound } from "@/hooks/useSound";
import CountdownTimer from "@/components/CountdownTimer";

// One number + its individual stake
interface BetEntryDraft {
  number: number;
  amount: string; // string for controlled input
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const BettingPage = () => {
  // Map: number → amount string (selected entries)
  const [entries, setEntries] = useState<Record<number, string>>({});
  const { user, balance, refreshBalance } = useAuth();
  const { playBet } = useSound();
  const queryClient = useQueryClient();

  const { data: todayDraw, isLoading: isDrawLoading } = useQuery({
    queryKey: ["todayDrawInfo"],
    queryFn: () => drawsApi.getCurrent(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const prevDrawIdRef = useRef<string | null>(null);
  
  // Reset entries ONLY when switching to a DIFFERENT draw ID (Transition between slots)
  useEffect(() => {
    if (todayDraw?.id && todayDraw.id !== prevDrawIdRef.current) {
      setEntries({});
      prevDrawIdRef.current = todayDraw.id;
    }
  }, [todayDraw?.id]);

  const { data: settings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => drawsApi.getSettings(),
    enabled: !!user,
  });

  const minBet = settings?.min_bet || 100;
  const maxBet = settings?.max_bet || 50000;
  const multiplier = settings?.multiplier || 5;

  // Toggle a number on/off
  const toggleNumber = (num: number) => {
    setEntries(prev => {
      const next = { ...prev };
      if (num in next) {
        delete next[num];
      } else {
        next[num] = String(minBet);
      }
      return next;
    });
  };

  // Update amount for a specific number
  const setAmountForNumber = (num: number, val: string) => {
    setEntries(prev => ({ ...prev, [num]: val }));
  };

  // Apply a quick amount to all selected numbers
  const applyQuickAmountToAll = (val: number) => {
    setEntries(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[Number(k)] = String(val);
      }
      return next;
    });
  };

  const selectedNumbers = useMemo(() => 
    Object.keys(entries).map(Number).sort((a, b) => a - b),
    [entries]
  );
  
  const totalAmount = useMemo(() => {
    return selectedNumbers.reduce((sum, n) => {
      const val = entries[n] || "0";
      const amt = parseFloat(val);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [selectedNumbers, entries]);

  const placeBet = useMutation({
    mutationFn: async () => {
      if (!todayDraw?.id) throw new Error("Tirage introuvable");
      const requestId = crypto.randomUUID(); // Unique ID for idempotency
      const payload = selectedNumbers.map(n => ({
        number: n,
        amount: parseFloat(entries[n] || "0"),
      }));
      return betsApi.placeBet(todayDraw.id, payload, requestId);
    },
    onSuccess: () => {
      playBet();
      const desc = selectedNumbers.map(n => `${n} (${entries[n]} CFA)`).join(", ");
      toast.success(`Pari enregistré !`, {
        description: `Chiffres : ${desc}. Bonne chance !`,
        icon: <Sparkles className="w-4 h-4 text-gold" />,
      });
      setEntries({});
      queryClient.invalidateQueries({ queryKey: ["todayDrawInfo"] });
      queryClient.invalidateQueries({ queryKey: ["myBets"] });
      refreshBalance();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const handleBet = () => {
    if (selectedNumbers.length === 0) {
      toast.error("Sélectionnez au moins un chiffre");
      return;
    }

    for (const num of selectedNumbers) {
      const amt = parseFloat(entries[num] || "0");
      if (isNaN(amt) || amt <= 0) {
        toast.error(`Montant invalide pour le chiffre ${num}`);
        return;
      }
      if (amt < minBet) {
        toast.error(`Mise minimale par chiffre : ${minBet} CFA (chiffre ${num})`);
        return;
      }
      if (amt > maxBet) {
        toast.error(`Mise maximale par chiffre : ${maxBet} CFA (chiffre ${num})`);
        return;
      }
    }

    if (totalAmount > balance) {
      toast.error("Solde insuffisant pour ce pari");
      return;
    }

    if (todayDraw?.status !== "OPEN") {
      toast.error("Les mises sont fermées pour ce tirage");
      return;
    }

    placeBet.mutate();
  };

  const isClosed = !todayDraw || todayDraw.status !== "OPEN";

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6 pb-20">

        {/* Draw Header & Slot Info */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${todayDraw?.status === 'OPEN' ? 'bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20' : 'bg-muted-foreground/30'}`} />
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  {todayDraw?.status === 'OPEN' ? 'Session Ouverte' : 'Session Fermée'}
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                  ID: {todayDraw?.id || 'Chargement...'}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-white/10 text-white/40 uppercase tracking-widest border border-white/5">
                    v1.2.0
                  </span>
                  <span className="w-1 h-1 rounded-full bg- emerald-500/40 animate-pulse" />
                </div>
              </div>
            </div>
            
            {todayDraw?.slotId && (
              <div className="glass-gold px-3.5 py-1.5 rounded-2xl border border-gold/20 flex flex-col items-end shadow-lg shadow-gold/10">
                <span className="text-[10px] font-black text-gold uppercase tracking-tighter">Slot {todayDraw.slotId}</span>
                <span className="text-[8px] font-bold text-gold/60 uppercase">En direct</span>
              </div>
            )}
          </div>
        </div>

        <CountdownTimer endTime={todayDraw?.endTime} status={todayDraw?.status} />
        
        {todayDraw?.status === 'CLOSED' && (
          <div className="glass-card border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="w-10 h-10 rounded-xl glass-emerald flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-brand animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Résolution du tirage...</p>
              <p className="text-[10px] text-muted-foreground">Les résultats seront affichés dans quelques instants.</p>
            </div>
          </div>
        )}

        {/* Closed banner */}
        {isClosed && !isDrawLoading && (
          <div className="glass rounded-xl p-4 border border-destructive/20 bg-destructive/5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">
              {todayDraw ? "Le créneau actuel est fermé. Attendez le prochain tirage !" : "Aucun tirage actif en ce moment."}
            </p>
          </div>
        )}

        {/* Balance */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between highlight-top">
          <span className="text-sm text-muted-foreground">Solde disponible</span>
          <span className="font-display font-bold text-lg text-gold">{(balance ?? 0).toLocaleString("fr-FR")} CFA</span>
        </div>

        {/* Number grid — toggle on/off */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Choisir les chiffres
            </label>
            {selectedNumbers.length > 0 && (
              <button
                onClick={() => setEntries({})}
                className="text-xs text-destructive hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Tout effacer
              </button>
            )}
          </div>
          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
              const isSelected = n in entries;
              return (
                <button
                  key={n}
                  onClick={() => !isClosed && toggleNumber(n)}
                  disabled={isClosed}
                  className={`number-badge relative transition-all duration-300 ${
                    isSelected ? "number-badge-active" : "number-badge-idle"
                  } ${isClosed ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {n}
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gold rounded-full border-2 border-background animate-ping opacity-75" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedNumbers.length === 0
              ? "Appuyez sur un chiffre pour le sélectionner."
              : `${selectedNumbers.length} chiffre${selectedNumbers.length > 1 ? "s" : ""} sélectionné${selectedNumbers.length > 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Per-number amount inputs */}
        {selectedNumbers.length > 0 && !isClosed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Mise par chiffre
              </label>
              {/* Quick amounts applied to ALL selected numbers */}
              <div className="flex gap-1.5">
                {QUICK_AMOUNTS.filter(v => v >= minBet).map(v => (
                  <button
                    key={v}
                    onClick={() => applyQuickAmountToAll(v)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {selectedNumbers.map(num => {
                const amt = parseFloat(entries[num] || "0");
                const gain = isNaN(amt) ? 0 : amt * multiplier;
                return (
                  <div
                    key={num}
                    className="glass-card rounded-xl p-3 border border-white/5 flex items-center gap-3"
                  >
                    {/* Number badge */}
                    <div className="w-9 h-9 rounded-xl glass-gold flex items-center justify-center font-display font-black text-gold flex-shrink-0">
                      {num}
                    </div>

                    {/* Amount input */}
                    <div className="flex-1">
                      <input
                        type="number"
                        value={entries[num]}
                        onChange={e => setAmountForNumber(num, e.target.value)}
                        min={minBet}
                        max={maxBet}
                        placeholder={`Min ${minBet}`}
                        className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm font-display text-foreground focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Potential gain */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">Gain</p>
                      <p className="text-sm font-black text-emerald-400">
                        {gain > 0 ? `+${gain.toLocaleString("fr-FR")}` : "—"}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => toggleNumber(num)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedNumbers.length > 0 && totalAmount > 0 && (
          <div className="glass-gold rounded-xl p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              Récapitulatif
            </p>
            {selectedNumbers.map(num => {
              const amtStr = entries[num] || "0";
              const amt = parseFloat(amtStr);
              return (
                <div key={num} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Chiffre {num}</span>
                  <span className="font-medium">
                    {isNaN(amt) ? "—" : amt.toLocaleString("fr-FR")} CFA
                    {!isNaN(amt) && amt > 0 && (
                      <span className="ml-2 text-emerald-400 font-bold">
                        → x{multiplier} = {(amt * multiplier).toLocaleString("fr-FR")} CFA
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-gold/15 pt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-bold">Total misé</span>
              <span className="font-display font-black text-gold text-lg">
                {totalAmount.toLocaleString("fr-FR")} CFA
              </span>
            </div>
            {totalAmount > balance && (
              <p className="text-xs text-destructive font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Solde insuffisant
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleBet}
          disabled={selectedNumbers.length === 0 || totalAmount <= 0 || placeBet.isPending || isClosed || totalAmount > balance}
          className="w-full gradient-gold text-primary-foreground font-display font-bold text-base h-14 rounded-2xl glow-gold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {placeBet.isPending ? (
            <>
              <Dices className="w-5 h-5 mr-2 animate-spin" /> Envoi en cours...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Valider le Pari
              {selectedNumbers.length > 0 && ` (${selectedNumbers.length} chiffre${selectedNumbers.length > 1 ? "s" : ""})`}
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Debug UI (Temporary as requested) */}
        {todayDraw && (
          <div className="mt-10 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[9px] text-muted-foreground space-y-1">
            <p className="text-gold font-bold uppercase mb-1">Debug Info (Current Slot)</p>
            <p>ID: {todayDraw.id}</p>
            <p>Start: {new Date(todayDraw.startTime).toLocaleString()}</p>
            <p>End: {new Date(todayDraw.endTime).toLocaleString()}</p>
            <p>Status: {todayDraw.status}</p>
            <p>Slot: {todayDraw.slotId}</p>
            <p>Now: {new Date().toLocaleString()}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BettingPage;
