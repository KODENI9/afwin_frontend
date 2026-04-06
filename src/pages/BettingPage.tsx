import { useEffect, useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dices, Zap, AlertCircle, ChevronRight, Sparkles, Trash2, Timer, X } from "lucide-react";
import { drawsApi, betsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useSound } from "@/hooks/useSound";
import CountdownTimer from "@/components/CountdownTimer";
import { flashApi } from "@/services/api";

interface BetEntryDraft {
  number: number;
  amount: string;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const generateUUID = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ─── Compte à rebours Flash ───────────────────────────────────────────────────
const FlashCountdown = ({ endTime }: { endTime: string }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
      setRemaining(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span className="font-mono font-black tabular-nums text-white">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
};

// ─── Bandeau Flash Draw ───────────────────────────────────────────────────────
const FlashBanner = ({
  flash,
  onBetOnFlash,
  onDismiss,
}: {
  flash: any;
  onBetOnFlash: () => void;
  onDismiss: () => void;
}) => {
  const remaining = Math.max(0, new Date(flash.endTime).getTime() - Date.now());
  const isUrgent = remaining < 60000; // moins d'1 minute

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${
        isUrgent
          ? "bg-red-500/10 border-red-500/40 animate-pulse"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${
            isUrgent ? "bg-red-500" : "bg-amber-400"
          }`}
        />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icône Flash animée */}
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isUrgent ? "bg-red-500/20" : "bg-amber-500/20"
            }`}
          >
            <Zap
              className={`w-5 h-5 ${isUrgent ? "text-red-400 animate-bounce" : "text-amber-400 animate-pulse"}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isUrgent
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                ⚡ Flash Draw
              </span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase">
                x{flash.multiplier} multiplicateur
              </span>
            </div>
            <p className="text-sm font-black text-foreground truncate mt-0.5">
              {flash.label}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Timer className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {isUrgent ? "Dernières secondes !" : "Temps restant :"}
              </span>
              <FlashCountdown endTime={flash.endTime} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onBetOnFlash}
            className={`h-9 px-4 font-black text-[10px] uppercase tracking-widest rounded-xl ${
              isUrgent
                ? "bg-red-500 hover:bg-red-400 text-white"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            Miser
          </Button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};



// ─── Page principale ──────────────────────────────────────────────────────────
const BettingPage = () => {
  const [entries, setEntries] = useState<Record<number, string>>({});
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [bettingOnFlash, setBettingOnFlash] = useState(false);
  const { user, balance, refreshBalance } = useAuth();
  const { playBet } = useSound();
  const queryClient = useQueryClient();

  // Draw normal
  const { data: todayDraw, isLoading: isDrawLoading } = useQuery({
    queryKey: ["todayDrawInfo"],
    queryFn: () => drawsApi.getCurrent(),
    refetchInterval: 30000,
  });

  // Flash Draw actif
  const { data: activeFlash } = useQuery({
  queryKey: ["activeFlash"],
  queryFn: () => flashApi.getActive(),
  refetchInterval: 15000,
  enabled: !!user,
  });
  
  const prevDrawIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (todayDraw?.id && todayDraw.id !== prevDrawIdRef.current) {
      setEntries({});
      prevDrawIdRef.current = todayDraw.id;
    }
  }, [todayDraw?.id]);

  // Quand on switch vers Flash, reset le dismiss
  useEffect(() => {
    if (activeFlash?.id) setFlashDismissed(false);
  }, [activeFlash?.id]);

  const { data: settings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => drawsApi.getSettings(),
    enabled: !!user,
  });

  const minBet = settings?.min_bet || 100;
  const maxBet = settings?.max_bet || 50000;

  // Le draw actif = Flash si on mise dessus, sinon draw normal
  const activeDraw = bettingOnFlash && activeFlash ? activeFlash : todayDraw;
  const multiplier = bettingOnFlash && activeFlash
    ? activeFlash.multiplier
    : settings?.multiplier || 5;

  const toggleNumber = (num: number) => {
    setEntries(prev => {
      const next = { ...prev };
      if (num in next) delete next[num];
      else next[num] = String(minBet);
      return next;
    });
  };

  const setAmountForNumber = (num: number, val: string) => {
    setEntries(prev => ({ ...prev, [num]: val }));
  };

  const applyQuickAmountToAll = (val: number) => {
    setEntries(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[Number(k)] = String(val);
      return next;
    });
  };

  const selectedNumbers = useMemo(
    () => Object.keys(entries).map(Number).sort((a, b) => a - b),
    [entries]
  );

