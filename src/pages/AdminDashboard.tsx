import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Zap, Trophy, ShieldCheck, Clock, CheckCircle, XCircle,
  MessageSquare, ChevronDown, ChevronUp, BarChart2, Power,
  Filter, Users, DollarSign, Dices, Phone, User, Settings,
  Globe, Plus, Trash2, Edit2, Save, X
} from "lucide-react";
import { drawsApi, adminApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

type Tab = "draws" | "payments" | "stats" | "networks" | "users" | "game_settings" | "sms_logs" | "maintenance";
type Filter = "all" | "deposit" | "withdrawal";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("draws");
  const [expandedSMS, setExpandedSMS] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Le service est temporairement en maintenance.");
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [balanceForm, setBalanceForm] = useState({ amount: "", reason: "" });

  // Get today's draw
  const { data: draw, error: drawError } = useQuery({
    queryKey: ["adminDraw"],
    queryFn: () => drawsApi.getCurrent(),
    enabled: isAdmin,
  });

  // Get draw stats
  const { data: stats } = useQuery({
    queryKey: ["adminDrawStats", draw?.id],
    queryFn: () => adminApi.getDrawStats(draw!.id),
    enabled: !!draw?.id && isAdmin,
  });

  // Get pending transactions
  const { data: allPendingTrans = [], isLoading: isTransLoading, error: transError } = useQuery({
    queryKey: ["adminPendingTrans"],
    queryFn: () => adminApi.getPendingTransactions(),
    enabled: isAdmin,
  });

  // Get networks
  const { data: networks = [], isLoading: isNetLoading, refetch: refetchNetworks } = useQuery({
    queryKey: ["adminNetworks"],
    queryFn: () => adminApi.getNetworks(),
    enabled: isAdmin,
  });

  // Get game settings
  const { data: gameSettings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => adminApi.getSettings(),
    enabled: isAdmin,
  });

  // Get users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminApi.getUsers(),
    enabled: isAdmin,
  });

  // Get global stats
  const { data: globalStats } = useQuery({
    queryKey: ["globalStats"],
    queryFn: () => adminApi.getGlobalStats(),
    enabled: isAdmin,
  });

  // Get failed SMS
  const { data: failedSms = [] } = useQuery({
    queryKey: ["failedSms"],
    queryFn: () => adminApi.getFailedSMS(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (drawError || transError) {
      toast.error("Erreur lors de la récupération des données admin");
    }
  }, [drawError, transError]);

  // Maintenance status
  useQuery({
    queryKey: ["adminMaintenance"],
    queryFn: async () => {
      const res = await adminApi.getMaintenanceStatus();
      setMaintenanceActive(res.active ?? false);
      setMaintenanceMsg(res.message ?? maintenanceMsg);
      return res;
    },
    enabled: isAdmin,
  });

  const pendingTrans = (filter === "all" || !Array.isArray(allPendingTrans))
    ? (Array.isArray(allPendingTrans) ? allPendingTrans : [])
    : allPendingTrans.filter((t: any) => t.type === filter);

  const reviewTransMutation = useMutation({
    mutationFn: (data: { id: string; action: "approve" | "reject" }) =>
      adminApi.reviewTransaction(data.id, data.action),
    onSuccess: (data) => {
      toast.success(data.message || "Opération réussie");
      queryClient.invalidateQueries({ queryKey: ["adminPendingTrans"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (data: { active: boolean; message: string }) =>
      adminApi.setMaintenance(data.active, data.message),
    onSuccess: (res) => {
      toast.success(res.message || "Mode maintenance mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminMaintenance"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const saveNetworkMutation = useMutation({
    mutationFn: (net: any) => adminApi.saveNetwork(net),
    onSuccess: () => {
      toast.success("Réseau enregistré");
      queryClient.invalidateQueries({ queryKey: ["adminNetworks"] });
      setEditingNetwork(null);
      setIsAddingNetwork(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => adminApi.updateSettings(settings),
    onSuccess: () => {
      toast.success("Paramètres mis à jour");
      queryClient.invalidateQueries({ queryKey: ["gameSettings"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const toggleUserBlockMutation = useMutation({
    mutationFn: (data: { user_id: string; is_blocked: boolean }) =>
      adminApi.toggleUserBlock(data.user_id, data.is_blocked),
    onSuccess: () => {
      toast.success("Statut utilisateur mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const updateBalanceMutation = useMutation({
    mutationFn: (data: { user_id: string; new_balance: number; reason: string }) =>
      adminApi.updateUserBalance(data.user_id, data.new_balance, data.reason),
    onSuccess: () => {
      toast.success("Solde mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setEditingUser(null);
      setBalanceForm({ amount: "", reason: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNetwork(id),
    onSuccess: () => {
      toast.success("Réseau supprimé");
      queryClient.invalidateQueries({ queryKey: ["adminNetworks"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  // Draw stats
  const betsByNumber = stats?.betsByNumber || [];
  const bettorsCount = stats?.bettorsCount || 0;
  const totalPool = draw?.totalPool || 0;

  const allNumbers = Array.from({ length: 9 }, (_, i) => {
    const num = i + 1;
    const found = betsByNumber.find((b: any) => b.number === num);
    return { number: num, total: found ? Number(found.total) : 0 };
  });

  const sorted = [...allNumbers].sort((a, b) => a.total - b.total);
  const maxBet = Math.max(...allNumbers.map((b) => b.total), 1);
  const winner = sorted.find((s) => s.total > 0) || sorted[0];
  const isResolved = draw?.status === "RESOLVED";

  const performDraw = useMutation({
    mutationFn: async () => {
      if (!draw) throw new Error("Pas de tirage à traiter");
      return adminApi.resolveDraw(draw.id);
    },
    onSuccess: () => {
      toast.success(`Tirage effectué avec succès !`, {
        icon: <Trophy className="w-4 h-4" />,
      });
      queryClient.invalidateQueries({ queryKey: ["adminDraw"] });
      queryClient.invalidateQueries({ queryKey: ["draws"] });
      queryClient.invalidateQueries({ queryKey: ["adminDrawStats"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "draws", label: "Tirages" },
    { id: "payments", label: "Paiements", count: allPendingTrans.length },
    { id: "stats", label: "Stats" },
    { id: "networks", label: "Réseaux" },
    { id: "users", label: "Membres" },
    { id: "game_settings", label: "Réglages" },
    { id: "sms_logs", label: "SMS" },
    { id: "maintenance", label: "Système" },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Administration</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass p-1 rounded-2xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? "glass-gold text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 bg-destructive text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Onglet Tirage ── */}
        {activeTab === "draws" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Indicator */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isResolved ? 'bg-muted' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {isResolved ? "Tirage Résolu" : draw?.status === "CLOSED" ? "Paris Clos" : "Session Ouverte"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gold/60">
                ID: {draw?.id?.substring(0, 8)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatMini 
                icon={<DollarSign className="w-4 h-4 text-gold" />} 
                value={`${Number(totalPool).toLocaleString("fr-FR")} CFA`} 
                label="Pool Total"
                className="border-gold/10 bg-gold/5"
              />
              <StatMini 
                icon={<Users className="w-4 h-4 text-emerald-brand" />} 
                value={String(bettorsCount)} 
                label="Parieurs" 
                className="border-emerald-500/10 bg-emerald-500/5"
              />
              <StatMini 
                icon={<Dices className="w-4 h-4 text-purple-400" />} 
                value={isResolved ? String(draw?.winningNumber) : (winner?.number ? String(winner.number) : "—")} 
                label={isResolved ? "Gagnant" : "N° Cible"} 
                className="border-purple-500/10 bg-purple-500/5"
              />
            </div>

            <div className="glass-card rounded-3xl p-6 border-white/5 space-y-5 shadow-2xl relative overflow-hidden">
               {/* Subtle background glow */}
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/5 blur-[100px] pointer-events-none" />
               <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-[100px] pointer-events-none" />

              <div className="flex items-center justify-between">
                <h2 className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Répartition des Mises
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />
              </div>

              <div className="grid gap-4">
                {sorted.map((item, idx) => {
                  const pct = maxBet > 0 ? (item.total / maxBet) * 100 : 0;
                  const isMin = idx === 0 && item.total > 0;
                  const isWinningNumber = isResolved && draw?.winningNumber === item.number;
                  
                  return (
                    <div key={item.number} className="group transition-all duration-300">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border transition-colors ${
                            isWinningNumber ? "bg-emerald-500 border-emerald-400 text-white" : 
                            isMin && !isResolved ? "bg-gold border-gold/50 text-secondary-foreground" : 
                            "bg-muted/30 border-white/5 text-muted-foreground"
                          }`}>
                            {item.number}
                          </span>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${
                            isWinningNumber ? "text-emerald-brand" : 
                            isMin && !isResolved ? "text-gold" : 
                            "text-foreground/70"
                          }`}>
                            Chiffre {item.number}
                          </span>
                          
                          {isMin && !isResolved && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/10 text-gold text-[8px] font-black uppercase tracking-tighter border border-gold/20 animate-pulse">
                              🎯 Minimum
                            </span>
                          )}
                          {isWinningNumber && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-brand text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">
                              🏆 Gagnant
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-black tabular-nums">
                          {Number(item.total).toLocaleString("fr-FR")} <span className="text-[9px] font-medium text-muted-foreground">CFA</span>
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                            isWinningNumber ? "gradient-emerald shadow-[0_0_15px_rgba(16,185,129,0.3)]" : 
                            isMin && !isResolved ? "gradient-gold shadow-[0_0_15px_rgba(245,158,11,0.3)]" : 
                            "bg-white/20"
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => performDraw.mutate()}
              disabled={isResolved || totalPool === 0 || performDraw.isPending}
              className={`w-full group relative flex items-center justify-center gap-3 font-display font-black text-sm uppercase tracking-[0.2em] h-14 rounded-2xl transition-all duration-500 border shadow-lg ${
                isResolved
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-brand/50 cursor-not-allowed"
                  : performDraw.isPending
                    ? "bg-gold/10 border-gold/20 text-gold cursor-wait"
                    : "gradient-emerald text-secondary-foreground border-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] hover:shadow-emerald-500/20"
              }`}
            >
              {isResolved ? (
                <><Trophy className="w-5 h-5" /> Tirage Clôturé</>
              ) : performDraw.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </div>
              ) : (
                <>
                  <Zap className={`w-5 h-5 transition-transform group-hover:scale-125 ${totalPool > 0 ? 'text-secondary-foreground' : 'opacity-20'}`} /> 
                  Effectuer le Tirage (Auto)
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Onglet Paiements ── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1.5">
                {(["all", "deposit", "withdrawal"] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      filter === f
                        ? "glass-gold text-gold border-gold/30"
                        : "border-border text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    {f === "all" ? "Tout" : f === "deposit" ? "Dépôts" : "Retraits"}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground">{pendingTrans.length} en attente</span>
            </div>

            {isTransLoading && <p className="text-center py-10 text-muted-foreground">Chargement...</p>}

            {!isTransLoading && pendingTrans.length === 0 && (
              <div className="glass-card rounded-2xl p-10 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto opacity-20" />
                <p className="text-muted-foreground text-sm">Aucun paiement en attente.</p>
              </div>
            )}

            {!isTransLoading && Array.isArray(pendingTrans) && pendingTrans.map((trans: any) => (
              <div key={trans.id} className="glass-card rounded-xl p-5 space-y-3 border border-gold/8">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">
                      {trans.type === "deposit" ? "📥 Dépôt" : "📤 Retrait"} — {trans.provider}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs font-medium text-gold flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {trans.user_name}
                      </p>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-brand" />
                        {trans.user_phone}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">ID: {trans.id.substring(0, 12)}...</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(trans.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <p className="font-display text-xl font-black text-gold">
                    {Number(trans.amount).toLocaleString("fr-FR")} CFA
                  </p>
                </div>

                {/* Anti-fraud Alert */}
                {trans.potential_duplicate && (
                  <div className="bg-destructive/15 border border-destructive/30 rounded-lg p-2.5 flex items-center gap-2 text-destructive animate-pulse">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Doublon détecté : Ce SMS a déjà été utilisé !</span>
                  </div>
                )}

                {/* SMS content expandable */}
                {trans.type === "deposit" && trans.sms_content && (
                  <div>
                    <button
                      onClick={() => setExpandedSMS(expandedSMS === trans.id ? null : trans.id)}
                      className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {expandedSMS === trans.id ? "Masquer le SMS" : "Voir le SMS"}
                      {expandedSMS === trans.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedSMS === trans.id && (
                      <div className="mt-2 bg-muted/50 border border-border rounded-xl p-3 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {trans.sms_content}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => reviewTransMutation.mutate({ id: trans.id, action: "reject" })}
                    disabled={reviewTransMutation.isPending}
                    className="flex-1 h-9 text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejeter
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => reviewTransMutation.mutate({ id: trans.id, action: "approve" })}
                    disabled={reviewTransMutation.isPending}
                    className="flex-1 h-9 text-xs font-bold gradient-emerald"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approuver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Onglet Réseaux ── */}
        {activeTab === "networks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-foreground">Configuration USSD</h2>
              <Button 
                size="sm" 
                onClick={() => setIsAddingNetwork(true)}
                className="gradient-gold text-[10px] font-bold h-7"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
              </Button>
            </div>

            {isAddingNetwork && (
              <NetworkForm 
                onCancel={() => setIsAddingNetwork(false)} 
                onSave={(data) => saveNetworkMutation.mutate(data)}
                isLoading={saveNetworkMutation.isPending}
              />
            )}

            <div className="grid gap-3">
              {isNetLoading ? (
                <p className="text-center py-6 text-xs text-muted-foreground italic">Chargement des réseaux...</p>
              ) : networks.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted-foreground italic">Aucun réseau configuré.</p>
              ) : networks.map((net: any) => (
                <div key={net.id} className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                  {editingNetwork?.id === net.id ? (
                    <NetworkForm 
                      network={net}
                      onCancel={() => setEditingNetwork(null)}
                      onSave={(data) => saveNetworkMutation.mutate({ ...data, id: net.id })}
                      isLoading={saveNetworkMutation.isPending}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${net.is_active ? 'glass-gold' : 'bg-muted'}`}>
                            <Globe className={`w-4 h-4 ${net.is_active ? 'text-gold' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{net.name}</p>
                            <p className="text-[10px] text-muted-foreground">Ordre: {net.order}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingNetwork(net)} className="p-1.5 hover:text-gold transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => window.confirm("Supprimer ce réseau ?") && deleteNetworkMutation.mutate(net.id)} 
                            className="p-1.5 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 bg-black/20 rounded-xl p-3 border border-white/5">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Numéro de destination</p>
                          <p className="text-xs font-mono text-emerald-brand">{net.destination_number}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Template USSD</p>
                          <p className="text-[11px] font-mono text-gold break-all">{net.ussd_template}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${net.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                          {net.is_active ? 'ACTIF' : 'INACTIF'}
                        </span>
                        <p className="text-[9px] text-muted-foreground">Utilisez <code className="text-gold">{"{amount}"}</code> et <code className="text-gold">{"{destination}"}</code> dans le template.</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Onglet Statistiques ── */}
        {activeTab === "stats" && (
          <div className="space-y-6 pb-6">
            {/* 1. Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="glass-card rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">Total Mises</p>
                <p className="text-lg font-display font-bold text-foreground">
                  {Number(globalStats?.summary?.totalBets || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-muted-foreground">CFA</span>
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">Paiements Joueurs</p>
                <p className="text-lg font-display font-bold text-destructive">
                  -{Number(globalStats?.summary?.totalGains || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-muted-foreground">CFA</span>
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/5 bg-gold/5">
                <p className="text-[9px] uppercase text-gold/70 font-black mb-1">Gain du Système (Brut)</p>
                <p className={`text-lg font-display font-bold ${Number(globalStats?.summary?.systemGains || 0) >= 0 ? "text-gold" : "text-destructive"}`}>
                  {Number(globalStats?.summary?.systemGains || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-muted-foreground">CFA</span>
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">Bonus Parrainage</p>
                <p className="text-lg font-display font-bold text-amber-500">
                  -{Number(globalStats?.summary?.totalReferralBonuses || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-muted-foreground">CFA</span>
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4 border border-white/5 bg-emerald-500/10">
                <p className="text-[9px] uppercase text-emerald-400 font-black mb-1">Bénéfice Net Final</p>
                <p className={`text-lg font-display font-bold ${Number(globalStats?.summary?.netProfit || 0) >= 0 ? "text-emerald-brand" : "text-destructive"}`}>
                  {Number(globalStats?.summary?.netProfit || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-muted-foreground">CFA</span>
                </p>
              </div>
            </div>

            {/* 2. Charts Section */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Volume de Mises (30 derniers jours)</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                    <span className="text-[10px] text-muted-foreground">Mises</span>
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalStats?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 12%)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} 
                        tickFormatter={(val: string) => val.split('-').slice(2).join('/')}
                      />
                      <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ background: "hsl(224 18% 8%)", border: "1px solid hsl(220 20% 13%)", borderRadius: "12px", color: "hsl(220 15% 92%)" }}
                        labelFormatter={(val: string) => `Date : ${val}`}
                      />
                      <Bar dataKey="bets" fill="hsl(43 96% 56%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Activité par Heure (Dernières 24h)</h2>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalStats?.hourlyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 12%)" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} 
                        tickFormatter={(val: string) => `${val}h`}
                      />
                      <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ background: "hsl(224 18% 8%)", border: "1px solid hsl(220 20% 13%)", borderRadius: "12px", color: "hsl(220 15% 92%)" }}
                        labelFormatter={(val: string) => `Heure : ${val}h`}
                      />
                      <Bar dataKey="bets" fill="hsl(162 78% 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/5">
                <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-4">Répartition du Tirage Actuel</h2>
                <div className="h-[220px] w-full">
                  {totalPool === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10 italic">Aucun pari pour le tirage en cours.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allNumbers} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 12%)" />
                        <XAxis dataKey="number" tick={{ fill: "hsl(220 10% 50%)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(224 18% 8%)", border: "1px solid hsl(220 20% 13%)", borderRadius: "12px", color: "hsl(220 15% 92%)" }}
                          formatter={(v: any) => [`${Number(v).toLocaleString("fr-FR")} CFA`, "Mises"]}
                          labelFormatter={(l) => `Chiffre ${l}`}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                          {allNumbers.map((entry) => (
                            <Cell
                              key={entry.number}
                              fill={entry.number === winner?.number && !isResolved ? "hsl(162 78% 40%)" : "hsl(43 96% 56%)"}
                              fillOpacity={entry.total === 0 ? 0.2 : 0.85}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Onglet Membres ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-foreground">Utilisateurs ({users.length})</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })} className="h-7 text-[10px] font-bold">
                  Rafraîchir
                </Button>
              </div>
            </div>

            {isUsersLoading ? (
              <p className="text-center py-10 text-muted-foreground italic">Chargement des membres...</p>
            ) : (
              <div className="grid gap-3">
                {users.map((u: any) => (
                  <div key={u.id} className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.is_blocked ? 'bg-destructive/20' : 'glass-gold'}`}>
                          <User className={`w-5 h-5 ${u.is_blocked ? 'text-destructive' : 'text-gold'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{u.display_name}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "Pas de numéro"}</p>
                          {u.is_blocked && (
                            <span className="text-[10px] text-destructive font-black uppercase tracking-tighter">Compte bloqué</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gold">{Number(u.balance).toLocaleString("fr-FR")} CFA</p>
                        <p className="text-[10px] text-muted-foreground">Rôle: {u.role}</p>
                      </div>
                    </div>

                    {editingUser === u.id ? (
                      <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-3 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-muted-foreground font-bold">Nouveau solde</label>
                            <input 
                              type="number"
                              value={balanceForm.amount}
                              onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                              className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
                              placeholder="Montant total..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-muted-foreground font-bold">Raison</label>
                            <input 
                              value={balanceForm.reason}
                              onChange={e => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                              className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
                              placeholder="Litige, Bonus..."
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingUser(null)} 
                            className="flex-1 h-8 text-[10px] font-bold"
                          > Annuler</Button>
                          <Button 
                            size="sm" 
                            onClick={() => updateBalanceMutation.mutate({ 
                              user_id: u.id, 
                              new_balance: Number(balanceForm.amount), 
                              reason: balanceForm.reason 
                            })}
                            disabled={updateBalanceMutation.isPending}
                            className="flex-1 h-8 text-[10px] font-bold gradient-gold"
                          >
                            Mettre à jour
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1 border-t border-white/5 pt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingUser(u.id);
                            setBalanceForm({ amount: String(u.balance), reason: "" });
                          }}
                          className="flex-1 h-8 text-[10px] font-bold"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Ajuster solde
                        </Button>
                        <Button 
                          size="sm" 
                          variant={u.is_blocked ? "outline" : "destructive"}
                          onClick={() => toggleUserBlockMutation.mutate({ user_id: u.id, is_blocked: !u.is_blocked })}
                          disabled={toggleUserBlockMutation.isPending}
                          className="flex-1 h-8 text-[10px] font-bold"
                        >
                          {u.is_blocked ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {u.is_blocked ? "Débloquer" : "Bloquer"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Réglages ── */}
        {activeTab === "game_settings" && (
          <div className="space-y-4">
              <h2 className="font-display text-sm font-bold text-foreground">Paramètres du Jeu</h2>
            
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                     <label className="text-xs font-bold text-foreground">Multiplicateur de Gain</label>
                    <span className="text-xs font-black text-gold">x{gameSettings?.multiplier || 5}</span>
                  </div>
                  <input 
                    type="range" min="2" max="10" step="0.5"
                    value={gameSettings?.multiplier || 5}
                    onChange={e => updateSettingsMutation.mutate({ ...gameSettings, multiplier: Number(e.target.value) })}
                    className="w-full accent-gold h-1.5 bg-muted rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Facteur multiplicatif appliqué à la mise gagnante (ex: 1000 CFA x 5 = 5000 CFA).</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold">Mise Minimum (CFA)</label>
                    <input 
                      type="number"
                      defaultValue={gameSettings?.min_bet || 100}
                      onBlur={e => updateSettingsMutation.mutate({ ...gameSettings, min_bet: Number(e.target.value) })}
                      className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-bold">Mise Maximum (CFA)</label>
                    <input 
                      type="number"
                      defaultValue={gameSettings?.max_bet || 50000}
                      onBlur={e => updateSettingsMutation.mutate({ ...gameSettings, max_bet: Number(e.target.value) })}
                      className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-brand flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-brand/80 leading-relaxed"> Ces paramètres s'appliquent en temps réel à tous les nouveaux paris et futurs tirages. Les paris déjà placés conservent les règles au moment de la mise. </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Onglet SMS ── */}
        {activeTab === "sms_logs" && (
          <div className="space-y-4">
            <h2 className="font-display text-sm font-bold text-foreground">SMS non reconnus</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Voici les messages que le système n'a pas pu parser automatiquement. 
              Utilisez-les pour vérifier manuellement les dépôts ou améliorer les Regex.
            </p>

            <div className="grid gap-3">
              {failedSms.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 text-center border border-white/5">
                  <p className="text-sm text-muted-foreground italic">Aucun SMS en échec. Le parsing fonctionne bien !</p>
                </div>
              ) : (
                failedSms.map((s: any) => (
                  <div key={s.id} className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground font-mono">{s.id}</span>
                      <span className="text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                      <p className="text-xs font-mono text-gold whitespace-pre-wrap break-all uppercase leading-relaxed">
                        {s.sms_content}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-muted-foreground">Utilisateur: <span className="text-foreground font-bold">{s.user_id}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Onglet Maintenance ── */}
        {activeTab === "maintenance" && (
          <div className="space-y-4">
            <div className={`glass-card rounded-2xl p-5 border transition-all duration-300 ${maintenanceActive ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${maintenanceActive ? "bg-destructive/15" : "glass-gold"}`}>
                    <Power className={`w-5 h-5 ${maintenanceActive ? "text-destructive" : "text-gold"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Mode Maintenance</p>
                    <p className={`text-xs font-medium ${maintenanceActive ? "text-destructive" : "text-emerald-brand"}`}>
                      {maintenanceActive ? "⚠ ACTIF — Paiements et Paris bloqués" : "✓ INACTIF — Système opérationnel"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => maintenanceMutation.mutate({ active: !maintenanceActive, message: maintenanceMsg })}
                  disabled={maintenanceMutation.isPending}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${maintenanceActive ? "bg-destructive" : "bg-muted"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${maintenanceActive ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Message affiché aux utilisateurs</label>
                <textarea
                  value={maintenanceMsg}
                  onChange={e => setMaintenanceMsg(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm text-foreground min-h-[80px] focus:outline-none focus:border-gold/40 resize-none"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Informations Système</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Tirage automatique</span>
                  <span className="text-emerald-brand font-medium">✓ Actif (18:00 WAT)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Création auto du tirage</span>
                  <span className="text-emerald-brand font-medium">✓ Actif (00:00 WAT)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Mise minimum</span>
                  <span className="text-foreground font-medium">{gameSettings?.min_bet || 100} CFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Mise maximum</span>
                  <span className="text-foreground font-medium">{Number(gameSettings?.max_bet || 50000).toLocaleString("fr-FR")} CFA</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const StatMini = ({ icon, value, label, className }: { icon: React.ReactNode; value: string; label: string; className?: string }) => (
  <div className={`glass-card rounded-2xl p-4 border border-white/5 space-y-1 shadow-lg transition-all hover:scale-[1.02] ${className}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
        {icon}
      </div>
    </div>
    <p className="font-display text-sm font-black text-foreground tracking-tight">{value}</p>
    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
  </div>
);

export default AdminDashboard;

const NetworkForm = ({ network, onCancel, onSave, isLoading }: any) => {
  const [formData, setFormData] = useState({
    name: network?.name || "",
    ussd_template: network?.ussd_template || "*145*1*{amount}*{destination}#",
    destination_number: network?.destination_number || "",
    is_active: network?.is_active ?? true,
    order: network?.order ?? 0
  });

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold">Nom (ex: T-Money)</label>
          <input 
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-9 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
            placeholder="Nom du réseau"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold">Destinataire</label>
          <input 
            value={formData.destination_number}
            onChange={e => setFormData({ ...formData, destination_number: e.target.value })}
            className="w-full h-9 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
            placeholder="Numéro qui reçoit"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase font-bold">Template USSD</label>
        <input 
          value={formData.ussd_template}
          onChange={e => setFormData({ ...formData, ussd_template: e.target.value })}
          className="w-full h-9 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs font-mono focus:border-gold/50 outline-none"
          placeholder="*145*1*{amount}*{destination}#"
        />
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.is_active} 
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-3.5 h-3.5 accent-gold"
            />
            <span className="text-[10px] font-bold">Actif</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold">Ordre:</span>

            <input 
            
              type="number"
              value={formData.order}
              onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="w-12 h-7 bg-muted/40 border border-white/10 rounded px-2 text-[10px] focus:border-gold/50 outline-none"
            />

          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-[10px] font-bold">Annuler</Button>
          <Button onClick={() => onSave(formData)} disabled={isLoading} className="h-8 text-[10px] font-bold gradient-gold">
            <Save className="w-3.5 h-3.5 mr-1" /> {isLoading ? "Soumission..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
};
