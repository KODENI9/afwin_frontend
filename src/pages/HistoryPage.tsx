import { useState, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { History, Dices, Trophy, Clock, ArrowDownRight, Wallet, Loader2, Calendar as CalendarIcon, Filter, Zap, Sparkles, TrendingUp, Target, Star } from "lucide-react";
import { betsApi, profileApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from "recharts";

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING: {
    label: "En attente",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    glowClass: "shadow-amber-500/10",
    cardClass: "glass border-amber-500/10",
    icon: Clock,
  },
  WON: {
    label: "Gagné",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    glowClass: "glow-emerald",
    cardClass: "glass-emerald border-emerald-500/20",
    icon: Trophy,
  },
  LOST: {
    label: "Perdu",
    badgeClass: "bg-ruby/10 text-ruby border-ruby/20",
    glowClass: "glow-ruby",
    cardClass: "glass-ruby border-ruby/20",
    icon: ArrowDownRight,
  },
};

// ─── Tooltip custom pour les graphiques ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2 border border-white/10 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-black">
          {p.name}: {Number(p.value).toLocaleString("fr-FR")} CFA
        </p>
      ))}
    </div>
  );
};

// ─── Composant graphiques de performance ─────────────────────────────────────
const PerformanceCharts = ({ groups }: { groups: any[] }) => {
  const [activeChart, setActiveChart] = useState<"curve" | "numbers" | "rate">("curve");

  // 1. Données courbe gains/pertes dans le temps
  const curveData = useMemo(() => {
    return [...groups]
      .filter(g => g.status === "RESOLVED")
      .reverse()
      .map((g, idx) => ({
        label: `T${idx + 1}`,
        date: g.date ? format(new Date(g.date), "dd/MM") : `#${idx + 1}`,
        mise: g.totalBetAmount || 0,
        gain: g.totalWinAmount || 0,
        net: (g.totalWinAmount || 0) - (g.totalBetAmount || 0),
      }));
  }, [groups]);

  // 2. Chiffres favoris — fréquence et taux de succès par chiffre
  const numbersData = useMemo(() => {
    const map: Record<number, { count: number; wins: number; totalBet: number }> = {};
    for (let i = 1; i <= 9; i++) map[i] = { count: 0, wins: 0, totalBet: 0 };
    groups.forEach(g => {
      (g.bets || []).forEach((bet: any) => {
        const n = Number(bet.number);
        if (n >= 1 && n <= 9) {
          map[n].count++;
          map[n].totalBet += bet.amount || 0;
          if (bet.status === "WON") map[n].wins++;
        }
      });
    });
    return Object.entries(map).map(([num, d]) => ({
      chiffre: Number(num),
      label: `${num}`,
      joué: d.count,
      gagné: d.wins,
      taux: d.count > 0 ? Math.round((d.wins / d.count) * 100) : 0,
    }));
  }, [groups]);

  // 3. Stats globales pour le taux de réussite
  const globalStats = useMemo(() => {
    let totalBets = 0, wonBets = 0, totalMise = 0, totalGain = 0;
    groups.forEach(g => {
      (g.bets || []).forEach((bet: any) => {
        totalBets++;
        totalMise += bet.amount || 0;
        if (bet.status === "WON") {
          wonBets++;
          totalGain += bet.payoutAmount || 0;
        }
      });
    });
    const rate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;
    const net = totalGain - totalMise;
    return { totalBets, wonBets, totalMise, totalGain, rate, net };
  }, [groups]);

  if (groups.length === 0) return null;

  // Chiffre le plus joué
  const favNum = [...numbersData].sort((a, b) => b.joué - a.joué)[0];
  // Chiffre avec meilleur taux
  const luckNum = [...numbersData].filter(n => n.joué > 0).sort((a, b) => b.taux - a.taux)[0];

  return (
    <div className="space-y-4">
      {/* Tabs graphiques */}
      <div className="flex gap-2 glass p-1.5 rounded-2xl border border-white/5">
        {([
          { id: "curve",   label: "Courbe",   icon: TrendingUp },
          { id: "numbers", label: "Chiffres", icon: Dices },
          { id: "rate",    label: "Stats",    icon: Target },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              activeChart === tab.id
                ? "glass-gold text-gold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Courbe gains/pertes ── */}
      <AnimatePresence mode="wait">
        {activeChart === "curve" && (
          <motion.div
            key="curve"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-3xl p-5 border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évolution gains / mises</p>
                <p className="text-xs text-muted-foreground opacity-60">{curveData.length} tirages résolus</p>
              </div>
              <div className="flex gap-3 text-[9px] font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold inline-block" />Mise</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Gain</span>
              </div>
            </div>

            {curveData.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic opacity-50">
                Jouez plus de tirages pour voir la courbe
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curveData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMise" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="mise" name="Mise" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradMise)" dot={false} />
                    <Area type="monotone" dataKey="gain" name="Gain" stroke="#10B981" strokeWidth={1.5} fill="url(#gradGain)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Net résumé */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
              globalStats.net >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-ruby/5 border-ruby/20"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bilan net</p>
              <p className={`text-sm font-black font-display ${globalStats.net >= 0 ? "text-emerald-400" : "text-ruby"}`}>
                {globalStats.net >= 0 ? "+" : ""}{globalStats.net.toLocaleString("fr-FR")} CFA
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Chiffres favoris ── */}
        {activeChart === "numbers" && (
          <motion.div
            key="numbers"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-3xl p-5 border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fréquence par chiffre</p>
                <p className="text-xs text-muted-foreground opacity-60">Nombre de fois joué</p>
              </div>
              <div className="flex gap-3 text-[9px] font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold inline-block" />Joué</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Gagné</span>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={numbersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "hsl(220 10% 50%)", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = numbersData.find(n => n.label === label);
                      return (
                        <div className="glass-card rounded-xl px-3 py-2 border border-white/10 shadow-xl text-xs space-y-1">
                          <p className="font-black text-gold">Chiffre {label}</p>
                          <p className="text-muted-foreground">Joué : <b className="text-foreground">{d?.joué}x</b></p>
                          <p className="text-muted-foreground">Gagné : <b className="text-emerald-400">{d?.gagné}x</b></p>
                          <p className="text-muted-foreground">Taux : <b className="text-foreground">{d?.taux}%</b></p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="joué" name="Joué" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {numbersData.map((entry) => (
                      <Cell
                        key={entry.chiffre}
                        fill={entry.chiffre === favNum?.chiffre ? "#F59E0B" : "rgba(255,255,255,0.15)"}
                        fillOpacity={entry.joué === 0 ? 0.2 : 1}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="gagné" name="Gagné" radius={[4, 4, 0, 0]} fill="#10B981" fillOpacity={0.8} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chiffres clés */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gold/5 border border-gold/20">
                <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center font-black text-background text-sm">
                  {favNum?.chiffre || "—"}
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Chiffre favori</p>
                  <p className="text-xs font-black text-gold">{favNum?.joué || 0} fois joué</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-sm">
                  {luckNum?.chiffre || "—"}
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Chiffre chanceux</p>
                  <p className="text-xs font-black text-emerald-400">{luckNum?.taux || 0}% de succès</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stats globales ── */}
        {activeChart === "rate" && (
          <motion.div
            key="rate"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-3xl p-5 border border-white/5 space-y-4"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statistiques personnelles</p>

            {/* Gauge taux de réussite */}
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={globalStats.rate >= 50 ? "#10B981" : globalStats.rate >= 20 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - globalStats.rate / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black font-display text-foreground">{globalStats.rate}%</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">succès</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="glass rounded-2xl p-3 border border-white/5 text-center">
                  <p className="text-lg font-black font-display text-foreground">{globalStats.totalBets}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Paris total</p>
                </div>
                <div className="glass rounded-2xl p-3 border border-emerald-500/10 text-center">
                  <p className="text-lg font-black font-display text-emerald-400">{globalStats.wonBets}</p>
                  <p className="text-[9px] text-emerald-500/70 uppercase font-bold">Gagnés</p>
                </div>
                <div className="glass rounded-2xl p-3 border border-white/5 text-center">
                  <p className="text-sm font-black font-display text-foreground">{globalStats.totalMise.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">CFA misés</p>
                </div>
                <div className="glass rounded-2xl p-3 border border-gold/10 text-center">
                  <p className="text-sm font-black font-display text-gold">{globalStats.totalGain.toLocaleString()}</p>
                  <p className="text-[9px] text-gold/60 uppercase font-bold">CFA gagnés</p>
                </div>
              </div>
            </div>

            {/* Bilan net visuel */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                <span>Mises</span>
                <span>Gains</span>
              </div>
              <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                {globalStats.totalMise > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${Math.min((globalStats.totalGain / globalStats.totalMise) * 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-muted-foreground">{globalStats.totalMise.toLocaleString()} CFA</span>
                <span className={globalStats.net >= 0 ? "text-emerald-400" : "text-ruby"}>
                  {globalStats.net >= 0 ? "+" : ""}{globalStats.net.toLocaleString()} CFA net
                </span>
              </div>
            </div>

            {/* Message motivant selon le taux */}
            <div className={`px-4 py-3 rounded-2xl text-xs font-medium border ${
              globalStats.rate >= 30
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : "bg-gold/5 border-gold/20 text-gold"
            }`}>
              {globalStats.rate >= 50
                ? "🏆 Excellent ! Vous êtes parmi les meilleurs joueurs AF-WIN."
                : globalStats.rate >= 30
                ? "🔥 Bon taux ! Continuez sur cette lancée."
                : globalStats.rate >= 10
                ? "⚡ Votre chance arrive. Restez dans le jeu !"
                : "🎯 Chaque tirage est une nouvelle chance. Bonne chance !"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const HistoryPage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({ from: undefined, to: undefined });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ["betHistory", date?.from, date?.to],
      queryFn: ({ pageParam }) => {
        const start = date?.from ? startOfDay(date.from).toISOString() : undefined;
        const end = date?.to ? endOfDay(date.to).toISOString() : undefined;
        return betsApi.getMyHistory(10, pageParam, start, end);
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
      enabled: !!user,
    });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
    enabled: !!user,
  });

  const groups = data?.pages.flatMap((page) => page.history || []).filter(Boolean) || [];

  const stats = groups.reduce(
    (acc, group) => {
      if (group) {
        acc.totalBet += group.totalBetAmount || 0;
        acc.totalWin += group.totalWinAmount || 0;
      }
      return acc;
    },
    { totalBet: 0, totalWin: 0 }
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <History className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-display tracking-tight uppercase">Historique</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Suivi de vos performances</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-2xl gap-3 glass border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all px-6">
                <CalendarIcon className="w-4 h-4 text-gold" />
                <span className="font-display font-bold text-xs uppercase tracking-wider">
                  {date?.from ? (
                    date.to
                      ? <>{format(date.from, "dd MMM", { locale: fr })} - {format(date.to, "dd MMM", { locale: fr })}</>
                      : format(date.from, "dd MMM", { locale: fr })
                  ) : "Toutes les dates"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden glass border-white/10 shadow-2xl" align="end">
              <Calendar initialFocus mode="range" selected={date} onSelect={setDate} numberOfMonths={1} locale={fr} />
              <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-black/20">
                <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-bold uppercase" onClick={() => setDate(undefined)}>Effacer</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass-card p-5 rounded-[2rem] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet className="w-12 h-12" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Engagé Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-white">{stats.totalBet.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">CFA</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass-card p-5 rounded-[2rem] border-emerald-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                <Trophy className="w-12 h-12" />
              </div>
              <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-2">Gains Bruts</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-emerald-400">{stats.totalWin.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-400/40 uppercase">CFA</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Graphiques de performance ── */}
        {!isLoading && groups.length > 0 && <PerformanceCharts groups={groups} />}

        {/* ── Liste des tirages ── */}
        <div className="space-y-6">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-ruby rounded-[3rem] border-dashed border-ruby/20">
              <Zap className="w-10 h-10 text-ruby animate-pulse mb-4" />
              <h3 className="text-xl font-black font-display uppercase tracking-widest text-ruby">Erreur de connexion</h3>
              <Button onClick={() => refetch()} variant="outline"
                className="mt-8 rounded-2xl border-ruby/30 text-ruby font-display font-black text-xs px-10 h-14 hover:bg-ruby/10">
                Tenter de reconnecter
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-white/5" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[3rem] border-dashed border-white/10">
              <Dices className="w-10 h-10 text-white/20 mb-4" />
              <h3 className="text-xl font-black font-display uppercase tracking-widest text-white/50">Désir de victoire ?</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-3 opacity-60">Votre historique est encore vierge. Placez vos premiers jetons.</p>
              <Button asChild className="mt-10 rounded-2xl gradient-gold text-primary-foreground font-display font-black text-xs px-10 h-14 glow-gold hover:scale-105 transition-all">
                <a href="/play">Accéder au tirage</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((group: any, idx: number) => {
                const dateFixed = group.date ? new Date(group.date) : new Date();
                const status = group.status || "PENDING";
                const isWin = group.totalWinAmount > 0;
                const isLost = status === "RESOLVED" && !isWin;
                const cfg = isWin ? statusConfig.WON : isLost ? statusConfig.LOST : statusConfig.PENDING;

                return (
                  <motion.div
                    key={group.drawId || idx}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                    className="relative"
                  >
                    <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl opacity-10 ${cfg.glowClass}`} />
                    <div className={`relative overflow-hidden rounded-[2.5rem] border border-white/5 ${cfg.cardClass} shadow-2xl`}>

                      {/* Header */}
                      <div className="p-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 ${
                            isWin ? "bg-emerald-500/20 text-emerald-400" : isLost ? "bg-ruby/20 text-ruby" : "bg-white/5 text-muted-foreground"
                          }`}>
                            <cfg.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-black font-display text-sm tracking-tight">Tirage {group.drawId}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                                {format(dateFixed, "d MMMM yyyy", { locale: fr })}
                              </span>
                              <span className="w-1 h-3 bg-white/10 rounded-full" />
                              <span className="text-[10px] text-gold font-black uppercase tracking-tighter">
                                {format(new Date(group.startTime), "HH:mm")} - {format(new Date(group.endTime), "HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Bets */}
                      <div className="px-6 py-4 space-y-3">
                        {group.bets.map((bet: any, betIdx: number) => {
                          const isBetWin = bet.status === "WON";
                          const isResolved = status === "RESOLVED";
                          return (
                            <div key={betIdx} className="flex items-center justify-between p-4 rounded-2xl glass border-white/[0.03]">
                              <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-black border transition-all ${
                                  isBetWin
                                    ? "gradient-gold border-gold/40 text-background shadow-lg shadow-gold/30 scale-105"
                                    : isResolved && !isBetWin
                                      ? "bg-black/40 border-white/5 text-white/20 grayscale"
                                      : "bg-white/5 border-white/10 text-white/80"
                                }`}>
                                  {bet.number}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-baseline gap-2">
                                    <p className="text-base font-black font-display">{bet.amount.toLocaleString()}</p>
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase opacity-40">CFA</span>
                                  </div>
                                  {isResolved ? (
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                      isBetWin ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                                    }`}>
                                      {isBetWin ? <Trophy className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                      {isBetWin ? `Succès (x${group.realMultiplier || "?"})` : "Échec"}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase animate-pulse">
                                      <Zap className="w-2.5 h-2.5" /> En cours
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {isBetWin ? (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Gain</p>
                                    <p className="text-lg font-black font-display text-emerald-400">+{bet.payoutAmount.toLocaleString()}</p>
                                  </div>
                                ) : isResolved ? (
                                  <p className="text-xs font-bold text-white/10 uppercase tracking-widest line-through">0 CFA</p>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground italic opacity-40">Attente...</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="mt-2 p-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        {status === "RESOLVED" ? (
                          <div className="flex items-center gap-6 w-full sm:w-auto">
                            <div>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2 opacity-50">Sortie Officielle</p>
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-3xl gradient-gold flex items-center justify-center font-display text-4xl font-black text-background glow-gold scale-110">
                                  {group.winningNumber}
                                </div>
                                <div>
                                  <p className="text-sm font-black font-display text-gold">CHANCE</p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Multiplié par {group.realMultiplier}x</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 py-2">
                            <div className="w-16 h-16 rounded-3xl border-2 border-white/10 border-dashed flex items-center justify-center animate-pulse">
                              <Sparkles className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-40">Tirage à venir...</p>
                          </div>
                        )}
                        <div className="flex items-center gap-10 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 opacity-50">Mise Totale</p>
                            <p className="text-lg font-black font-display">{group.totalBetAmount.toLocaleString()} CFA</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isWin ? "text-emerald-500" : "text-muted-foreground opacity-50"}`}>Gain Total</p>
                            <p className={`text-2xl font-black font-display ${isWin ? "text-emerald-400" : "text-white/20"}`}>
                              {group.totalWinAmount.toLocaleString()} <span className="text-xs font-bold font-sans">CFA</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {hasNextPage && (
                <div className="flex justify-center pt-8">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                    className="rounded-2xl h-14 px-12 glass border-white/5 hover:border-gold/30 transition-all font-display font-black text-xs uppercase tracking-[0.2em] group">
                    {isFetchingNextPage
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><Filter className="w-4 h-4 mr-3 group-hover:rotate-180 transition-transform duration-500 text-gold" />Charger plus de paris</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPage;