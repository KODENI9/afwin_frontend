import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { User, Edit2, Check, X, Wallet, Dices, Trophy, Share2, Copy, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import api, { profileApi, drawsApi } from "@/services/api";

// ─── Système de niveaux (miroir du backend) ───────────────────────────────────
const LEVELS = [
  { grade: 'bronze',  label: 'Bronze',  emoji: '🥉', minXP: 0,      nextXP: 500,   color: '#CD7F32', bg: 'bg-amber-900/20',  border: 'border-amber-700/30',  text: 'text-amber-600' },
  { grade: 'argent',  label: 'Argent',  emoji: '🥈', minXP: 500,    nextXP: 2000,  color: '#C0C0C0', bg: 'bg-slate-400/10',  border: 'border-slate-400/30',  text: 'text-slate-400' },
  { grade: 'or',      label: 'Or',      emoji: '🥇', minXP: 2000,   nextXP: 6000,  color: '#FFD700', bg: 'bg-gold/10',       border: 'border-gold/30',       text: 'text-gold'      },
  { grade: 'platine', label: 'Platine', emoji: '💎', minXP: 6000,   nextXP: 15000, color: '#E5E4E2', bg: 'bg-cyan-300/10',   border: 'border-cyan-300/30',   text: 'text-cyan-300'  },
  { grade: 'diamond', label: 'Diamond', emoji: '💠', minXP: 15000,  nextXP: null,  color: '#B9F2FF', bg: 'bg-blue-300/10',   border: 'border-blue-300/30',   text: 'text-blue-300'  },
];

const getGrade = (xp: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.minXP) return LEVELS[i]!;
  }
  return LEVELS[0]!;
};

// ─── Composant Badge de Grade ─────────────────────────────────────────────────
const GradeBadge = ({ xp = 0 }: { xp: number }) => {
  const grade = getGrade(xp);
  const nextGrade = LEVELS[LEVELS.findIndex(l => l.grade === grade.grade) + 1];

  const progressPct = nextGrade
    ? Math.min(((xp - grade.minXP) / (nextGrade.minXP - grade.minXP)) * 100, 100)
    : 100;

  const xpToNext = nextGrade ? nextGrade.minXP - xp : 0;

  return (
    <div className={`rounded-2xl p-4 border ${grade.bg} ${grade.border} space-y-3`}>
      {/* Grade header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{grade.emoji}</span>
          <div>
            <p className={`text-sm font-black uppercase tracking-widest ${grade.text}`}>
              {grade.label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {xp.toLocaleString()} XP total
            </p>
          </div>
        </div>
        {nextGrade && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Prochain grade</p>
            <p className={`text-xs font-bold ${grade.text}`}>
              {nextGrade.emoji} {nextGrade.label}
            </p>
          </div>
        )}
        {!nextGrade && (
          <div className="px-2 py-1 rounded-lg bg-blue-300/10 border border-blue-300/20">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
              Niveau max
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {nextGrade && (
        <div className="space-y-1.5">
          <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${grade.color}88, ${grade.color})`,
                boxShadow: `0 0 8px ${grade.color}44`,
              }}
            />
          </div>
          <div className="flex justify-between">
            <p className="text-[9px] text-muted-foreground">
              {Math.round(progressPct)}% vers {nextGrade.label}
            </p>
            <p className="text-[9px] text-muted-foreground">
              encore {xpToNext.toLocaleString()} XP
            </p>
          </div>
        </div>
      )}

      {/* Comment gagner des XP */}
      <div className="flex gap-3 pt-1 border-t border-white/5">
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black text-muted-foreground">+100 XP</p>
          <p className="text-[9px] text-muted-foreground">par tirage joué</p>
        </div>
        <div className="w-px bg-white/5" />
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black text-muted-foreground">+1 XP</p>
          <p className="text-[9px] text-muted-foreground">par 1 000 CFA misés</p>
        </div>
      </div>
    </div>
  );
};