  const totalAmount = useMemo(() => {
    return selectedNumbers.reduce((sum, n) => {
      const amt = parseFloat(entries[n] || "0");
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [selectedNumbers, entries]);

  const placeBet = useMutation({
    mutationFn: async () => {
      const drawId = activeDraw?.id;
      if (!drawId) throw new Error("Tirage introuvable");
      const requestId = generateUUID();
      const payload = selectedNumbers.map(n => ({
        number: n,
        amount: parseFloat(entries[n] || "0"),
      }));
      return betsApi.placeBet(drawId, payload, requestId);
    },
    onSuccess: () => {
      playBet();
      const desc = selectedNumbers.map(n => `${n} (${entries[n]} CFA)`).join(", ");
      toast.success(bettingOnFlash ? "⚡ Pari Flash enregistré !" : "Pari enregistré !", {
        description: `Chiffres : ${desc}. Bonne chance !`,
        icon: <Sparkles className="w-4 h-4 text-gold" />,
      });
      setEntries({});
      setBettingOnFlash(false);
      queryClient.invalidateQueries({ queryKey: ["todayDrawInfo"] });
      queryClient.invalidateQueries({ queryKey: ["activeFlash"] });
      queryClient.invalidateQueries({ queryKey: ["myBets"] });
      refreshBalance();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const handleBet = () => {
    if (selectedNumbers.length === 0) return toast.error("Sélectionnez au moins un chiffre");
    for (const num of selectedNumbers) {
      const amt = parseFloat(entries[num] || "0");
      if (isNaN(amt) || amt <= 0) return toast.error(`Montant invalide pour le chiffre ${num}`);
      if (amt < minBet) return toast.error(`Mise minimale : ${minBet} CFA (chiffre ${num})`);
      if (amt > maxBet) return toast.error(`Mise maximale : ${maxBet} CFA (chiffre ${num})`);
    }
    if (totalAmount > balance) return toast.error("Solde insuffisant");
    if (activeDraw?.status !== "OPEN") return toast.error("Les mises sont fermées");
    placeBet.mutate();
  };

  const isClosed = !activeDraw || activeDraw.status !== "OPEN";
  const showFlashBanner = activeFlash && !flashDismissed && !bettingOnFlash;

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6 pb-20">

        {/* ── Bandeau Flash Draw ── */}
        {showFlashBanner && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <FlashBanner
              flash={activeFlash}
              onBetOnFlash={() => {
                setBettingOnFlash(true);
                setEntries({});
                toast.info(`⚡ Mode Flash activé — x${activeFlash.multiplier} !`);
              }}
              onDismiss={() => setFlashDismissed(true)}
            />
          </div>
        )}

        {/* ── Mode Flash actif ── */}
        {bettingOnFlash && activeFlash && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    ⚡ Mode Flash — x{activeFlash.multiplier}
                  </p>
                  <p className="text-sm font-bold text-foreground">{activeFlash.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <FlashCountdown endTime={activeFlash.endTime} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setBettingOnFlash(false); setEntries({}); }}
                className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest border border-white/10 rounded-lg px-2 py-1.5 transition-colors"
              >
                Normal
              </button>
            </div>
          </div>
        )}

        {/* ── Header Draw ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${
                activeDraw?.status === "OPEN"
                  ? "bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20"
                  : "bg-muted-foreground/30"
              }`} />
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  {bettingOnFlash ? "⚡ Flash Draw" : activeDraw?.status === "OPEN" ? "Session Ouverte" : "Session Fermée"}
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                  ID: {activeDraw?.id || "Chargement..."}
                </p>
              </div>
            </div>
            {!bettingOnFlash && todayDraw?.slotId && (
              <div className="glass-gold px-3.5 py-1.5 rounded-2xl border border-gold/20 flex flex-col items-end shadow-lg shadow-gold/10">
                <span className="text-[10px] font-black text-gold uppercase tracking-tighter">Slot {todayDraw.slotId}</span>
                <span className="text-[8px] font-bold text-gold/60 uppercase">En direct</span>
              </div>
            )}
          </div>
        </div>

        {!bettingOnFlash && (
          <CountdownTimer endTime={todayDraw?.endTime} status={todayDraw?.status} />
        )}

        {activeDraw?.status === "CLOSED" && (
          <div className="glass-card border-emerald-500/20 bg-emerald-500/5 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-emerald flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-brand animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Résolution du tirage...</p>
              <p className="text-[10px] text-muted-foreground">Les résultats seront affichés dans quelques instants.</p>
            </div>
          </div>
        )}

        {isClosed && !isDrawLoading && !bettingOnFlash && (
          <div className="glass rounded-xl p-4 border border-destructive/20 bg-destructive/5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">
              {todayDraw ? "Le créneau actuel est fermé. Attendez le prochain tirage !" : "Aucun tirage actif en ce moment."}
            </p>
          </div>
        )}

        {/* ── Solde ── */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between highlight-top">
          <span className="text-sm text-muted-foreground">Solde disponible</span>
          <span className="font-display font-bold text-lg text-gold">{(balance ?? 0).toLocaleString("fr-FR")} CFA</span>
        </div>

        {/* ── Grille de chiffres ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Choisir les chiffres
            </label>
            {selectedNumbers.length > 0 && (
              <button onClick={() => setEntries({})}
                className="text-xs text-destructive hover:opacity-80 transition-opacity flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Tout effacer
              </button>
            )}
          </div>
          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
              const isSelected = n in entries;
              return (
                <button key={n} onClick={() => !isClosed && toggleNumber(n)}
                  disabled={isClosed}
                  className={`number-badge relative transition-all duration-300 ${
                    isSelected ? "number-badge-active" : "number-badge-idle"
                  } ${isClosed ? "opacity-40 cursor-not-allowed" : ""}`}>
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

        {/* ── Mise par chiffre ── */}
        {selectedNumbers.length > 0 && !isClosed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Mise par chiffre
              </label>
              <div className="flex gap-1.5">
                {QUICK_AMOUNTS.filter(v => v >= minBet).map(v => (
                  <button key={v} onClick={() => applyQuickAmountToAll(v)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground">
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
                  <div key={num} className="glass-card rounded-xl p-3 border border-white/5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black flex-shrink-0 ${
                      bettingOnFlash ? "bg-amber-500/20 text-amber-400" : "glass-gold text-gold"
                    }`}>
                      {num}
                    </div>
                    <div className="flex-1">
                      <input type="number" value={entries[num]}
                        onChange={e => setAmountForNumber(num, e.target.value)}
                        min={minBet} max={maxBet} placeholder={`Min ${minBet}`}
                        className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm font-display text-foreground focus:border-gold/50 outline-none transition-colors" />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">Gain</p>
                      <p className="text-sm font-black text-emerald-400">
                        {gain > 0 ? `+${gain.toLocaleString("fr-FR")}` : "—"}
                      </p>
                    </div>
                    <button onClick={() => toggleNumber(num)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Récapitulatif ── */}
        {selectedNumbers.length > 0 && totalAmount > 0 && (
          <div className={`rounded-xl p-4 space-y-2 ${bettingOnFlash ? "bg-amber-500/10 border border-amber-500/20" : "glass-gold"}`}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              {bettingOnFlash ? "⚡ Récapitulatif Flash" : "Récapitulatif"}
            </p>
            {selectedNumbers.map(num => {
              const amt = parseFloat(entries[num] || "0");
              return (
                <div key={num} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Chiffre {num}</span>
                  <span className="font-medium">
                    {isNaN(amt) ? "—" : amt.toLocaleString("fr-FR")} CFA
                    {!isNaN(amt) && amt > 0 && (
                      <span className={`ml-2 font-bold ${bettingOnFlash ? "text-amber-400" : "text-emerald-400"}`}>
                        → x{multiplier} = {(amt * multiplier).toLocaleString("fr-FR")} CFA
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-gold/15 pt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-bold">Total misé</span>
              <span className={`font-display font-black text-lg ${bettingOnFlash ? "text-amber-400" : "text-gold"}`}>
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

        {/* ── Bouton Valider ── */}
        <Button
          onClick={handleBet}
          disabled={selectedNumbers.length === 0 || totalAmount <= 0 || placeBet.isPending || isClosed || totalAmount > balance}
          className={`w-full font-display font-bold text-base h-14 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden ${
            bettingOnFlash
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "gradient-gold text-primary-foreground glow-gold hover:opacity-90"
          }`}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {placeBet.isPending ? (
            <><Dices className="w-5 h-5 mr-2 animate-spin" /> Envoi en cours...</>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              {bettingOnFlash ? "⚡ Valider le Pari Flash" : "Valider le Pari"}
              {selectedNumbers.length > 0 && ` (${selectedNumbers.length} chiffre${selectedNumbers.length > 1 ? "s" : ""})`}
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </Layout>
  );
};

export default BettingPage;