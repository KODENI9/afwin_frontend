import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Zap,
  Trophy,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Power,
  Filter,
  Users,
  DollarSign,
  Dices,
  Phone,
  User,
  Settings,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  TrendingUp,
  Wallet,
  History,
  Mail,
  Activity,
  Megaphone,
} from "lucide-react";
import { drawsApi, adminApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { AdminPermission } from "@/types/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import ErrorBoundary from "@/components/ErrorBoundary";

type Tab =
  | "draws"
  | "payments"
  | "stats"
  | "networks"
  | "users"
  | "game_settings"
  | "sms_logs"
  | "maintenance"
  | "intelligence"
  | "audit"
  | "notifications";
type Filter = "all" | "deposit" | "withdrawal";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { isAdmin, hasPermission, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("draws");
  const [expandedSMS, setExpandedSMS] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(
    "Le service est temporairement en maintenance.",
  );
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [balanceForm, setBalanceForm] = useState({ amount: "", reason: "" });
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({
    user_id: "",
    title: "",
    message: "",
    type: "info",
    target: "user" as "user" | "all",
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Get today's draw
  const { data: draw, error: drawError } = useQuery({
    queryKey: ["adminDraw"],
    queryFn: () => drawsApi.getCurrent(),
    enabled: isAdmin && (hasPermission(AdminPermission.VIEW_DASHBOARD) || hasPermission(AdminPermission.MANAGE_DRAWS)),
  });

  // Get draw stats
  const { data: stats } = useQuery({
    queryKey: ["adminDrawStats", draw?.id],
    queryFn: () => adminApi.getDrawStats(draw!.id),
    enabled: !!draw?.id && isAdmin && hasPermission(AdminPermission.VIEW_ADVANCED_STATS),
  });

  // Get pending transactions
  const {
    data: allPendingTrans = [],
    isLoading: isTransLoading,
    error: transError,
  } = useQuery({
    queryKey: ["adminPendingTrans"],
    queryFn: () => adminApi.getPendingTransactions(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_FINANCIALS),
  });

  // Get networks
  const {
    data: networks = [],
    isLoading: isNetLoading,
    refetch: refetchNetworks,
  } = useQuery({
    queryKey: ["adminNetworks"],
    queryFn: () => adminApi.getNetworks(),
    enabled: isAdmin && hasPermission(AdminPermission.MANAGE_NETWORKS),
  });

  // Get game settings
  const { data: gameSettings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => adminApi.getSettings(),
    enabled: isAdmin && hasPermission(AdminPermission.MANAGE_SETTINGS),
  });

  // Get users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminApi.getUsers(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_USERS),
  });

  // Get global stats (Conditional for Super/Basic)
  const { data: globalStats } = useQuery({
    queryKey: ["globalStats"],
    queryFn: () => adminApi.getGlobalStats(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_DASHBOARD),
  });

  // NEW: Pending notifications for validation (Super Admin)
  const { data: pendingNotifications = [], isLoading: isNotifsLoading } = useQuery({
    queryKey: ["pendingNotifications"],
    queryFn: () => adminApi.getPendingNotifications(),
    enabled: isAdmin && profile?.role === "super_admin",
  });

  // Get failed SMS
  const { data: failedSms = [] } = useQuery({
    queryKey: ["failedSms"],
    queryFn: () => adminApi.getFailedSMS(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_ADVANCED_STATS),
  });

  // NEW: Daily stats history
  const { data: dailyHistory } = useQuery({
    queryKey: ["adminDailyStats"],
    queryFn: () => adminApi.getDailyStats(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_FINANCIALS) && (activeTab === "stats" || activeTab === "intelligence"),
  });

  // NEW: Smart players
  const { data: smartPlayers = [] } = useQuery({
    queryKey: ["adminSmartPlayers"],
    queryFn: () => adminApi.getSmartPlayers(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_ADVANCED_STATS) && activeTab === "intelligence",
  });

  // NEW: Audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: () => adminApi.getAuditLogs(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_AUDIT_LOGS) && activeTab === "audit",
  });

  // NEW: Profit simulations
  const { data: simulations } = useQuery({
    queryKey: ["adminSimulations"],
    queryFn: () => adminApi.getProfitSimulations(),
    enabled: isAdmin && hasPermission(AdminPermission.VIEW_PROFIT) && activeTab === "intelligence",
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

  const pendingTrans =
    filter === "all" || !Array.isArray(allPendingTrans)
      ? Array.isArray(allPendingTrans)
        ? allPendingTrans
        : []
      : allPendingTrans.filter((t: any) => t.type === filter);

  const reviewTransMutation = useMutation({
    mutationFn: (data: { id: string; action: "approve" | "reject" }) =>
      adminApi.reviewTransaction(data.id, data.action),
    onSuccess: (data) => {
      toast.success(data.message || "Opération réussie");
      queryClient.invalidateQueries({ queryKey: ["adminPendingTrans"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (data: { active: boolean; message: string }) =>
      adminApi.setMaintenance(data.active, data.message),
    onSuccess: (res) => {
      toast.success(res.message || "Mode maintenance mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminMaintenance"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const saveNetworkMutation = useMutation({
    mutationFn: (net: any) => adminApi.saveNetwork(net),
    onSuccess: () => {
      toast.success("Réseau enregistré");
      queryClient.invalidateQueries({ queryKey: ["adminNetworks"] });
      setEditingNetwork(null);
      setIsAddingNetwork(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => adminApi.updateSettings(settings),
    onSuccess: () => {
      toast.success("Paramètres mis à jour");
      queryClient.invalidateQueries({ queryKey: ["gameSettings"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const toggleUserBlockMutation = useMutation({
    mutationFn: (data: { user_id: string; is_blocked: boolean }) =>
      adminApi.toggleUserBlock(data.user_id, data.is_blocked),
    onSuccess: () => {
      toast.success("Statut utilisateur mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const updateBalanceMutation = useMutation({
    mutationFn: (data: {
      user_id: string;
      new_balance: number;
      reason: string;
    }) =>
      adminApi.updateUserBalance(data.user_id, data.new_balance, data.reason),
    onSuccess: () => {
      toast.success("Solde mis à jour");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setEditingUser(null);
      setBalanceForm({ amount: "", reason: "" });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNetwork(id),
    onSuccess: () => {
      toast.success("Réseau supprimé");
      queryClient.invalidateQueries({ queryKey: ["adminNetworks"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });
  const createNotifMutation = useMutation({
    mutationFn: (data: any) => adminApi.createGlobalNotification(data),
    onSuccess: (data) => {
      toast.success(data.message || "Notification envoyée pour validation");
      setShowNotifModal(false);
      setNotifForm({
        user_id: "",
        title: "",
        message: "",
        type: "info",
        target: "all",
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const approveNotifMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveNotification(id),
    onSuccess: () => {
      toast.success("Notification approuvée et diffusée");
      queryClient.invalidateQueries({ queryKey: ["pendingNotifications"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const rejectNotifMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      adminApi.rejectNotification(data.id, data.reason),
    onSuccess: () => {
      toast.success("Notification rejetée");
      queryClient.invalidateQueries({ queryKey: ["pendingNotifications"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const fetchUserHistory = async (userId: string, name: string) => {
    setIsHistoryLoading(true);
    setSelectedUserHistory({ id: userId, name });
    setShowHistoryModal(true);
    try {
      const data = await adminApi.getUserTransactions(userId);
      setUserHistory(data || []);
    } catch (err) {
      toast.error("Échec de récupération de l'historique");
    } finally {
      setIsHistoryLoading(false);
    }
  };

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
  // FIX: Le gagnant attendu est TOUJOURS celui avec le minimum absolu (incluant les zéros)
  const winner = sorted[0];
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
    onError: (err: any) =>
      toast.error(err.response?.data?.error || err.message),
  });

  const forceResolve = useMutation({
    mutationFn: () => adminApi.forceResolveClosedDraws(),
    onSuccess: (data: any) => {
      const resolved = (data.results || []).filter((r: any) => r.resolved);
      const skipped = (data.results || []).filter((r: any) => r.skipped);
      if (resolved.length > 0) {
        toast.success(
          `${resolved.length} tirage(s) résolu(s) ! Chiffres gagnants: ${resolved.map((r: any) => r.winningNumber).join(', ')}`,
          { icon: <Trophy className="w-4 h-4" />, duration: 6000 }
        );
      } else if (skipped.length > 0) {
        toast.info('Tous les tirages CLOSED étaient déjà verrouillés.');
      } else {
        toast.info('Aucun tirage CLOSED trouvé à résoudre.');
      }
      queryClient.invalidateQueries({ queryKey: ["adminDraw"] });
      queryClient.invalidateQueries({ queryKey: ["draws"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });


  
  const ALL_TABS: { id: Tab; label: string; icon: any; count?: number; permission?: AdminPermission; requiresSuperAdmin?: boolean }[] = [
    { id: "draws", label: "Tirages", icon: Dices, permission: AdminPermission.MANAGE_DRAWS },
    {
      id: "payments",
      label: "Paiements",
      icon: Wallet,
      count: allPendingTrans.length,
      permission: AdminPermission.VIEW_FINANCIALS
    },
    { 
      id: "notifications", 
      label: "Validations", 
      icon: MessageSquare, 
      count: pendingNotifications.length,
      requiresSuperAdmin: true // Restricted tightly to super_admin
    },
    { id: "stats", label: "Stats", icon: BarChart2, permission: AdminPermission.VIEW_DASHBOARD },
    { id: "intelligence", label: "Intelligence", icon: TrendingUp, permission: AdminPermission.VIEW_ADVANCED_STATS },
    { id: "audit", label: "Audit", icon: History, permission: AdminPermission.VIEW_AUDIT_LOGS },
    { id: "users", label: "Membres", icon: Users, permission: AdminPermission.VIEW_USERS },
    { id: "networks", label: "Réseaux", icon: Globe, permission: AdminPermission.MANAGE_NETWORKS },
    { id: "game_settings", label: "Réglages", icon: Settings, permission: AdminPermission.MANAGE_SETTINGS },
    { id: "sms_logs", label: "SMS", icon: MessageSquare, permission: AdminPermission.VIEW_ADVANCED_STATS },
    { id: "maintenance", label: "Système", icon: Power, permission: AdminPermission.MANAGE_SETTINGS },
  ];

  const TABS = ALL_TABS.filter(tab => 
    (!tab.permission || hasPermission(tab.permission)) &&
    (!tab.requiresSuperAdmin || profile?.role === 'super_admin')
  );

  // If active tab was restricted, fallback to first available
  useEffect(() => {
    if (TABS.length > 0 && !TABS.find(t => t.id === activeTab)) {
      setActiveTab(TABS[0].id);
    }
  }, [TABS, activeTab]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Administration
            </h1>
          </div>
          {hasPermission(AdminPermission.SEND_GLOBAL_NOTIFICATION) && (
            <Button
              size="sm"
              onClick={() => {
                setNotifForm({ ...notifForm, target: "all", user_id: "" });
                setShowNotifModal(true);
              }}
              className="h-8 text-[10px] font-black uppercase tracking-widest gradient-gold border-gold/40"
            >
              <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Diffusion Globale
            </Button>
          )}
        </div>

        {/* Tabs - Modern Minimalist Style */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar glass p-1.5 rounded-2xl border border-white/5 sticky top-20 bg-background/10 backdrop-blur-md z-30 shadow-xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group ${
                  isActive
                    ? "glass-gold text-gold shadow-lg shadow-gold/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 opacity-60"}`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="flex items-center justify-center min-w-[16px] h-4 bg-destructive text-white text-[8px] font-black px-1 rounded-full shadow-lg shadow-destructive/20 ml-1">
                    {tab.count}
                  </span>
                )}
                {/* Active Underline Indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-gold rounded-full blur-[0.5px] animate-in slide-in-from-bottom-1 duration-300" />
                )}
              </button>
            );
          })}
        </div>

        <ErrorBoundary>
          <div key={activeTab} className="space-y-6">
            {/* ── Onglet Tirage ── */}
            {activeTab === "draws" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Status Indicator */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isResolved ? "bg-muted" : "bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20"}`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {isResolved
                        ? "Tirage Résolu"
                        : draw?.status === "CLOSED"
                          ? "Paris Clos (En résolution)"
                          : `Session Ouverte - Slot ${draw?.slotId || "?"}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gold">
                      ID: {draw?.id}
                    </span>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold">
                      Système Multi-Tirages
                    </span>
                  </div>
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
                    value={
                      isResolved
                        ? String(draw?.winningNumber)
                        : winner?.number
                          ? String(winner.number)
                          : "—"
                    }
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
                      // FIX: Marquer comme minimum même si c'est 0 (car c'est le but du système)
                      const isMin = idx === 0;
                      const isWinningNumber =
                        isResolved && draw?.winningNumber === item.number;

                      return (
                        <div
                          key={item.number}
                          className="group transition-all duration-300"
                        >
                          <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border transition-colors ${
                                  isWinningNumber
                                    ? "bg-emerald-500 border-emerald-400 text-white"
                                    : isMin && !isResolved
                                      ? "bg-gold border-gold/50 text-secondary-foreground"
                                      : "bg-muted/30 border-white/5 text-muted-foreground"
                                }`}
                              >
                                {item.number}
                              </span>
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${
                                  isWinningNumber
                                    ? "text-emerald-brand"
                                    : isMin && !isResolved
                                      ? "text-gold"
                                      : "text-foreground/70"
                                }`}
                              >
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
                              {Number(item.total).toLocaleString("fr-FR")}{" "}
                              <span className="text-[9px] font-medium text-muted-foreground">
                                CFA
                              </span>
                            </span>
                          </div>
                          <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                                isWinningNumber
                                  ? "gradient-emerald shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                  : isMin && !isResolved
                                    ? "gradient-gold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                    : "bg-white/20"
                              }`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => performDraw.mutate()}
                  disabled={isResolved || totalPool === 0 || performDraw.isPending || profile?.role !== "super_admin"}
                  className={`w-full group relative flex items-center justify-center gap-3 font-display font-black text-sm uppercase tracking-[0.2em] h-14 rounded-2xl transition-all duration-500 border shadow-lg ${
                    isResolved
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-brand/50 cursor-not-allowed"
                      : profile?.role !== "super_admin"
                        ? "bg-muted/20 border-white/5 text-muted-foreground/50 cursor-not-allowed"
                        : performDraw.isPending
                          ? "bg-gold/10 border-gold/20 text-gold cursor-wait"
                          : "gradient-emerald text-secondary-foreground border-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] hover:shadow-emerald-500/20"
                  }`}
                >
                  {isResolved ? (
                    <span key="draw-resolved" className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Tirage Clôturé
                    </span>
                  ) : profile?.role !== "super_admin" ? (
                    <span key="draw-restricted" className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 opacity-50" />
                      Résolution (Super Admin uniquement)
                    </span>
                  ) : performDraw.isPending ? (
                    <span key="draw-pending" className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </span>
                  ) : (
                    <span key="draw-ready" className="flex items-center gap-2">
                      <Zap className={`w-5 h-5 transition-transform group-hover:scale-125 ${totalPool > 0 ? "text-secondary-foreground" : "opacity-20"}`} />
                      Effectuer le Tirage (Super Admin)
                    </span>
                  )}
                </button>

                {/* Emergency: Force resolve CLOSED draws when no active draw */}
                {!draw && (
                  <button
                    onClick={() => forceResolve.mutate()}
                    disabled={forceResolve.isPending}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest border border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                  >
                    {forceResolve.isPending ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    {forceResolve.isPending ? "Résolution..." : "⚡ Débloquer Tirages CLOSED"}
                  </button>
                )}
              </div>
            )}

            {/* ── Onglet Paiements ── */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex gap-1.5">
                    {(["all", "deposit", "withdrawal"] as Filter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          filter === f
                            ? "glass-gold text-gold border-gold/30"
                            : "border-border text-muted-foreground hover:border-white/20"
                        }`}
                      >
                        {f === "all"
                          ? "Tout"
                          : f === "deposit"
                            ? "Dépôts"
                            : "Retraits"}
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {pendingTrans.length} en attente
                  </span>
                </div>

                {isTransLoading && (
                  <p className="text-center py-10 text-muted-foreground">
                    Chargement...
                  </p>
                )}

                {!isTransLoading && pendingTrans.length === 0 && (
                  <div className="glass-card rounded-2xl p-10 text-center space-y-3">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto opacity-20" />
                    <p className="text-muted-foreground text-sm">
                      Aucun paiement en attente.
                    </p>
                  </div>
                )}

                {!isTransLoading &&
                  Array.isArray(pendingTrans) &&
                  pendingTrans.map((trans: any) => (
                    <div
                      key={trans.id}
                      className="glass-card rounded-xl p-5 space-y-3 border border-gold/8"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-foreground">
                            {trans.type === "deposit"
                              ? "📥 Dépôt"
                              : "📤 Retrait"}{" "}
                            — {trans.provider}
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
                          <p className="text-[10px] text-muted-foreground mt-1">
                            ID: {trans.id.substring(0, 12)}...
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(trans.created_at).toLocaleString(
                              "fr-FR",
                              { dateStyle: "short", timeStyle: "short" },
                            )}
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
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Doublon détecté : Ce SMS a déjà été utilisé !
                          </span>
                        </div>
                      )}

                      {/* SMS content expandable */}
                      {trans.type === "deposit" && trans.sms_content && (
                        <div>
                          <button
                            onClick={() =>
                              setExpandedSMS(
                                expandedSMS === trans.id ? null : trans.id,
                              )
                            }
                            className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {expandedSMS === trans.id
                              ? "Masquer le SMS"
                              : "Voir le SMS"}
                            {expandedSMS === trans.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
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
                          onClick={() =>
                            reviewTransMutation.mutate({
                              id: trans.id,
                              action: "reject",
                            })
                          }
                          disabled={reviewTransMutation.isPending}
                          className="flex-1 h-9 text-xs font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejeter
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            reviewTransMutation.mutate({
                              id: trans.id,
                              action: "approve",
                            })
                          }
                          disabled={reviewTransMutation.isPending}
                          className="flex-1 h-9 text-xs font-bold gradient-emerald"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />{" "}
                          Approuver
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
                  <h2 className="font-display text-sm font-bold text-foreground">
                    Configuration USSD
                  </h2>
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
                    <p className="text-center py-6 text-xs text-muted-foreground italic">
                      Chargement des réseaux...
                    </p>
                  ) : networks.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground italic">
                      Aucun réseau configuré.
                    </p>
                  ) : (
                    networks.map((net: any) => (
                      <div
                        key={net.id}
                        className="glass-card rounded-2xl p-4 border border-white/5 space-y-3"
                      >
                        {editingNetwork?.id === net.id ? (
                          <NetworkForm
                            network={net}
                            onCancel={() => setEditingNetwork(null)}
                            onSave={(data) =>
                              saveNetworkMutation.mutate({
                                ...data,
                                id: net.id,
                              })
                            }
                            isLoading={saveNetworkMutation.isPending}
                          />
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${net.is_active ? "glass-gold" : "bg-muted"}`}
                                >
                                  <Globe
                                    className={`w-4 h-4 ${net.is_active ? "text-gold" : "text-muted-foreground"}`}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-foreground">
                                    {net.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Ordre: {net.order}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingNetwork(net)}
                                  className="p-1.5 hover:text-gold transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    window.confirm("Supprimer ce réseau ?") &&
                                    deleteNetworkMutation.mutate(net.id)
                                  }
                                  className="p-1.5 hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2 bg-black/20 rounded-xl p-3 border border-white/5">
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                  Numéro de destination
                                </p>
                                <p className="text-xs font-mono text-emerald-brand">
                                  {net.destination_number}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                  Template USSD
                                </p>
                                <p className="text-[11px] font-mono text-gold break-all">
                                  {net.ussd_template}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${net.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}
                              >
                                {net.is_active ? "ACTIF" : "INACTIF"}
                              </span>
                              <p className="text-[9px] text-muted-foreground">
                                Utilisez{" "}
                                <code className="text-gold">{"{amount}"}</code>{" "}
                                et{" "}
                                <code className="text-gold">
                                  {"{destination}"}
                                </code>{" "}
                                dans le template.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Onglet Statistiques ── */}
            {activeTab === "stats" && (
              <div className="space-y-6 pb-6">
                {/* 1. Stat Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">
                      Total Utilisateurs
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">
                      {globalStats?.summary?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">
                      Volume GLOBAL Mises
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">
                      {Number(
                        globalStats?.summary?.totalBets || 0,
                      ).toLocaleString("fr-FR")}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        CFA
                      </span>
                    </p>
                  </div>
                  {profile?.role === "super_admin" && (
                    <div className="glass-card rounded-2xl p-4 border border-white/5 bg-emerald-500/10">
                      <p className="text-[9px] uppercase text-emerald-400 font-black mb-1">
                        Bénéfice Net (Bets-Gains)
                      </p>
                      <p
                        className={`text-lg font-display font-bold ${Number(globalStats?.summary?.netProfit || 0) >= 0 ? "text-emerald-brand" : "text-destructive"}`}
                      >
                        {Number(
                          globalStats?.summary?.netProfit || 0,
                        ).toLocaleString("fr-FR")}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          CFA
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">
                      Mises du Jour
                    </p>
                    <p className="text-lg font-display font-bold text-gold">
                      {Number(
                        dailyHistory?.bets?.[(dailyHistory?.bets?.length || 0) - 1] || 0,
                      ).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {profile?.role === "super_admin" && (
                    <div className="glass-card rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] uppercase text-muted-foreground font-black mb-1">
                        Profit du Jour
                      </p>
                      <p className="text-lg font-display font-bold text-emerald-brand">
                        {Number(
                          dailyHistory?.profits?.[
                            (dailyHistory?.profits?.length || 0) - 1
                          ] || 0,
                        ).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Charts Section (Super Admin only) */}
                {profile?.role === "super_admin" && (
                  <div className="space-y-4">
                    <div className="glass-card rounded-2xl p-5 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                          Profit Net Journalier (30 Jours)
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-muted-foreground">Profit</span>
                        </div>
                      </div>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailyHistory?.labels?.map((label: any, i: number) => ({
                              day: label,
                              profit: dailyHistory?.profits?.[i] || 0,
                              bets: dailyHistory?.bets?.[i] || 0,
                            })) || []}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 12%)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} />
                            <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: "hsl(224 18% 8%)", border: "1px solid hsl(220 20% 13%)", borderRadius: "12px", color: "hsl(220 15% 92%)" }} />
                            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass-card rounded-2xl p-5 border border-white/5">
                        <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-4">
                          Répartition du Tirage Actuel
                        </h2>
                        <div className="h-[220px] w-full">
                          {totalPool === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-10 italic">
                              Aucun pari pour le tirage en cours.
                            </p>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={allNumbers} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="number" tick={{ fill: "hsl(220 10% 50%)", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "hsl(224 18% 8%)", border: "1px solid hsl(220 20% 13%)", borderRadius: "12px" }} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                  {allNumbers.map((entry) => (
                                    <Cell
                                      key={entry.number}
                                      fill={entry.number === winner?.number && !isResolved ? "#10b981" : "#f59e0b"}
                                      fillOpacity={entry.total === 0 ? 0.2 : 0.85}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      <div className="glass-card rounded-2xl p-5 border border-white/5">
                        <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-4">
                          Volume vs Gains
                        </h2>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Taux de Payout</span>
                            <span className="font-bold">
                              {(globalStats?.summary?.totalBets || 0) > 0
                                ? (((globalStats?.summary?.totalPayouts || 0) / (globalStats?.summary?.totalBets || 1)) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <Progress
                            value={(globalStats?.summary?.totalBets || 0) > 0
                              ? ((globalStats?.summary?.totalPayouts || 0) / (globalStats?.summary?.totalBets || 1)) * 100
                              : 0}
                            className="h-2"
                          />
                          <div className="pt-4 space-y-2">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between">
                              <span className="text-xs text-muted-foreground">Total Dépôts</span>
                              <span className="text-xs font-bold">
                                {Number(globalStats?.summary?.totalDeposits || 0).toLocaleString()} CFA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ── Onglet Intelligence ── */}
            {activeTab === "intelligence" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Smart Players */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-gold" />
                      <h2 className="font-display text-sm font-bold">
                        Détection Stratégique (ROI {">"} 2.5)
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {(smartPlayers || []).length === 0 ? (
                        <div className="text-xs text-muted-foreground italic py-4">
                          Aucun joueur suspect détecté pour le moment.
                        </div>
                      ) : (
                        smartPlayers.map((p: any, idx: number) => (
                          <div
                            key={p.id || `smart-${idx}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold">
                                {p.display_name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {p.phone}
                              </div>
                            </div>
                            <div className="text-right space-y-0.5">
                              <div
                                className={`text-xs font-black ${p.roi > 3 ? "text-destructive" : "text-gold"}`}
                              >
                                ROI: {p.roi}x
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Score: {p.score}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Simulation Engine */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <h2 className="font-display text-sm font-bold">
                        Optimisation du Modèle
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        Simulation basée sur les{" "}
                        {(simulations?.totalPoolInSample || 0).toLocaleString()}{" "}
                        CFA misés récemment.
                      </div>
                      <div className="grid gap-2">
                        {(simulations?.simulations || []).map(
                          (s: any, idx: number) => (
                            <div
                              key={s.label || `sim-${idx}`}
                              className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5"
                            >
                              <span className="text-xs font-medium">
                                {s.label}
                              </span>
                              <span className="text-xs font-bold text-emerald-brand">
                                +{s.profit.toLocaleString()} CFA
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Audit ── */}
            {activeTab === "audit" && (
              <div className="space-y-4 animate-in fade-in duration-500 pb-20">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-sm font-bold">
                    Journal d'Audit Financier
                  </h2>
                  <span className="text-[10px] text-muted-foreground italic">
                    Dernières 50 actions
                  </span>
                </div>
                <div className="grid gap-2">
                  {(auditLogs || []).length === 0 ? (
                    <p className="text-center py-10 text-xs text-muted-foreground">
                      Aucun log disponible.
                    </p>
                  ) : (
                    auditLogs.map((log: any, idx: number) => (
                      <div
                        key={log.id || `audit-${idx}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              log.action.includes("WON") ||
                              log.action.includes("PAYOUT")
                                ? "bg-emerald-500/10 text-emerald-500"
                                : log.action.includes("BET")
                                  ? "bg-gold/10 text-gold"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {log.action.substring(0, 3)}
                          </div>
                          <div>
                            <div className="text-xs font-bold uppercase tracking-tighter">
                              {log.action.replace("_", " ")}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()} —
                              {log.user_id
                                ? ` User: ${log.user_id.substring(0, 8)}`
                                : ` Admin: ${log.admin_id}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {log.amount > 0 && (
                            <div
                              className={`text-xs font-black ${log.action === "WITHDRAW" || log.action === "BET_PLACED" ? "text-destructive" : "text-emerald-brand"}`}
                            >
                              {log.action === "WITHDRAW" ||
                              log.action === "BET_PLACED"
                                ? "-"
                                : "+"}
                              {log.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Onglet Membres ── */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-foreground">
                    Utilisateurs ({users.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["adminUsers"],
                        })
                      }
                      className="h-7 text-[10px] font-bold"
                    >
                      Rafraîchir
                    </Button>
                  </div>
                </div>

                {isUsersLoading ? (
                  <p className="text-center py-10 text-muted-foreground italic">
                    Chargement des membres...
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {users.map((u: any) => (
                      <div
                        key={u.id}
                        className="glass-card rounded-2xl p-4 border border-white/5 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${u.is_blocked ? "bg-destructive/20" : "glass-gold"}`}
                            >
                              <User
                                className={`w-5 h-5 ${u.is_blocked ? "text-destructive" : "text-gold"}`}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {u.display_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {u.phone || "Pas de numéro"}
                              </p>
                              {u.is_blocked && (
                                <span className="text-[10px] text-destructive font-black uppercase tracking-tighter">
                                  Compte bloqué
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gold">
                              {Number(u.balance).toLocaleString("fr-FR")} CFA
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Rôle: {u.role}
                            </p>
                          </div>
                        </div>

                        {editingUser === u.id ? (
                          <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-3 animate-in slide-in-from-top-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase text-muted-foreground font-bold">
                                  Nouveau solde
                                </label>
                                <input
                                  type="number"
                                  value={balanceForm.amount}
                                  onChange={(e) =>
                                    setBalanceForm({
                                      ...balanceForm,
                                      amount: e.target.value,
                                    })
                                  }
                                  className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
                                  placeholder="Montant total..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase text-muted-foreground font-bold">
                                  Raison
                                </label>
                                <input
                                  value={balanceForm.reason}
                                  onChange={(e) =>
                                    setBalanceForm({
                                      ...balanceForm,
                                      reason: e.target.value,
                                    })
                                  }
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
                              >
                                {" "}
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateBalanceMutation.mutate({
                                    user_id: u.id,
                                    new_balance: Number(balanceForm.amount),
                                    reason: balanceForm.reason,
                                  })
                                }
                                disabled={updateBalanceMutation.isPending}
                                className="flex-1 h-8 text-[10px] font-bold gradient-gold"
                              >
                                Mettre à jour
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 pt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(u.id);
                                setBalanceForm({
                                  amount: String(u.balance),
                                  reason: "",
                                });
                              }}
                              className="flex-1 h-8 text-[10px] font-bold min-w-[100px]"
                            >
                              <Edit2 className="w-3 h-3 mr-1" /> Ajuster solde
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchUserHistory(u.id, u.display_name)}
                              className="h-8 w-8 p-0"
                              title="Historique des transactions"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setNotifForm({
                                  ...notifForm,
                                  target: "user",
                                  user_id: u.id,
                                });
                                setShowNotifModal(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="Envoyer un message"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant={u.is_blocked ? "outline" : "destructive"}
                              onClick={() =>
                                toggleUserBlockMutation.mutate({
                                  user_id: u.id,
                                  is_blocked: !u.is_blocked,
                                })
                              }
                              disabled={toggleUserBlockMutation.isPending}
                              className="flex-1 h-8 text-[10px] font-bold min-w-[80px]"
                            >
                              {u.is_blocked ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
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
                <h2 className="font-display text-sm font-bold text-foreground">
                  Paramètres du Jeu
                </h2>

                <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-foreground">
                          Multiplicateur de Gain
                        </label>
                        <span className="text-xs font-black text-gold">
                          x{gameSettings?.multiplier || 5}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        step="0.5"
                        value={gameSettings?.multiplier || 5}
                        onChange={(e) =>
                          updateSettingsMutation.mutate({
                            ...gameSettings,
                            multiplier: Number(e.target.value),
                          })
                        }
                        className="w-full accent-gold h-1.5 bg-muted rounded-lg cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        Facteur multiplicatif appliqué à la mise gagnante (ex:
                        1000 CFA x 5 = 5000 CFA).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground font-bold">
                          Mise Minimum (CFA)
                        </label>
                        <input
                          type="number"
                          defaultValue={gameSettings?.min_bet || 100}
                          onBlur={(e) =>
                            updateSettingsMutation.mutate({
                              ...gameSettings,
                              min_bet: Number(e.target.value),
                            })
                          }
                          className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground font-bold">
                          Mise Maximum (CFA)
                        </label>
                        <input
                          type="number"
                          defaultValue={gameSettings?.max_bet || 50000}
                          onBlur={(e) =>
                            updateSettingsMutation.mutate({
                              ...gameSettings,
                              max_bet: Number(e.target.value),
                            })
                          }
                          className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] uppercase text-muted-foreground font-bold">
                        Montant Max Transfert P2P (CFA)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          defaultValue={
                            gameSettings?.max_transfer_amount || 50000
                          }
                          onBlur={(e) =>
                            updateSettingsMutation.mutate({
                              ...gameSettings,
                              max_transfer_amount: Number(e.target.value),
                            })
                          }
                          className="w-full h-11 bg-muted/40 border border-gold/10 rounded-xl px-4 text-sm font-bold text-gold focus:border-gold outline-none"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <Zap className="w-3.5 h-3.5 text-gold/30" />
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground italic">
                        Limite maximale autorisée pour un transfert unique entre
                        deux membres.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-brand flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-brand/80 leading-relaxed">
                      {" "}
                      Ces paramètres s'appliquent en temps réel à tous les
                      nouveaux paris et futurs tirages. Les paris déjà placés
                      conservent les règles au moment de la mise.{" "}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet SMS ── */}
            {activeTab === "sms_logs" && (
              <div className="space-y-4">
                <h2 className="font-display text-sm font-bold text-foreground">
                  SMS non reconnus
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Voici les messages que le système n'a pas pu parser
                  automatiquement. Utilisez-les pour vérifier manuellement les
                  dépôts ou améliorer les Regex.
                </p>

                <div className="grid gap-3">
                  {failedSms.length === 0 ? (
                    <div className="glass-card rounded-2xl p-10 text-center border border-white/5">
                      <p className="text-sm text-muted-foreground italic">
                        Aucun SMS en échec. Le parsing fonctionne bien !
                      </p>
                    </div>
                  ) : (
                    failedSms.map((s: any) => (
                      <div
                        key={s.id}
                        className="glass-card rounded-2xl p-4 border border-white/5 space-y-3"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground font-mono">
                            {s.id}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(s.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                          <p className="text-xs font-mono text-gold whitespace-pre-wrap break-all uppercase leading-relaxed">
                            {s.sms_content}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-muted-foreground">
                            Utilisateur:{" "}
                            <span className="text-foreground font-bold">
                              {s.user_id}
                            </span>
                          </p>
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
                <div
                  className={`glass-card rounded-2xl p-5 border transition-all duration-300 ${maintenanceActive ? "border-destructive/30 bg-destructive/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${maintenanceActive ? "bg-destructive/15" : "glass-gold"}`}
                      >
                        <Power
                          className={`w-5 h-5 ${maintenanceActive ? "text-destructive" : "text-gold"}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Mode Maintenance
                        </p>
                        <p
                          className={`text-xs font-medium ${maintenanceActive ? "text-destructive" : "text-emerald-brand"}`}
                        >
                          {maintenanceActive
                            ? "⚠ ACTIF — Paiements et Paris bloqués"
                            : "✓ INACTIF — Système opérationnel"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        maintenanceMutation.mutate({
                          active: !maintenanceActive,
                          message: maintenanceMsg,
                        })
                      }
                      disabled={maintenanceMutation.isPending}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${maintenanceActive ? "bg-destructive" : "bg-muted"}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${maintenanceActive ? "left-7" : "left-1"}`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Message affiché aux utilisateurs
                    </label>
                    <textarea
                      value={maintenanceMsg}
                      onChange={(e) => setMaintenanceMsg(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm text-foreground min-h-[80px] focus:outline-none focus:border-gold/40 resize-none"
                    />
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                    Informations Système
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Tirage automatique
                      </span>
                      <span className="text-emerald-brand font-medium">
                        ✓ Actif (18:00 WAT)
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Création auto du tirage
                      </span>
                      <span className="text-emerald-brand font-medium">
                        ✓ Actif (00:00 WAT)
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Mise minimum
                      </span>
                      <span className="text-foreground font-medium">
                        {gameSettings?.min_bet || 100} CFA
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">
                        Mise maximum
                      </span>
                      <span className="text-foreground font-medium">
                        {Number(gameSettings?.max_bet || 50000).toLocaleString(
                          "fr-FR",
                        )}{" "}
                        CFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet Validations de Notifications (Super Admin) ── */}
            {activeTab === "notifications" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-bold text-foreground">Validation des Notifications</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest">Contrôle de diffusion globale</p>
                  </div>
                  <div className="glass px-3 py-1 rounded-full border border-white/5">
                    <span className="text-[10px] font-bold text-gold">{pendingNotifications.length} EN ATTENTE</span>
                  </div>
                </div>

                {isNotifsLoading ? (
                   <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
                ) : pendingNotifications.length === 0 ? (
                  <div className="glass-card rounded-3xl p-12 text-center border border-white/5 space-y-3">
                    <CheckCircle className="w-12 h-12 text-emerald-500/20 mx-auto" />
                    <p className="text-muted-foreground text-sm font-medium">Aucune notification en attente de validation.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingNotifications.map((notif: any) => (
                      <div key={notif.id} className="glass-card rounded-2xl p-5 border border-gold/10 space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                             notif.type === 'warning' ? 'bg-destructive/10 text-destructive' :
                             notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-brand' : 'bg-gold/10 text-gold'
                           }`}>{notif.type}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Proposition de diffusion par <span className="text-gold">{notif.creatorName}</span></p>
                          <h3 className="font-bold text-foreground">{notif.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">{notif.message}</p>
                        </div>
                        <div className="flex gap-2">
                           <Button 
                             onClick={() => approveNotifMutation.mutate(notif.id)}
                             disabled={approveNotifMutation.isPending}
                             className="flex-1 gradient-emerald text-secondary-foreground h-10 text-[11px] font-black uppercase"
                           >
                             {approveNotifMutation.isPending ? 'Approbation...' : 'Approuver & Diffuser'}
                           </Button>
                           <Button 
                             variant="outline"
                             onClick={() => {
                               const reason = prompt("Motif du rejet :");
                               if (reason) rejectNotifMutation.mutate({ id: notif.id, reason });
                             }}
                             className="flex-1 h-10 text-[11px] font-black uppercase border-destructive/30 text-destructive hover:bg-destructive/5"
                           >
                              Rejeter
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* ── Modal Notification ── */}
        {showNotifModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-md rounded-3xl p-6 border-white/10 shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notifForm.target === "all" ? (
                    <Megaphone className="w-5 h-5 text-gold" />
                  ) : (
                    <Mail className="w-5 h-5 text-gold" />
                  )}
                  <h3 className="font-display font-bold text-lg">
                    {notifForm.target === "all"
                      ? "Diffusion Globale"
                      : "Message au Membre"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Type de Message
                  </label>
                  <div className="flex gap-2">
                    {["info", "success", "warning"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNotifForm({ ...notifForm, type: t })}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                          notifForm.type === t
                            ? t === "success"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-brand"
                              : t === "warning"
                                ? "bg-destructive/10 border-destructive/50 text-destructive"
                                : "glass-gold border-gold/50 text-gold shadow-lg shadow-gold/5"
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Titre de la Notification
                  </label>
                  <input
                    value={notifForm.title}
                    onChange={(e) =>
                      setNotifForm({ ...notifForm, title: e.target.value })
                    }
                    placeholder="Ex: Maintenance prévue, Offre Bonus..."
                    className="w-full bg-muted/30 border border-white/10 rounded-xl px-4 h-11 text-sm focus:border-gold/50 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                    Message
                  </label>
                  <textarea
                    value={notifForm.message}
                    onChange={(e) =>
                      setNotifForm({ ...notifForm, message: e.target.value })
                    }
                    placeholder="Votre message ici..."
                    className="w-full bg-muted/30 border border-white/10 rounded-2xl p-4 text-sm focus:border-gold/50 outline-none transition-colors min-h-[120px] resize-none"
                  />
                </div>

                {notifForm.target === "all" && (
                  <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gold/80 italic leading-relaxed">
                      Ce message sera visible par la totalité des utilisateurs
                      enregistrés sur la plateforme. Utilisez cette fonction
                      avec précaution.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowNotifModal(false)}
                  className="flex-1 h-12 rounded-2xl font-bold"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => createNotifMutation.mutate(notifForm)}
                  disabled={
                    createNotifMutation.isPending ||
                    !notifForm.title ||
                    !notifForm.message
                  }
                  className="flex-2 h-12 rounded-2xl font-black uppercase tracking-widest gradient-gold shadow-xl shadow-gold/20"
                >
                  {createNotifMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Soumettre
                      <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Historique ── */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-2xl rounded-3xl border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="space-y-0.5">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-brand" />
                    Historique Membre
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Activité de {selectedUserHistory?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                      Récupération des flux...
                    </p>
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="py-20 text-center space-y-3 opacity-40">
                    <History className="w-12 h-12 mx-auto" />
                    <p className="text-sm font-medium">Aucune transaction trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userHistory.map((h: any) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${
                              h.type === "deposit" || h.type === "win"
                                ? "bg-emerald-500/10 text-emerald-brand"
                                : h.type === "withdrawal" || h.type === "bet"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-gold/10 text-gold"
                            }`}
                          >
                            {h.type?.substring(0, 3)}
                          </div>
                          <div>
                            <div className="text-xs font-bold capitalize">
                              {h.type?.replace("_", " ")}
                              {h.provider && (
                                <span className="text-[10px] font-normal text-muted-foreground font-mono lowercase ml-2">
                                  via {h.provider}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(h.created_at || h.createdAt).toLocaleString("fr-FR")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-black tabular-nums ${
                              h.type === "deposit" ||
                              h.type === "win" ||
                              (h.type === "transfer" && h.user_id !== h.sender_id)
                                ? "text-emerald-brand"
                                : "text-foreground"
                            }`}
                          >
                            {h.type === "deposit" || h.type === "win" ? "+" : ""}
                            {Number(h.amount).toLocaleString("fr-FR")} CFA
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-tighter ${
                            h.status === 'approved' ? 'text-emerald-500' : 
                            h.status === 'pending' ? 'text-gold' : 'text-destructive'
                          }`}>
                            {h.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/20 border-t border-white/5 flex justify-end">
                <Button
                  onClick={() => setShowHistoryModal(false)}
                  className="h-10 px-6 rounded-xl font-bold bg-white/5 hover:bg-white/10"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const StatMini = ({
  icon,
  value,
  label,
  className,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}) => (
  <div
    className={`glass-card rounded-2xl p-4 border border-white/5 space-y-1 shadow-lg transition-all hover:scale-[1.02] ${className}`}
  >
    <div className="flex items-center justify-between mb-1">
      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
        {icon}
      </div>
    </div>
    <p className="font-display text-sm font-black text-foreground tracking-tight">
      {value}
    </p>
    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
      {label}
    </p>
  </div>
);

export default AdminDashboard;

const NetworkForm = ({ network, onCancel, onSave, isLoading }: any) => {
  const [formData, setFormData] = useState({
    name: network?.name || "",
    ussd_template: network?.ussd_template || "*145*1*{amount}*{destination}#",
    destination_number: network?.destination_number || "",
    is_active: network?.is_active ?? true,
    order: network?.order ?? 0,
  });

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold">
            Nom (ex: T-Money)
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-9 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
            placeholder="Nom du réseau"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-bold">
            Destinataire
          </label>
          <input
            value={formData.destination_number}
            onChange={(e) =>
              setFormData({ ...formData, destination_number: e.target.value })
            }
            className="w-full h-9 bg-muted/40 border border-white/10 rounded-lg px-3 text-xs focus:border-gold/50 outline-none"
            placeholder="Numéro qui reçoit"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase font-bold">
          Template USSD
        </label>
        <input
          value={formData.ussd_template}
          onChange={(e) =>
            setFormData({ ...formData, ussd_template: e.target.value })
          }
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
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-3.5 h-3.5 accent-gold"
            />
            <span className="text-[10px] font-bold">Actif</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold">Ordre:</span>

            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
              className="w-12 h-7 bg-muted/40 border border-white/10 rounded px-2 text-[10px] focus:border-gold/50 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 text-[10px] font-bold"
          >
            Annuler
          </Button>
          <Button
            onClick={() => onSave(formData)}
            disabled={isLoading}
            className="h-8 text-[10px] font-bold gradient-gold"
          >
            <Save className="w-3.5 h-3.5 mr-1" />{" "}
            {isLoading ? "Soumission..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
};
