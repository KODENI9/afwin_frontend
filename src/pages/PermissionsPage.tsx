import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/services/api";
import { AdminPermission, UserRole, UserProfile } from "@/types/auth";
import Layout from "@/components/Layout";
import { 
  ShieldCheck, 
  UserCog, 
  Lock, 
  Save, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  History,
  TrendingUp,
  Settings,
  Users,
  Bell
} from "lucide-react";
import { toast } from "sonner";

const PERMISSION_GROUPS = [
  {
    title: "Opérations Courantes",
    icon: <Users className="w-4 h-4" />,
    permissions: [
      { id: AdminPermission.VIEW_DASHBOARD, label: "Voir le Dashboard", desc: "Accès de base aux statistiques générales" },
      { id: AdminPermission.VIEW_USERS, label: "Liste des Utilisateurs", desc: "Voir la liste de tous les comptes" },
      { id: AdminPermission.MANAGE_USERS, label: "Gérer les Utilisateurs", desc: "Bloquer/Débloquer et modifier les soldes" },
      { id: AdminPermission.MANAGE_DRAWS, label: "Gérer les Tirages", desc: "Fermer et résoudre les tirages" },
      { id: AdminPermission.SEND_GLOBAL_NOTIFICATION, label: "Notifications Globales", desc: "Envoyer des alertes à tous les utilisateurs" },
    ]
  },
  {
    title: "Données Sensibles 🔒",
    icon: <Lock className="w-4 h-4 text-ruby" />,
    style: "border-ruby/20 bg-ruby/5",
    permissions: [
      { id: AdminPermission.VIEW_FINANCIALS, label: "Données Financières", desc: "Voir les transactions et flux d'argent" },
      { id: AdminPermission.VIEW_PROFIT, label: "Profit & Revenus", desc: "Accès aux chiffres d'affaires et bénéfices réels", sensitive: true },
      { id: AdminPermission.VIEW_ADVANCED_STATS, label: "Stats Avancées", desc: "Détection des joueurs intelligents et SMS en échec", sensitive: true },
    ]
  },
  {
    title: "Configuration Système",
    icon: <Settings className="w-4 h-4" />,
    permissions: [
      { id: AdminPermission.MANAGE_SETTINGS, label: "Paramètres du Jeu", desc: "Modifier les multiplicateurs et limites de mise" },
      { id: AdminPermission.MANAGE_NETWORKS, label: "Gestion Réseaux", desc: "Ajouter/Modifier les méthodes de paiement" },
      { id: AdminPermission.VIEW_AUDIT_LOGS, label: "Logs d'Audit", desc: "Voir l'historique des actions administratives" },
    ]
  }
];

