import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { History, Dices, Trophy, Clock, ArrowUpRight, ArrowDownRight, Wallet, Loader2, Calendar as CalendarIcon, Filter, Zap, Sparkles } from "lucide-react";
import { betsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

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

const HistoryPage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
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
        
        {/* ─── Debug Diagnostic Panel (Temporary) ─── */}
        {process.env.NODE_ENV === 'development' || true ? ( // Keep true during debug phase
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] space-y-1 font-mono text-zinc-500">
             <div className="flex justify-between border-b border-white/5 pb-1 mb-2">
               <span className="text-gold font-bold uppercase">Diagnostic Système</span>
               <span className="text-emerald-500 font-bold">LIVE</span>
             </div>
             <p><span className="text-white/40">Auth Loaded:</span> <span className={user ? "text-emerald-400" : "text-ruby"}>{user ? 'OUI' : 'NON'}</span></p>
             <p><span className="text-white/40">User ID:</span> <span>{user?.id ? `${user.id.substring(0, 8)}...` : 'NUL'}</span></p>
             <p><span className="text-white/40">API URL:</span> <span className="text-gold font-bold underline">{import.meta.env.VITE_API_URL || 'LOCALFALLBACK'}</span></p>
             <p>
               <span className="text-white/40">Connection Serveur:</span> 
               <span className={isLoading ? "text-amber-500" : isError ? "text-ruby" : "text-emerald-500"}>
                 {isLoading ? 'EN ATTENTE...' : isError ? 'ECHEC' : 'OPERATIONNEL'}
               </span>
             </p>
             <p><span className="text-white/40">Query Status:</span> <span className="uppercase">{data ? 'SUCCES' : isError ? 'ERREUR' : isLoading ? 'CHARGEMENT' : 'INCONNU'}</span></p>
             {isError && (
               <div className="mt-2 p-2 bg-ruby/10 border border-ruby/20 rounded text-ruby overflow-hidden text-ellipsis">
                 <p className="font-bold">Détail Erreur :</p>
                 <pre className="whitespace-pre-wrap">{(isError as any)?.message || 'Erreur inconnue'}</pre>
               </div>
             )}
             <p><span className="text-white/40">Pages Chargees:</span> <span>{data?.pages.length || 0}</span></p>
          </div>
        ) : null}

        {/* ─── Header & Filter ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
                <History className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-black font-display tracking-tight uppercase">Historique</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Suivi de vos performances</p>
              </div>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-2xl gap-3 glass border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all px-6">
                <CalendarIcon className="w-4 h-4 text-gold" />
                <span className="font-display font-bold text-xs uppercase tracking-wider">
                  {date?.from ? (
                    date.to ? (
                      <>{format(date.from, "dd MMM", { locale: fr })} - {format(date.to, "dd MMM", { locale: fr })}</>
                    ) : (
                      format(date.from, "dd MMM", { locale: fr })
                    )
                  ) : (
                    "Toutes les dates"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden glass border-white/10 shadow-2xl" align="end">
              <Calendar
                initialFocus
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={fr}
              />
              <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-black/20">
                <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-bold uppercase" onClick={() => setDate(undefined)}>Effacer</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass-card p-5 rounded-[2rem] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wallet className="w-12 h-12" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Engagé Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-display text-white">{stats.totalBet.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 leading-none">CFA</span>
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
                <span className="text-[10px] font-bold text-emerald-400/40 uppercase leading-none">CFA</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Draw List ─── */}
        <div className="space-y-6">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-ruby rounded-[3rem] border-dashed border-ruby/20">
              <div className="w-20 h-20 rounded-3xl bg-ruby/10 flex items-center justify-center mb-6 shadow-inner">
                <Zap className="w-10 h-10 text-ruby animate-pulse" />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-widest text-ruby">Erreur de connexion</h3>
              <p className="text-sm text-balance text-muted-foreground max-w-xs mt-3 opacity-80 font-medium">
                Impossible de récupérer vos paris. Si vous êtes sur Vercel, vérifiez que votre <code className="bg-white/5 px-1 rounded text-gold">VITE_API_URL</code> utilise bien <code className="text-emerald-400 font-bold">HTTPS</code>.
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                className="mt-10 rounded-2xl border-ruby/30 text-ruby font-display font-black text-xs px-10 h-14 hover:bg-ruby/10 transition-all"
              >
                Tenter de reconnecter
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-white/5" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[3rem] border-dashed border-white/10">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                <Dices className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-widest text-white/50">Désir de victoire ?</h3>
              <p className="text-sm text-balance text-muted-foreground max-w-xs mt-3 opacity-60 font-medium">Votre historique est encore vierge. Placez vos premiers jetons pour entrer dans la légende.</p>
              <Button asChild className="mt-10 rounded-2xl gradient-gold text-primary-foreground font-display font-black text-xs px-10 h-14 glow-gold hover:scale-105 transition-all">
                <a href="/play">Accéder au tirage</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((group: any, idx: number) => {
                const dateFixed = group.date ? new Date(group.date) : new Date();
                const status = group.status || 'PENDING';
                const isWin = group.totalWinAmount > 0;
                const isLost = status === 'RESOLVED' && !isWin;
                const cfg = isWin ? statusConfig.WON : isLost ? statusConfig.LOST : statusConfig.PENDING;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                    key={group.drawId || idx}
                    className="relative"
                  >
                    {/* Background glow shadow */}
                    <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl opacity-10 transition-all ${cfg.glowClass}`} />
                    
                    <div className={`relative overflow-hidden rounded-[2.5rem] border border-white/5 ${cfg.cardClass} shadow-2xl transition-all duration-500`}>
                      
                      {/* Ticket Header */}
                      <div className="p-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 transition-colors ${
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
                        <Badge variant="outline" className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/5 ${cfg.badgeClass}`}>
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Ticket Body - The Predictions */}
                      <div className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          {group.bets.map((bet: any, betIdx: number) => {
                            const isBetWin = bet.status === 'WON';
                            const isResolved = status === 'RESOLVED';
                            
                            return (
                              <div key={betIdx} className="relative flex items-center justify-between p-4 rounded-2xl glass border-white/[0.03] group/bet hover:border-white/5 transition-all">
                                <div className="flex items-center gap-5">
                                  {/* Number Circle */}
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-black border transition-all duration-500 ${
                                    isBetWin 
                                      ? "gradient-gold border-gold/40 text-background shadow-lg shadow-gold/30 scale-105" 
                                      : isResolved && bet.status !== 'WON'
                                        ? "bg-black/40 border-white/5 text-white/20 grayscale"
                                        : "bg-white/5 border-white/10 text-white/80"
                                  }`}>
                                    {bet.number}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-black font-display">{bet.amount.toLocaleString()}</p>
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase opacity-40">CFA</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {isResolved ? (
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                          isBetWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'
                                        }`}>
                                          {isBetWin ? <Trophy className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                          {isBetWin ? `Succès (x${group.realMultiplier || '?'})` : 'Échec'}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-tighter animate-pulse">
                                          <Zap className="w-2.5 h-2.5" /> En cours
                                        </div>
                                      )}
                                    </div>
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
                      </div>

                      {/* Ticket Footer - Summary & Result */}
                      <div className="mt-2 p-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        
                        {/* Result Ball */}
                        {status === 'RESOLVED' ? (
                           <div className="flex items-center gap-6 w-full sm:w-auto">
                              <div className="text-center sm:text-left">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2 opacity-50">Sortie Officielle</p>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-3xl gradient-gold flex items-center justify-center font-display text-4xl font-black text-background glow-gold scale-110">
                                    {group.winningNumber}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black font-display text-gold">CHANCE</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Multiplié par {group.realMultiplier}x</p>
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
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isWin ? 'text-emerald-500' : 'text-muted-foreground opacity-50'}`}>Gain Total</p>
                            <p className={`text-2xl font-black font-display ${isWin ? 'text-emerald-400' : 'text-white/20'}`}>
                              {group.totalWinAmount.toLocaleString()} <span className="text-xs font-bold font-sans">CFA</span>
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Pagination Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="rounded-2xl h-14 px-12 glass border-white/5 hover:border-gold/30 transition-all font-display font-black text-xs uppercase tracking-[0.2em] glow-gold group"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Filter className="w-4 h-4 mr-3 group-hover:rotate-180 transition-transform duration-500 text-gold" />
                        Charger plus de paris
                      </>
                    )}
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