// ─── Page Profil ──────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, profile, balance } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPseudo, setNewPseudo] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => drawsApi.getSettings(),
    enabled: !!user,
  });

  const minBet = settings?.min_bet || 100;
  const maxBet = settings?.max_bet || 50000;

  const updateProfile = useMutation({
    mutationFn: (data: { display_name?: string; phone?: string; pin_code?: string; pseudo?: string }) =>
      api.patch("/profiles/me", data).then(res => res.data),
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      setEditing(false);
      setEditingPhone(false);
      setPinInput("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  if (!user) return null;

  const displayName = profile?.display_name || user.fullName || user.username || "Joueur";
  const initials = displayName.slice(0, 2).toUpperCase();
  const userXP: number = (profile as any)?.xp || 0;
  const grade = getGrade(userXP);

  const copyToClipboard = (text: string, successMsg: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast.success(successMsg))
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  };

  const fallbackCopy = (text: string, successMsg: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand("copy"); toast.success(successMsg); }
    catch { toast.error("Échec de la copie."); }
    document.body.removeChild(el);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center">
            <User className="w-5 h-5 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Mon Profil</h1>
        </div>

        {/* Avatar + Name card */}
        <div className="glass-card rounded-3xl p-7 text-center space-y-4 highlight-top overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-gold/5 blur-[40px] pointer-events-none" />

          {/* Avatar avec badge de grade */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center glow-gold">
              <span className="font-display text-3xl font-black text-primary-foreground">{initials}</span>
            </div>
            {/* Badge grade en bas à droite de l'avatar */}
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-background shadow-lg"
              style={{ background: `${grade.color}22`, borderColor: `${grade.color}44` }}
              title={`Grade ${grade.label}`}
            >
              <span className="text-base leading-none">{grade.emoji}</span>
            </div>
          </div>

          {/* Name */}
          {editing ? (
            <div className="flex items-center gap-2 justify-center">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={displayName}
                className="max-w-[200px] text-center font-display h-9 text-sm bg-muted/60 border-gold/30 focus:border-gold/60"
                autoFocus
                onKeyDown={e => e.key === "Enter" && newName && updateProfile.mutate({ display_name: newName })}
              />
              <Button size="sm" onClick={() => newName && updateProfile.mutate({ display_name: newName })}
                disabled={!newName || updateProfile.isPending} className="h-9 w-9 p-0 gradient-gold">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-9 w-9 p-0 text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-display text-xl font-bold text-foreground">{displayName}</h2>
              <button onClick={() => { setEditing(true); setNewName(displayName); }}
                className="text-muted-foreground hover:text-gold transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress || ""}</p>

            {/* Phone */}
            {editingPhone ? (
              <div className="flex items-center gap-2 justify-center mt-2">
                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  placeholder="Ex: +228 90000000"
                  className="max-w-[200px] text-center h-8 text-xs bg-muted/40 border-gold/20" autoFocus
                  onKeyDown={e => e.key === "Enter" && updateProfile.mutate({ phone: newPhone })} />
                <Button size="sm" onClick={() => updateProfile.mutate({ phone: newPhone })}
                  disabled={updateProfile.isPending} className="h-8 w-8 p-0 gradient-gold">
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPhone(false)} className="h-8 w-8 p-0 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-[10px] text-muted-foreground">Tél:</p>
                <p className="text-xs font-medium text-foreground">{profile?.phone || "Non renseigné"}</p>
                <button onClick={() => { setEditingPhone(true); setNewPhone(profile?.phone || ""); }}
                  className="text-muted-foreground hover:text-gold transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Pseudo */}
            {editingPseudo ? (
              <div className="flex items-center gap-2 justify-center mt-3">
                <Input value={newPseudo}
                  onChange={e => setNewPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="pseudo_unique"
                  className="max-w-[200px] text-center h-9 text-sm bg-gold/5 border-gold/30 focus:border-gold/60" autoFocus
                  onKeyDown={e => e.key === "Enter" && newPseudo && updateProfile.mutate({ pseudo: newPseudo })} />
                <Button size="sm" onClick={() => {
                  if (newPseudo.length < 3) return toast.error("3 caractères min.");
                  updateProfile.mutate({ pseudo: newPseudo });
                  setEditingPseudo(false);
                }} disabled={!newPseudo || updateProfile.isPending} className="h-9 w-9 p-0 gradient-gold">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPseudo(false)} className="h-9 w-9 p-0 text-muted-foreground">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-3 p-2 rounded-xl bg-gold/5 border border-gold/10 max-w-[180px] mx-auto">
                <p className="font-display text-sm font-black text-gold">@{profile?.pseudo || "choisir_pseudo"}</p>
                <button onClick={() => { setEditingPseudo(true); setNewPseudo(profile?.pseudo || ""); }}
                  className="text-gold/40 hover:text-gold transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── GRADE & XP ── */}
        <GradeBadge xp={userXP} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-5 text-center highlight-top">
            <div className="w-9 h-9 rounded-xl glass-gold flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-4 h-4 text-gold" />
            </div>
            <p className="font-display text-2xl font-black gradient-text-gold">{Number(balance ?? 0).toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground mt-1">CFA disponibles</p>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center highlight-top">
            <div className="w-9 h-9 rounded-xl glass-emerald flex items-center justify-center mx-auto mb-3">
              <Dices className="w-4 h-4 text-emerald-brand" />
            </div>
            <p className="font-display text-2xl font-black text-foreground">
              {(profile as any)?.total_bets_count || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Paris total</p>
          </div>
        </div>

        {/* Referral Card */}
        <div className="glass-card rounded-2xl p-6 space-y-4 highlight-top relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-gold" />
            <h2 className="font-display text-sm font-bold text-foreground">Programme de Parrainage</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Invitez vos amis et gagnez <span className="text-gold font-bold">jusqu'à 10% de bonus</span> sur leur premier dépôt !
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-muted/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-gold">{profile?.referral_code || "Génération..."}</span>
              <button onClick={() => profile?.referral_code && copyToClipboard(profile.referral_code, "Code copié !")}
                className="text-muted-foreground hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <Button variant="outline" size="sm"
              className="border-gold/20 hover:bg-gold/10 text-gold h-11 px-4"
              onClick={() => {
                if (profile?.referral_code) {
                  copyToClipboard(`${window.location.origin}/?ref=${profile.referral_code}`, "Lien copié !");
                } else {
                  toast.error("Code en cours de génération...");
                }
              }}>
              Lien
            </Button>
          </div>
        </div>

        {/* PIN Management */}
        <div className="glass-card rounded-2xl p-6 space-y-4 highlight-top relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h2 className="font-display text-sm font-bold text-foreground">Sécurité des Retraits</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configurez un <span className="text-amber-500 font-bold">code PIN à 4 chiffres</span> pour sécuriser vos demandes de retrait.
          </p>
          <div className="pt-2">
            {profile?.pin_code ? (
              <div className="flex items-center justify-between bg-muted/20 border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gold/40" />)}
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-1">Code PIN configuré</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => setShowResetModal(true)}
                    className="text-[9px] text-muted-foreground hover:text-gold underline transition-colors">
                    Modifier / Oublié ?
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Input type="password" inputMode="numeric" maxLength={4}
                  placeholder="Nouveau PIN (4 chiffres)"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="bg-muted/40 border-amber-500/20 text-center font-mono tracking-[1em]" />
                <Button onClick={() => {
                  if (!/^\d{4}$/.test(pinInput)) return toast.error("Le PIN doit contenir 4 chiffres");
                  updateProfile.mutate({ pin_code: pinInput });
                }} disabled={updateProfile.isPending}
                  className="w-full gradient-gold text-primary-foreground font-bold h-10 rounded-xl">
                  Définir mon Code PIN
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Règles du jeu */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Règles du jeu</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              Si votre numéro est tiré, vous gagnez (x{settings?.multiplier || 5})
            </li>
            <li className="flex items-start gap-2">
              <Dices className="w-4 h-4 text-emerald-brand mt-0.5 shrink-0" />
              Mise min : <b className="text-foreground">{minBet.toLocaleString()} CFA</b> — max : <b className="text-foreground">{maxBet.toLocaleString()} CFA</b>
            </li>
            <li className="flex items-start gap-2">
              <Wallet className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              Gains garantis x{settings?.multiplier || 5} — Tirage automatique chaque slot
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Reset PIN */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-sm space-y-4 border border-gold/20 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-foreground">Réinitialiser le PIN</h2>
              <button onClick={() => { setShowResetModal(false); setResetStep("request"); }}
                className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetStep === "request" ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Un code de vérification sera envoyé à <b className="text-foreground">{user.primaryEmailAddress?.emailAddress}</b>.
                </p>
                <Button className="w-full gradient-gold font-bold"
                  onClick={async () => {
                    setIsResetLoading(true);
                    try {
                      await profileApi.requestPinReset();
                      toast.success("Code envoyé !");
                      setResetStep("verify");
                    } catch (e: any) {
                      toast.error(e.response?.data?.error || "Erreur lors de l'envoi");
                    } finally { setIsResetLoading(false); }
                  }} disabled={isResetLoading}>
                  {isResetLoading ? "Envoi..." : "Envoyer le code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6 text-gold" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">Code de vérification (6 chiffres)</p>
                  <Input placeholder="123456" maxLength={6} value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center font-mono text-xl tracking-[0.5em] h-12 bg-muted/40" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest text-center font-bold text-gold">Nouveau Code PIN (4 chiffres)</p>
                  <Input type="password" placeholder="0000" maxLength={4} value={resetNewPin}
                    onChange={e => setResetNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="text-center font-mono text-xl tracking-[1em] h-12 bg-muted/40" />
                </div>
                <Button className="w-full gradient-gold font-bold"
                  onClick={async () => {
                    if (resetCode.length !== 6) return toast.error("Le code doit comporter 6 chiffres");
                    if (resetNewPin.length !== 4) return toast.error("Le nouveau PIN doit comporter 4 chiffres");
                    setIsResetLoading(true);
                    try {
                      await profileApi.verifyPinReset(resetCode, resetNewPin);
                      toast.success("Code PIN mis à jour !");
                      setShowResetModal(false);
                      setResetStep("request");
                      setResetCode(""); setResetNewPin("");
                      queryClient.invalidateQueries({ queryKey: ["profile"] });
                    } catch (e: any) {
                      toast.error(e.response?.data?.error || "Code incorrect ou expiré");
                    } finally { setIsResetLoading(false); }
                  }} disabled={isResetLoading}>
                  {isResetLoading ? "Vérification..." : "Confirmer le nouveau PIN"}
                </Button>
                <button onClick={() => setResetStep("request")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                  Renvoyer le code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfilePage;