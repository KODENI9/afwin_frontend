import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, limit,
  onSnapshot, doc
} from "firebase/firestore";
import { Dices, Zap, Users, Trophy, LogIn, Timer } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { drawsApi } from "@/services/api";
import DrawAnimation from "@/components/DrawAnimation";

// ─── Compte à rebours ─────────────────────────────────────────────────────────
const Countdown = ({ endTime, status }: { endTime: string; status: string }) => {
  const [rem, setRem] = useState(0);

  useEffect(() => {
    if (status !== 'OPEN') {
      setRem(0);
      return;
    }
    const update = () => setRem(Math.max(0, new Date(endTime).getTime() - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime, status]);

  if (status !== 'OPEN' || rem <= 0) {
    return (
      <div className="glass-emerald rounded-2xl p-4 text-center border border-emerald-500/20">
        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tirage en cours de résolution...
        </p>
      </div>
    );
  }

  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);

  return (
    <div className="flex items-center gap-2 justify-center">
      {h > 0 && (
        <>
          <div className="glass-card rounded-xl px-3 py-2 text-center min-w-[52px]">
            <p className="font-mono font-black text-2xl text-gold">{String(h).padStart(2,"0")}</p>
            <p className="text-[8px] text-muted-foreground uppercase font-bold">h</p>
          </div>
          <span className="text-gold font-black text-xl">:</span>
        </>
      )}
      <div className="glass-card rounded-xl px-3 py-2 text-center min-w-[52px]">
        <p className="font-mono font-black text-2xl text-gold">{String(m).padStart(2,"0")}</p>
        <p className="text-[8px] text-muted-foreground uppercase font-bold">min</p>
      </div>
      <span className="text-gold font-black text-xl">:</span>
      <div className="glass-card rounded-xl px-3 py-2 text-center min-w-[52px]">
        <p className="font-mono font-black text-2xl text-gold">{String(s).padStart(2,"0")}</p>
        <p className="text-[8px] text-muted-foreground uppercase font-bold">sec</p>
      </div>
    </div>
  );
};

// ─── Barre de mise anonymisée ─────────────────────────────────────────────────
const BetBar = ({ number, total, maxTotal, isMin }: {
  number: number; total: number; maxTotal: number; isMin: boolean;
}) => {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
        isMin ? "gradient-gold text-background" : "bg-white/5 text-muted-foreground"
      }`}>
        {number}
      </div>
      <div className="flex-1 relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
            isMin ? "bg-gold" : "bg-white/20"
          }`}
          style={{ width: `${Math.max(pct, total > 0 ? 3 : 0)}%` }}
        />
      </div>
      <div className="text-right shrink-0 w-20">
        {total > 0 ? (
          <p className={`text-xs font-black tabular-nums ${isMin ? "text-gold" : "text-muted-foreground"}`}>
            {Number(total).toLocaleString("fr-FR")} CFA
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/30 font-bold">—</p>
        )}
      </div>
    </div>
  );
};

