import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Trophy, MessageSquare, Send, Globe, PhoneCall, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { walletApi, drawsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const PROVIDERS = ["Flooz", "T-Money", "Moov", "Orange"];

const WalletPage = () => {
  const { user, balance, refreshBalance } = useAuth();
  const queryClient = useQueryClient();
  const [smsContent, setSmsContent] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawProvider, setWithdrawProvider] = useState("Flooz");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [activeAction, setActiveAction] = useState<"deposit" | "withdraw" | null>(null);

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

  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    if (networks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networks[0]);
    }
  }, [networks, selectedNetwork]);

  useEffect(() => {
    if (transError) {
      console.error("[Diagnostic Wallet] Erreur détectée sur myTransactions:", transError);
      if ((transError as any).response) {
        console.error(" - Status:", (transError as any).response.status);
        console.error(" - Data:", (transError as any).response.data);
      } else {
        console.error(" - Message:", (transError as any).message);
      }
      toast.error("Erreur de chargement des transactions");
    }
  }, [transError]);

  const invalidate = () => {
    refreshBalance();
    queryClient.invalidateQueries({ queryKey: ["myTransactions"] });
  };

  const deposit = useMutation({
    mutationFn: (sms: string) => walletApi.deposit(sms),
    onSuccess: (data) => {
      toast.success("Dépôt soumis !", { description: data.message || "Un admin validera votre demande." });
      setSmsContent("");
      setActiveAction(null);
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const withdraw = useMutation({
    mutationFn: (data: { amount: number; provider: string; pin: string; account_details?: string }) => 
      walletApi.withdraw(data.amount, data.provider, data.pin, data.account_details),
    onSuccess: () => {
      toast.success("Demande de retrait envoyée !", { description: "Un admin validera votre retrait sous peu." });
      setWithdrawAmount("");
      setWithdrawAccount("");
      setWithdrawPin("");
      setActiveAction(null);
      invalidate();
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
    withdraw.mutate({ 
      amount: num, 
      provider: withdrawProvider, 
      pin: withdrawPin,
      account_details: withdrawAccount 
    });
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
          {/* Decorative orb */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[200px] h-[200px] rounded-full bg-gold/6 blur-[60px]" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Solde Disponible</p>
          <p className="font-display text-5xl md:text-6xl font-black gradient-text-gold">
            {(balance ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="text-muted-foreground font-medium mt-1">CFA</p>
        </div>

        {/* Diagnostic Overlay (Visible in dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-[10px] opacity-30 fixed bottom-2 right-2 flex gap-2">
            <span>TX: {isTransLoading ? 'Loading...' : transError ? 'ERROR' : 'OK'}</span>
            <span>NET: {isNetLoading ? 'Loading...' : 'OK'}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => toggleAction("deposit")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-300 border ${
              activeAction === "deposit"
                ? "gradient-gold text-primary-foreground border-transparent glow-gold"
                : "glass text-muted-foreground border-border hover:border-gold/30 hover:text-gold"
            }`}
          >
            <Plus className="w-4 h-4" /> Recharger
          </button>
          <button
            onClick={() => toggleAction("withdraw")}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-300 border ${
              activeAction === "withdraw"
                ? "bg-destructive text-destructive-foreground border-transparent"
                : "glass text-muted-foreground border-border hover:border-destructive/30 hover:text-destructive"
            }`}
          >
            <Minus className="w-4 h-4" /> Retirer
          </button>
        </div>

        {/* Deposit form */}
        {activeAction === "deposit" && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            {/* Step 1: Network & Amount */}
            <div className="glass-card rounded-2xl p-5 space-y-4 border border-gold/15 highlight-top">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-gold" />
                <p className="text-sm font-semibold text-foreground">Étape 1 : Choisissez votre réseau</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {isNetLoading ? (
                  <div className="col-span-2 py-4 text-center text-xs text-muted-foreground italic">Chargement des réseaux...</div>
                ) : networks.length === 0 ? (
                  <div className="col-span-2 py-4 text-center text-xs text-muted-foreground italic">Aucun réseau disponible.</div>
                ) : networks.map((net: any) => (
                  <button
                    key={net.id}
                    onClick={() => setSelectedNetwork(net)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 ${
                      selectedNetwork?.id === net.id
                        ? "glass-gold border-gold/40 text-gold shadow-lg shadow-gold/5"
                        : "bg-muted/30 border-white/5 text-muted-foreground hover:border-white/10"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedNetwork?.id === net.id ? 'bg-gold/20' : 'bg-white/5'}`}>
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold">{net.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Montant à recharger</p>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Ex: 2000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="bg-muted/50 border-border text-foreground h-12 font-display text-lg pl-10 focus:border-gold/40"
                  />
                  <DollarSign className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <a
                href={selectedNetwork && depositAmount ? `tel:${selectedNetwork.ussd_template
                  .replaceAll("{amount}", depositAmount)
                  .replaceAll("{destination}", selectedNetwork.destination_number)
                  .replace("#", "%23")}` : "#"}
                onClick={(e) => {
                  if (!selectedNetwork || !depositAmount) {
                    e.preventDefault();
                    toast.error("Choisissez un réseau et entrez un montant");
                  } else {
                    toast.success("Ouverture du composeur...");
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl font-display font-bold text-sm transition-all shadow-lg ${
                  selectedNetwork && depositAmount
                    ? "gradient-gold text-primary-foreground glow-gold hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                Démarrer le transfert
              </a>
              <p className="text-[10px] text-center text-muted-foreground italic px-2">
                Cela ouvrira votre application téléphone avec le code USSD pré-rempli. Vous n'aurez qu'à confirmer avec votre code secret.
              </p>
            </div>

            {/* Step 2: SMS Confirmation */}
            <div className="glass-card rounded-2xl p-5 space-y-4 border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-gold" />
                <p className="text-sm font-semibold text-foreground">Étape 2 : Confirmez avec le SMS</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Après avoir effectué le transfert USSD, <span className="text-foreground font-bold">copiez le SMS de confirmation</span> reçu et collez-le ci-dessous pour validation.
              </p>
              <textarea
                placeholder={"Collez ici le SMS reçu (ex: Succès. Transfert de...)"}
                value={smsContent}
                onChange={e => setSmsContent(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm font-mono text-foreground min-h-[100px] focus:outline-none focus:border-gold/40 transition-all resize-none placeholder:text-muted-foreground/30"
              />
              <Button
                onClick={handleDeposit}
                disabled={deposit.isPending}
                className="w-full bg-white/5 hover:bg-white/10 text-foreground border border-white/10 font-display font-bold h-11 rounded-xl transition-all"
              >
                {deposit.isPending ? "Analyse en cours..." : "Valider mon dépôt"}
              </Button>
            </div>
          </div>
        )}

        {/* Withdraw form */}
        {activeAction === "withdraw" && (
          <div className="glass-card rounded-2xl p-5 space-y-4 border border-destructive/15">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-destructive" />
              Demande de retrait
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Opérateur</p>
              <div className="grid grid-cols-4 gap-2">
                {PROVIDERS.map(p => (
                  <button
                    key={p}
                    onClick={() => setWithdrawProvider(p)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                      withdrawProvider === p
                        ? "gradient-gold text-primary-foreground border-transparent"
                        : "bg-muted/40 text-muted-foreground border-border hover:border-gold/30"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Montant (min. {minBet.toLocaleString()} CFA)</p>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="bg-muted/50 border-border text-foreground h-11 font-display focus:border-destructive/40"
                min={minBet}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Numéro de réception (Optionnel)</p>
              <Input
                type="tel"
                placeholder="Laisser vide pour utiliser votre numéro actuel"
                value={withdrawAccount}
                onChange={e => setWithdrawAccount(e.target.value)}
                className="bg-muted/50 border-border text-foreground h-11 focus:border-gold/40"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Code PIN de sécurité</p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4 chiffres"
                value={withdrawPin}
                onChange={e => setWithdrawPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-muted/50 border-border text-foreground text-center font-mono tracking-[1em] h-11 focus:border-gold/40"
              />
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={withdraw.isPending}
              className="w-full bg-destructive text-destructive-foreground font-display font-bold h-11 rounded-xl hover:opacity-90 transition-all"
            >
              {withdraw.isPending ? "Traitement..." : "Confirmer le retrait"}
            </Button>
          </div>
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
                const isCredit = ["deposit", "win", "payout", "commission", "referral_bonus"].includes(trans.type);
                return (
                  <div key={trans.id} className="glass-card rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-white/10 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "glass-emerald" : "bg-destructive/10"}`}>
                        {trans.type === "deposit" ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-brand" />
                        ) : ["win", "payout", "commission", "referral_bonus"].includes(trans.type) ? (
                          <Trophy className="w-4 h-4 text-emerald-brand" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {trans.type === "deposit" ? "Dépôt" : 
                           trans.type === "win" || trans.type === "payout" ? "🏆 Gain" : 
                           trans.type === "referral_bonus" || trans.type === "commission" ? "🎁 Bonus Parrainage" : 
                           "Retrait"}{" "}
                          <span className="text-muted-foreground font-normal">· {trans.provider}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(trans.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display font-bold text-sm ${isCredit ? "text-emerald-brand" : "text-destructive"}`}>
                        {isCredit ? "+" : "-"}{Number(trans.amount).toLocaleString("fr-FR")} CFA
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
