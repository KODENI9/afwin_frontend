import { useInfiniteQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { History, Dices, Trophy, Clock, ArrowUpRight, ArrowDownRight, Wallet, Loader2 } from "lucide-react";
import { betsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  PENDING: {
    label: "En attente",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  WON: {
    label: "Gagné",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: Trophy,
  },
  LOST: {
    label: "Perdu",
    badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    icon: ArrowDownRight,
  },
};

const HistoryPage = () => {
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["betHistory"],
    queryFn: ({ pageParam }) => betsApi.getMyHistory(20, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!user,
  });

  const bets = data?.pages.flatMap((page) => page.bets) || [];

  // Calculate stats from all loaded bets (simplified, ideally backend would provide this)
  const stats = bets.reduce(
    (acc, bet) => {
      acc.totalBets++;
      if (bet.status === "WON") {
        acc.totalWon += bet.payoutAmount;
        acc.netProfit += bet.payoutAmount - bet.amount;
      } else if (bet.status === "LOST") {
        acc.netProfit -= bet.amount;
      }
      return acc;
    },
    { totalBets: 0, totalWon: 0, netProfit: 0 }
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Mon Historique</h1>
            </div>
            <p className="text-muted-foreground">Consultez vos performances et détails de paris.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Dices className="w-12 h-12" />
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Paris</p>
            <h3 className="text-2xl font-bold mt-1">{stats.totalBets}</h3>
          </Card>
          <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-emerald-500">
              <ArrowUpRight className="w-12 h-12" />
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Gagné</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {stats.totalWon.toLocaleString()} <span className="text-xs">CFA</span>
            </h3>
          </Card>
          <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-primary">
              <Wallet className="w-12 h-12" />
            </div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Profit Net</p>
            <h3 className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>
              {stats.netProfit > 0 ? '+' : ''}{stats.netProfit.toLocaleString()} <span className="text-xs">CFA</span>
            </h3>
          </Card>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Paris Récents
            {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-dashed">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Dices className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Aucun pari pour le moment</h3>
              <p className="text-zinc-500 max-w-xs mt-2">Commencez à jouer pour voir votre historique apparaître ici.</p>
              <Button asChild variant="outline" className="mt-6 rounded-full">
                <a href="/play">Placer un pari</a>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {Array.from(new Set(bets.map((b: any) => b.draw_id))).map((drawId: any, groupIndex: number) => {
                  const drawBets = bets.filter((b: any) => b.draw_id === drawId);
                  const firstBet = drawBets[0];
                  if (!firstBet) return null;
                  
                  const totalStake = drawBets.reduce((sum, b) => sum + (b.amount || 0), 0);
                  const date = new Date(firstBet.createdAt || firstBet.created_at || Date.now());
                  
                  return (
                    <div key={drawId || `group-${groupIndex}`} className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Tirage du {date.toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}</span>
                          <span className="opacity-30">|</span>
                          <span className="text-zinc-500">{date.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-500">
                          TOTAL : {totalStake.toLocaleString()} CFA
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {drawBets.map((bet: any, index: number) => {
                          const status = bet.status || "PENDING";
                          const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
                          const isWon = status === "WON";
                          
                          return (
                            <div
                              key={bet.id || `bet-${drawId}-${index}`}
                              className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary/30 dark:hover:border-primary/30 transition-all hover:shadow-md active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-4">
                                {/* Large Number Badge */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-display text-2xl font-bold shadow-sm transition-transform group-hover:scale-105 ${
                                  isWon 
                                    ? "bg-primary text-white" 
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                }`}>
                                  {bet.number}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{(bet.amount || 0).toLocaleString()} <span className="text-[10px] text-zinc-400 font-normal">CFA</span></span>
                                    <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] uppercase tracking-tighter ${cfg.badgeClass}`}>
                                      {cfg.label}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    ID: {(bet.id || "").substring(0, 8)}...
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                {isWon ? (
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Gain</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-display text-xl font-bold leading-none">
                                      +{(bet.payoutAmount || 0).toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-zinc-400 italic">
                                    {status === 'PENDING' ? 'En cours...' : 'Perdu'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasNextPage && (
                <div className="pt-4 pb-8 flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="rounded-full text-zinc-500 hover:text-primary transition-colors gap-2"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Charger plus de paris"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {isError && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
              Une erreur est survenue lors du chargement de vos paris.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPage;