// ─── Page spectateur ──────────────────────────────────────────────────────────
const LiveSpectatorPage = () => {
  const [draw, setDraw] = useState<any>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const lastResolvedId = useRef<string | null>(null);

  // 1. Charger et synchroniser le tirage via l'API publique
  useEffect(() => {
    let unsubDraw: any = null;

    const init = async () => {
      try {
        const live = await drawsApi.getLive();
        if (live && live.id) {
          // Une fois l'ID obtenu, on écoute ce tirage spécifique en temps réel
          unsubDraw = onSnapshot(doc(db, "draws", live.id), (docSnap) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() } as any;
              setDraw(data);

              // Déclencher l'animation si résolu
              if (data.status === 'RESOLVED' && data.winningNumber && data.id !== lastResolvedId.current) {
                setShowAnimation(true);
                lastResolvedId.current = data.id;
              }
            } else {
              setDraw(null);
            }
          });
        } else {
          setDraw(null);
        }
      } catch (err) {
        console.error("Live fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // Refresh toutes les 30s pour changer de tirage si besoin
    const refreshId = setInterval(init, 30000); 

    return () => {
      if (unsubDraw) unsubDraw();
      clearInterval(refreshId);
    };
  }, []);

  // 2. Réactions en temps réel
  useEffect(() => {
    if (!draw?.id) return;
    const q = query(collection(db, "chat_reactions"), where("draw_id", "==", draw.id));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, number> = {};
      snap.docs.forEach(d => { const data = d.data(); map[data.emoji] = data.count || 0; });
      setReactions(map);
    });
    return () => unsub();
  }, [draw?.id]);

  // 3. Messages récents
  useEffect(() => {
    if (!draw?.id) return;
    const q = query(
      collection(db, "chat_messages"),
      where("draw_id", "==", draw.id),
      where("deleted", "==", false),
      orderBy("created_at", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
    });
    return () => unsub();
  }, [draw?.id]);

  // Calcul des barres
  const totals = draw?.snapshotTotals || draw?.totalsByNumber || {};
  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
  const maxTotal = Math.max(...numbers.map(n => Number(totals[n]) || 0), 1);
  const minTotal = Math.min(...numbers.map(n => Number(totals[n]) || 0));
  const totalReactions = Object.values(reactions).reduce((s, v) => s + (v as number), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DrawAnimation 
        isVisible={showAnimation} 
        winningNumber={draw?.winningNumber} 
        onClose={() => setShowAnimation(false)} 
      />
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center glow-gold">
              <Dices className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold gradient-text-gold tracking-wider">AF-WIN</span>
          </Link>

          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Mode Spectateur
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-gold text-[10px] font-black uppercase tracking-widest text-background">
              <LogIn className="w-3 h-3" /> Jouer
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto py-6 space-y-6 pb-20">

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Synchronisation avec le tirage...</p>
          </div>
        )}

        {!loading && !draw && (
          <div className="glass-card rounded-3xl p-12 text-center space-y-4 border border-white/5">
            <Dices className="w-12 h-12 text-muted-foreground/20 mx-auto" />
            <p className="font-display text-lg font-bold text-muted-foreground">Aucun tirage en cours</p>
            <p className="text-xs text-muted-foreground opacity-60">
              Les tirages ont lieu plusieurs fois par jour. Revenez bientôt !
            </p>
            <Link to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl gradient-gold text-sm font-black uppercase tracking-widest text-background mt-2">
              <LogIn className="w-4 h-4" /> Créer un compte gratuit
            </Link>
          </div>
        )}

        {!loading && draw && (
          <>
            {/* Status + slot */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  draw.status === "OPEN" ? "bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20" : "bg-amber-500"
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {draw.status === "OPEN" ? "Session Ouverte" : "Session Fermée"}
                </span>
              </div>
              {draw.slotId && (
                <div className="glass-gold px-3 py-1 rounded-xl border border-gold/20">
                  <span className="text-[9px] font-black text-gold uppercase tracking-tighter">Slot {draw.slotId}</span>
                </div>
              )}
            </div>

            {/* Compte à rebours */}
            <div className="glass-card rounded-2xl p-5 text-center space-y-3 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5">
                <Timer className="w-3 h-3" /> État du Tirage
              </p>
              <Countdown endTime={draw.endTime} status={draw.status} />
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Pool total</p>
                <p className="text-sm font-black font-display text-gold">
                  {Number(draw.totalPool || 0).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Multiplicateur</p>
                <p className="text-sm font-black font-display text-foreground">
                  x{draw.multiplier || 5}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Dernière mise</p>
                <p className="text-sm font-black font-display text-emerald-400">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Répartition des mises — anonymisée */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Volume des mises en direct
                </p>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground font-bold">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  Chiffre en tête
                </div>
              </div>
              <div className="space-y-2.5">
                {numbers.map(n => (
                  <BetBar
                    key={n}
                    number={n}
                    total={Number(totals[n]) || 0}
                    maxTotal={maxTotal}
                    isMin={(Number(totals[n]) || 0) === minTotal && minTotal > 0}
                  />
                ))}
              </div>
            </div>

            {/* Réactions live */}
            {Object.keys(reactions).length > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Réactions des joueurs ({totalReactions})
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reactions)
                    .filter(([, count]) => (count as number) > 0)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([emoji, count]) => (
                      <div key={emoji}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-base">{emoji}</span>
                        <span className="text-xs font-black text-muted-foreground tabular-nums">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Aperçu chat (lecture seule) */}
            {recentMessages.length > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Discussion en cours
                </p>
                <div className="space-y-2">
                  {recentMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0">
                        {msg.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-gold">{msg.display_name} </span>
                        <span className="text-xs text-foreground">{msg.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA inscription */}
            <div className="glass-card rounded-2xl p-6 border border-gold/20 bg-gold/5 text-center space-y-4">
              <p className="font-display font-bold text-foreground">Vous aussi, tentez votre chance !</p>
              <p className="text-xs text-muted-foreground">
                Inscrivez-vous pour commencer à miser et gagner jusqu'à x{draw.multiplier || 5} votre mise.
              </p>
              <Link to="/auth"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl gradient-gold text-sm font-black uppercase tracking-widest text-background glow-gold hover:scale-105 transition-all">
                <Zap className="w-4 h-4" /> Rejoindre l'aventure
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LiveSpectatorPage;