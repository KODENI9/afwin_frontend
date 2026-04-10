import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import {
  Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Trophy,
  MessageSquare, Globe, PhoneCall, DollarSign, TrendingUp,
  TrendingDown, BarChart2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { walletApi, drawsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale/fr";

const PROVIDERS = ["Flooz", "T-Money", "Moov", "Orange"];

// ─── Tooltip custom ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2 border border-white/10 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-bold">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-black">
          {p.name}: {Number(p.value).toLocaleString("fr-FR")} CFA
        </p>
      ))}
    </div>
  );
};

// ─── Graphiques portefeuille ──────────────────────────────────────────────────
const WalletCharts = ({ transactions }: { transactions: any[] }) => {
  const [activeChart, setActiveChart] = useState<"evolution" | "flux" | "resume">("resume");

  // ── Stats globales ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalDeposit = 0, totalWithdraw = 0, totalGain = 0, totalBet = 0;

    transactions.forEach(tx => {
      if (tx.status !== 'approved') return;
      const amt = Math.abs(Number(tx.amount) || 0);
      if (tx.type === 'deposit') totalDeposit += amt;
      else if (tx.type === 'withdrawal') totalWithdraw += amt;
      else if (tx.type === 'payout' || tx.type === 'win') totalGain += amt;
      else if (tx.type === 'bet') totalBet += amt;
    });

    const net = totalDeposit + totalGain - totalWithdraw - totalBet;
    return { totalDeposit, totalWithdraw, totalGain, totalBet, net };
  }, [transactions]);

  // ── Évolution du solde sur 30 jours ────────────────────────────────────────
  const evolutionData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
    let runningBalance = 0;

    // Calculer le solde cumulé jour par jour
    const txByDay = new Map<string, number>();
    [...transactions]
      .filter(tx => tx.status === 'approved')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(tx => {
        const day = format(new Date(tx.created_at), 'yyyy-MM-dd');
        const amt = Number(tx.amount) || 0;
        txByDay.set(day, (txByDay.get(day) || 0) + amt);
      });

    return days.map(day => {
      const key = format(day, 'yyyy-MM-dd');
      runningBalance += txByDay.get(key) || 0;
      return {
        date: format(day, 'dd/MM', { locale: fr }),
        solde: Math.max(0, runningBalance),
      };
    });
  }, [transactions]);

  // ── Flux par jour (7 derniers jours) ───────────────────────────────────────
  const fluxData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      let depot = 0, retrait = 0, gain = 0;

      transactions
        .filter(tx => tx.status === 'approved' && isSameDay(new Date(tx.created_at), day))
        .forEach(tx => {
          const amt = Math.abs(Number(tx.amount) || 0);
          if (tx.type === 'deposit') depot += amt;
          else if (tx.type === 'withdrawal') retrait += amt;
          else if (tx.type === 'payout' || tx.type === 'win') gain += amt;
        });

      return {
        date: format(day, 'EEE', { locale: fr }),
        Dépôts: depot,
        Gains: gain,
        Retraits: retrait,
      };
    });
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 glass p-1.5 rounded-2xl border border-white/5">
        {([
          { id: "resume",    label: "Résumé",    icon: BarChart2   },
          { id: "evolution", label: "Évolution",  icon: TrendingUp  },
          { id: "flux",      label: "Flux 7j",    icon: TrendingDown },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveChart(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              activeChart === tab.id ? "glass-gold text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Résumé financier ── */}
      {activeChart === "resume" && (
        <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bilan financier global</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4">
              <p className="text-[9px] uppercase text-emerald-500/70 font-black mb-1">Total déposé</p>
              <p className="text-lg font-black font-display text-emerald-400">
                {stats.totalDeposit.toLocaleString("fr-FR")}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">CFA</span>
              </p>
            </div>
            <div className="rounded-2xl bg-gold/5 border border-gold/20 p-4">
              <p className="text-[9px] uppercase text-gold/70 font-black mb-1">Total gagné</p>
              <p className="text-lg font-black font-display text-gold">
                {stats.totalGain.toLocaleString("fr-FR")}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">CFA</span>
              </p>
            </div>
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4">
              <p className="text-[9px] uppercase text-destructive/70 font-black mb-1">Total retiré</p>
              <p className="text-lg font-black font-display text-destructive">
                {stats.totalWithdraw.toLocaleString("fr-FR")}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">CFA</span>
              </p>
            </div>
            <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 p-4">
              <p className="text-[9px] uppercase text-purple-400/70 font-black mb-1">Total misé</p>
              <p className="text-lg font-black font-display text-purple-400">
                {stats.totalBet.toLocaleString("fr-FR")}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">CFA</span>
              </p>
            </div>
          </div>

          {/* Bilan net */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
            stats.net >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"
          }`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bilan net</p>
            <p className={`text-lg font-black font-display ${stats.net >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {stats.net >= 0 ? "+" : ""}{stats.net.toLocaleString("fr-FR")} CFA
            </p>
          </div>

          {/* Barre dépôts vs gains */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
              <span>Mises</span>
              <span>Gains</span>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              {stats.totalBet > 0 && (
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-gold transition-all duration-1000"
                  style={{ width: `${Math.min((stats.totalGain / stats.totalBet) * 100, 100)}%` }}
                />
              )}
            </div>
            <p className="text-[9px] text-center text-muted-foreground">
              Taux de retour :{" "}
              <span className="font-black text-gold">
                {stats.totalBet > 0 ? ((stats.totalGain / stats.totalBet) * 100).toFixed(1) : 0}%
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Évolution du solde ── */}
      {activeChart === "evolution" && (
        <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Évolution du solde — 30 jours</p>
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
              <span className="text-muted-foreground">Solde</span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="solde" name="Solde" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradSolde)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Flux 7 jours ── */}
      {activeChart === "flux" && (
        <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flux financiers — 7 derniers jours</p>
            <div className="flex gap-3 text-[9px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Dépôts</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold inline-block" />Gains</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" />Retraits</span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "hsl(220 10% 50%)", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Dépôts"  fill="#10B981" radius={[4,4,0,0]} maxBarSize={20} />
                <Bar dataKey="Gains"   fill="#F59E0B" radius={[4,4,0,0]} maxBarSize={20} />
                <Bar dataKey="Retraits" fill="#EF4444" radius={[4,4,0,0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const WalletPage = () => {
  const { user, balance, refreshBalance } = useAuth();
  const queryClient = useQueryClient();
  const [smsContent, setSmsContent] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawProvider, setWithdrawProvider] = useState("Flooz");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [activeAction, setActiveAction] = useState<"deposit" | "withdraw" | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const { data: transactions = [], isLoading: isTransLoading, error: transError } = useQuery({
    queryKey: ["myTransactions"],
    queryFn: () => walletApi.getTransactions(),
    enabled: !!user,
  });

  const { data: networks = [], isLoading: isNetLoading } = useQuery({
    queryKey: ["activeNetworks"],
    queryFn: () => walletApi.getNetworks(),
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => drawsApi.getSettings(),
    enabled: !!user,
  });

  const minBet = settings?.min_bet || 100;

  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) setSelectedNetwork(networks[0]);
  }, [networks, selectedNetwork]);

  useEffect(() => {
    if (transError) toast.error("Erreur de chargement des transactions");
  }, [transError]);

  const invalidate = () => {
    refreshBalance();
    queryClient.invalidateQueries({ queryKey: ["myTransactions"] });
  };

  const deposit = useMutation({
    mutationFn: (sms: string) => walletApi.deposit(sms),
    onSuccess: (data) => {
      toast.success("Dépôt soumis !", { description: data.message || "Un admin validera votre demande." });
      setSmsContent(""); setActiveAction(null); invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const withdraw = useMutation({
    mutationFn: (data: { amount: number; provider: string; pin: string; account_details?: string }) =>
      walletApi.withdraw(data.amount, data.provider, data.pin, data.account_details),
    onSuccess: () => {
      toast.success("Demande de retrait envoyée !");
      setWithdrawAmount(""); setWithdrawAccount(""); setWithdrawPin("");
      setActiveAction(null); invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const handleDeposit = () => {
    if (!smsContent.trim()) { toast.error("Collez votre SMS de confirmation"); return; }
    deposit.mutate(smsContent);
  };

  const handleWithdraw = () => {
    const num = parseFloat(withdrawAmount);
    if (!num || num <= 0) { toast.error("Montant invalide"); return; }
    if (!withdrawPin) { toast.error("Code PIN requis"); return; }
    withdraw.mutate({ amount: num, provider: withdrawProvider, pin: withdrawPin, account_details: withdrawAccount });
  };

  const toggleAction = (action: "deposit" | "withdraw") => {
    setActiveAction(activeAction === action ? null : action);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
            <Wallet className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Portefeuille</h1>
        </div>

        {/* Balance card */}
        <div className="relative glass-card rounded-3xl p-7 text-center overflow-hidden highlight-top">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-gold/6 blur-[60px]" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Solde Disponible</p>
          <p className="font-display text-5xl md:text-6xl font-black gradient-text-gold">
            {(balance ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-muted-foreground font-medium mt-1">CFA</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => toggleAction("deposit")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-300 border ${
              activeAction === "deposit"
                ? "gradient-gold text-primary-foreground border-transparent glow-gold"
                : "glass text-muted-foreground border-border hover:border-gold/30 hover:text-gold"
            }`}>
            <Plus className="w-4 h-4" /> Recharger
          </button>
          <button onClick={() => toggleAction("withdraw")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-300 border ${
              activeAction === "withdraw"
                ? "bg-destructive text-destructive-foreground border-transparent"
                : "glass text-muted-foreground border-border hover:border-destructive/30 hover:text-destructive"
            }`}>
            <Minus className="w-4 h-4" /> Retirer
          </button>
        </div>

        {/* Deposit form */}
        {activeAction === "deposit" && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="glass-card rounded-2xl p-5 space-y-4 border border-gold/15 highlight-top">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-gold" />
                <p className="text-sm font-semibold text-foreground">Étape 1 : Choisissez votre réseau</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {isNetLoading ? (
                  <div className="col-span-2 py-4 text-center text-xs text-muted-foreground italic">Chargement...</div>
                ) : networks.length === 0 ? (
                  <div className="col-span-2 py-4 text-center text-xs text-muted-foreground italic">Aucun réseau disponible.</div>
                ) : networks.map((net: any) => (
                  <button key={net.id} onClick={() => setSelectedNetwork(net)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 ${
                      selectedNetwork?.id === net.id
                        ? "glass-gold border-gold/40 text-gold"
                        : "bg-muted/30 border-white/5 text-muted-foreground hover:border-white/10"
                    }`}>
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{net.name}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Montant à recharger</p>
                <div className="relative">
                  <Input type="number" placeholder="Ex: 2000" value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="bg-muted/50 border-border text-foreground h-12 font-display text-lg pl-10 focus:border-gold/40" />
                  <DollarSign className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <a href={selectedNetwork && depositAmount
                  ? `tel:${selectedNetwork.ussd_template.replaceAll("{amount}", depositAmount).replaceAll("{destination}", selectedNetwork.destination_number).replace("#", "%23")}`
                  : "#"}
                onClick={(e) => {
                  if (!selectedNetwork || !depositAmount) { e.preventDefault(); toast.error("Choisissez un réseau et entrez un montant"); }
                  else toast.success("Ouverture du composeur...");
                }}
                className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl font-display font-bold text-sm transition-all shadow-lg ${
                  selectedNetwork && depositAmount
                    ? "gradient-gold text-primary-foreground glow-gold hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}>
                <PhoneCall className="w-4 h-4" /> Démarrer le transfert
              </a>
              <p className="text-[10px] text-center text-muted-foreground italic px-2">
                Cela ouvrira votre application téléphone avec le code USSD pré-rempli.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-gold" />
                <p className="text-sm font-semibold text-foreground">Étape 2 : Confirmez avec le SMS</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Après le transfert USSD, <span className="text-foreground font-bold">copiez le SMS de confirmation</span> reçu et collez-le ci-dessous.
              </p>
              <textarea placeholder="Collez ici le SMS reçu..."
                value={smsContent} onChange={e => setSmsContent(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm font-mono text-foreground min-h-[100px] focus:outline-none focus:border-gold/40 transition-all resize-none" />
              <Button onClick={handleDeposit} disabled={deposit.isPending}
                className="w-full bg-white/5 hover:bg-white/10 text-foreground border border-white/10 font-display font-bold h-11 rounded-xl">
                {deposit.isPending ? "Analyse en cours..." : "Valider mon dépôt"}
              </Button>
            </div>
          </div>
        )}

        {/* Withdraw form */}
        {activeAction === "withdraw" && (
          <div className="glass-card rounded-2xl p-5 space-y-4 border border-destructive/15">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-destructive" /> Demande de retrait
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Opérateur</p>
              <div className="grid grid-cols-4 gap-2">
                {PROVIDERS.map(p => (
                  <button key={p} onClick={() => setWithdrawProvider(p)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      withdrawProvider === p
                        ? "gradient-gold text-primary-foreground border-transparent"
                        : "bg-muted/40 text-muted-foreground border-border hover:border-gold/30"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Montant (min. {minBet.toLocaleString()} CFA)</p>
              <Input type="number" placeholder="Ex: 5000" value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="bg-muted/50 border-border text-foreground h-11 font-display focus:border-destructive/40" min={minBet} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Numéro de réception (Optionnel)</p>
              <Input type="tel" placeholder="Laisser vide pour votre numéro actuel"
                value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)}
                className="bg-muted/50 border-border text-foreground h-11 focus:border-gold/40" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Code PIN de sécurité</p>
              <Input type="password" inputMode="numeric" maxLength={4} placeholder="4 chiffres"
                value={withdrawPin} onChange={e => setWithdrawPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-muted/50 border-border text-foreground text-center font-mono tracking-[1em] h-11 focus:border-gold/40" />
            </div>
            <Button onClick={handleWithdraw} disabled={withdraw.isPending}
              className="w-full bg-destructive text-destructive-foreground font-display font-bold h-11 rounded-xl hover:opacity-90">
              {withdraw.isPending ? "Traitement..." : "Confirmer le retrait"}
            </Button>
          </div>
        )}

        {/* ── Graphiques portefeuille ── */}
        {!isTransLoading && Array.isArray(transactions) && transactions.length > 0 && (
          <WalletCharts transactions={transactions} />
        )}

        {/* Transaction history */}
        <div className="space-y-3">
          <h2 className="font-display text-xs uppercase tracking-widest text-muted-foreground pt-2">
            Transactions récentes
          </h2>
          {isTransLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
              Aucune transaction pour l'instant
            </div>
          ) : (
            <div className="space-y-2">
              {Array.isArray(transactions) && transactions.map((trans: any) => {
                const isCredit = ["deposit", "win", "payout", "commission", "referral_bonus", "transfer_received"].includes(trans.type);
                return (
                  <div key={trans.id} className="glass-card rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-white/10 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "glass-emerald" : "bg-destructive/10"}`}>
                        {trans.type === "deposit" ? <ArrowUpRight className="w-4 h-4 text-emerald-brand" />
                          : ["win", "payout", "commission", "referral_bonus"].includes(trans.type) ? <Trophy className="w-4 h-4 text-emerald-brand" />
                          : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {trans.type === "deposit" ? "Dépôt"
                            : trans.type === "win" || trans.type === "payout" ? "🏆 Gain"
                            : trans.type === "referral_bonus" || trans.type === "commission" ? "🎁 Bonus"
                            : trans.type === "transfer_received" ? "💸 Reçu"
                            : trans.type === "transfer_sent" ? "💸 Envoyé"
                            : "Retrait"}{" "}
                          <span className="text-muted-foreground font-normal">· {trans.provider}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(trans.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display font-bold text-sm ${isCredit ? "text-emerald-brand" : "text-destructive"}`}>
                        {isCredit ? "+" : "-"}{Math.abs(Number(trans.amount)).toLocaleString("fr-FR")} CFA
                      </p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        trans.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                        trans.status === "rejected" ? "bg-destructive/15 text-destructive" :
                        "bg-amber-500/15 text-amber-400"
                      }`}>
                        {trans.status === "approved" ? "Approuvé" : trans.status === "rejected" ? "Rejeté" : "En attente"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WalletPage;