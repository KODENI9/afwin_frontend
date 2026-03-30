import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, User, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { walletApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SendMoneyPage = () => {
  const { user, balance, refreshBalance } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: PIN & Confirm
  const [pseudo, setPseudo] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [recipient, setRecipient] = useState<{ display_name: string; pseudo: string; user_id: string } | null>(null);

  // Search recipient when pseudo is typed
  const searchMutation = useMutation({
    mutationFn: (pseudo: string) => walletApi.searchUserByPseudo(pseudo),
    onSuccess: (data) => setRecipient(data),
    onError: () => setRecipient(null),
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pseudo.length >= 3) {
        searchMutation.mutate(pseudo);
      } else {
        setRecipient(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pseudo]);

  const transferMutation = useMutation({
    mutationFn: () => walletApi.transferFunds(pseudo, Number(amount), pin),
    onSuccess: (data) => {
      toast.success(data.message || "Transfert réussi !");
      refreshBalance();
      queryClient.invalidateQueries({ queryKey: ["adminPendingTrans"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      navigate("/wallet");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Le transfert a échoué");
    },
  });

  const handleNext = () => {
    const numAmt = Number(amount);
    if (!recipient) {
      toast.error("Veuillez entrer le pseudo d'un membre valide");
      return;
    }
    if (recipient.user_id === user?.id) {
      toast.error("Vous ne pouvez pas vous envoyer de l'argent à vous-même");
      return;
    }
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    if (numAmt > balance) {
      toast.error("Solde insuffisant");
      return;
    }
    setStep(2);
  };

  const handleTransfer = () => {
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Code PIN invalide (4 chiffres requis)");
      return;
    }
    transferMutation.mutate();
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 glass-gold rounded-full px-3 py-1 text-[10px] text-gold font-black uppercase tracking-widest mb-2">
            <Send className="w-3 h-3" />
            Transfert entre amis
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Envoyer de <span className="gradient-text-gold">l'argent</span>
          </h1>
          <p className="text-muted-foreground text-xs">
            Transférez instantanément des fonds à un autre membre.
          </p>
        </div>

        {/* Balance Card */}
        <div className="glass-card rounded-3xl p-5 border border-white/5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center">
              <User className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Votre Solde</p>
              <p className="text-lg font-black text-foreground">{balance.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">CFA</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl pointer-events-none" />

          {step === 1 ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest ml-1">Pseudo du destinataire</label>
                <div className="relative">
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="pseudo_ami"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pl-12 text-sm focus:border-gold/50 outline-none transition-all font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  
                  {searchMutation.isPending && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    </div>
                  )}
                  {recipient && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-brand" />
                      <span className="text-[10px] font-black text-emerald-brand uppercase tracking-tighter">{recipient.display_name}</span>
                    </div>
                  )}
                </div>
                {pseudo.length >= 3 && !recipient && !searchMutation.isPending && (
                  <p className="text-[10px] text-destructive ml-1">Utilisateur introuvable</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest ml-1">Montant à envoyer (CFA)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-lg font-black text-gold outline-none focus:border-gold/50 transition-all placeholder:text-gold/20"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text- gold/40">CFA</div>
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={!recipient || !amount}
                className="w-full h-14 rounded-2xl font-display font-black uppercase tracking-[0.2em] gradient-gold text-secondary-foreground shadow-lg shadow-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                Continuer <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex justify-center">
                   <div className="w-16 h-16 rounded-full glass-gold flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-gold" />
                   </div>
                </div>
                <div>
                   <p className="text-xs text-muted-foreground">Vous envoyez</p>
                   <p className="text-2xl font-black text-foreground">{Number(amount).toLocaleString()} CFA</p>
                   <p className="text-xs text-gold font-bold mt-1">à {recipient?.display_name}</p>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest ml-1">Entrez votre code PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-center text-2xl tracking-[1em] focus:border-gold/50 outline-none transition-all font-black"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wider text-xs"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={transferMutation.isPending || !pin}
                  className="flex-[2] h-14 rounded-2xl font-display font-black uppercase tracking-[0.2em] gradient-emerald text-secondary-foreground shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {transferMutation.isPending ? "Envoi..." : "Confirmer"}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Sécurisé de bout en bout
              </div>
            </div>
          )}
        </div>

        {/* Warning info */}
        <div className="glass-card border-gold/10 bg-gold/5 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gold">Conseil de sécurité</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Vérifiez toujours bien le pseudo et le nom du destinataire. Les transferts internes sont instantanés et irréversibles une fois validés par votre code PIN.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SendMoneyPage;