export default function PermissionsPage() {
  const { profile, hasPermission } = useAuth();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await adminApi.getAdmins();
      setAdmins(data);
    } catch (error) {
      toast.error("Échec du chargement des administrateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (adminId: string, permission: AdminPermission) => {
    setAdmins(prev => prev.map(admin => {
      if (admin.id !== adminId) return admin;
      
      const currentPermissions = Array.isArray(admin.permissions) ? admin.permissions : [];
      const newPermissions = currentPermissions.includes(permission)
        ? (currentPermissions as string[]).filter(p => p !== permission)
        : [...currentPermissions, permission];
        
      return { ...admin, permissions: newPermissions };
    }));
  };

  const handleRoleChange = (adminId: string, newRole: UserRole) => {
    setAdmins(prev => prev.map(admin => 
      admin.id === adminId ? { ...admin, role: newRole } : admin
    ));
  };

  const savePermissions = async (admin: UserProfile) => {
    setIsSaving(true);
    try {
      await adminApi.updatePermissions({
        userId: admin.id,
        role: admin.role,
        permissions: admin.permissions as string[]
      });
      toast.success(`Permissions de ${admin.display_name} mises à jour`);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (profile?.role !== UserRole.SUPER_ADMIN) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="p-4 rounded-full bg-ruby/10 border border-ruby/20">
            <AlertTriangle className="w-12 h-12 text-ruby" />
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Accès Restreint</h1>
          <p className="text-zinc-400 max-w-md">
            Seuls les <strong>SUPER_ADMIN</strong> peuvent accéder à cette interface de gestion des droits.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
              <ShieldCheck className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Autorisations</h1>
              <p className="text-zinc-500 font-medium">Contrôle fin des accès administrateurs</p>
            </div>
          </div>
          
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> Environnement Sécurisé
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-2xl bg-ruby/5 border border-ruby/20 flex gap-4 items-start">
          <AlertTriangle className="w-5 h-5 text-ruby shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-ruby font-bold uppercase tracking-tight mb-1">Rappel de Sécurité (Zero Trust)</p>
            <p className="text-zinc-400">
              Les permissions définies ici sont appliquées côté serveur. Un administrateur restreint verra les menus disparaître, 
              mais toute tentative de forcer l'accès via l'URL ou API sera également bloquée par le middleware de sécurité.
            </p>
          </div>
        </div>

        {/* Admin List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 animate-pulse">Chargement des comptes...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
              Aucun autre compte administrateur trouvé.
            </div>
          ) : (
            admins.map(admin => {
              const isAdminSelf = admin.id === profile.id;
              const isSuper = admin.role === UserRole.SUPER_ADMIN;
              const isExpanded = expandedId === admin.id;

              return (
                <div 
                  key={admin.id} 
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'bg-zinc-900 border-white/20' : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Card Header (Collapsed view) */}
                  <div 
                    className="p-6 flex items-center justify-between cursor-pointer group"
                    onClick={() => setExpandedId(isExpanded ? null : admin.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl border ${isSuper ? 'bg-gold/10 border-gold/30' : 'bg-white/5 border-white/10'}`}>
                        <UserCog className={`w-5 h-5 ${isSuper ? 'text-gold' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold">{admin.display_name}</h3>
                          {isAdminSelf && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">Moi</span>}
                        </div>
                        <p className="text-xs text-zinc-500 font-mono tracking-tight">{admin.user_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                          isSuper ? 'bg-gold/20 text-gold' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {isSuper ? 'Super Admin' : 'Admin Standard'}
                        </span>
                        <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">
                          {isSuper ? 'Accès Illimité' : `${(admin.permissions || []).length} permissions`}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />}
                    </div>
                  </div>

                  {/* Card Content (Expanded) */}
                  {isExpanded && (
                    <div className="p-6 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      
                      {/* Role Selector */}
                      <div className="mb-8 p-4 rounded-2xl bg-black/60 border border-white/5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Type de Rôle</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[UserRole.ADMIN, UserRole.SUPER_ADMIN].map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(admin.id, role)}
                              disabled={isAdminSelf}
                              className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                admin.role === role 
                                  ? 'bg-zinc-800 border-white/30 text-white' 
                                  : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10'
                              } ${isAdminSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {role === UserRole.SUPER_ADMIN && <ShieldCheck className="w-4 h-4 text-gold" />}
                              {role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Admin'}
                              {admin.role === role && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </button>
                          ))}
                        </div>
                        {isSuper && (
                          <p className="text-[10px] text-amber-500 mt-2 font-medium italic">
                            * Les Super Admins ignorent la liste des permissions ci-dessous et disposent d'un accès total.
                          </p>
                        )}
                        {isAdminSelf && (
                          <p className="text-[10px] text-zinc-600 mt-2 font-medium italic">
                            * Vous ne pouvez pas modifier votre propre rôle opérationnel.
                          </p>
                        )}
                      </div>

                      {/* Permissions Matrix */}
                      {!isSuper && (
                        <div className="space-y-6 mb-8">
                          {PERMISSION_GROUPS.map((group, gIdx) => (
                            <div key={gIdx} className={`p-4 rounded-2xl border ${group.style || 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center gap-2 mb-4">
                                {group.icon}
                                <h4 className="text-xs font-black uppercase tracking-wider text-white/80">{group.title}</h4>
                              </div>
                              
                              <div className="space-y-3">
                                {group.permissions.map((p) => {
                                  const isSet = (admin.permissions as string[])?.includes(p.id);
                                  return (
                                    <div 
                                      key={p.id}
                                      onClick={() => handleTogglePermission(admin.id, p.id)}
                                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSet ? 'bg-zinc-800/50 border-white/20' : 'bg-transparent border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center ${isSet ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                                          {isSet ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-zinc-700" />}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-white">{p.label}</p>
                                          <p className="text-[10px] text-zinc-500">{p.desc}</p>
                                        </div>
                                      </div>
                                      {p.sensitive && <Lock className="w-3 h-3 text-ruby opacity-60" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Save Action */}
                      <button
                        onClick={() => savePermissions(admin)}
                        disabled={isSaving}
                        className="w-full py-4 rounded-2xl bg-gold hover:bg-gold-light text-black font-black uppercase tracking-tighter flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? <History className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Enregistrer les modifications
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Role Reminder */}
        <div className="p-8 rounded-3xl bg-zinc-900 border border-white/5 text-center">
          <ShieldCheck className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-tighter">Gestion Finale</h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Toute modification est effective dès la déconnexion/reconnexion de l'administrateur concerné, 
            ou dès qu'il rafraîchit sa session locale. Les logs d'audit enregistrent systématiquement 
            ces changements de droits.
          </p>
        </div>

      </div>
    </Layout>
  );
}
