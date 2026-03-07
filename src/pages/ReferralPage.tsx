import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../services/api';
import Layout from '../components/Layout';
import { Users, Gift, Copy, Check, Share2, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const { data: stats, isLoading } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => profileApi.getReferrals(),
  });

  const referralCode = stats?.referral_code || '...';
  // Use window.location.origin to build the referral link
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string, successMsg: string = "Copié !") => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(successMsg);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  };

  const fallbackCopy = (text: string, successMsg: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      toast.success(successMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Échec de la copie. Sélectionnez le texte manuellement.");
    }
    document.body.removeChild(textArea);
  };

  const shareLink = async () => {
    if (isLoading || referralCode === '...') {
      toast.error("Veuillez patienter pendant le chargement de votre code.");
      return;
    }

    const shareData = {
      title: 'Rejoins-moi sur AF-WIN !',
      text: `Utilise mon code ${referralCode} pour gagner des bonus !`,
      url: referralLink,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(referralLink, "Lien copié dans le presse-papier !");
        }
      }
    } else {
      copyToClipboard(referralLink, "Lien copié dans le presse-papier !");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6 pb-20">
        {/* Header Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-gold/20 via-background to-background border border-gold/20 text-center"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gold/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-gold/30">
              <Gift className="w-8 h-8 text-gold animate-bounce" />
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">Invitez des amis</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gagnez entre <span className="text-gold font-bold">5% et 10% de bonus</span> sur le premier recharge de vos amis !
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-1">
            <Users className="w-5 h-5 text-gold/60 mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Filleuls</p>
            <p className="text-xl font-display font-black text-foreground">{stats?.referrals_count || 0}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center space-y-1">
            <Wallet className="w-5 h-5 text-emerald-brand/60 mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Bonus gagnés</p>
            <p className="text-xl font-display font-black text-emerald-brand">{Number(stats?.total_bonus || 0).toLocaleString()} <span className="text-[10px]">CFA</span></p>
          </div>
        </div>

        {/* Referral Actions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Votre Code de Parrainage</label>
            <div className="flex gap-2">
              <div className="flex-1 h-14 bg-muted/30 border border-white/5 rounded-2xl flex items-center justify-center font-display text-xl font-black tracking-widest text-gold">
                {isLoading ? '...' : referralCode}
              </div>
              <button 
                onClick={() => copyToClipboard(referralCode)}
                className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center text-black hover:scale-95 transition-transform"
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <button 
            onClick={shareLink}
            className="w-full h-14 gradient-gold rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-black group"
          >
            <Share2 className="w-5 h-5" />
            PARTAGER MON LIEN
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Referrals List */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground font-black ml-1">Mes Filleuls</h2>
          {stats?.referrals?.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center border border-dashed border-white/10">
              <p className="text-xs text-muted-foreground italic">Vous n'avez pas encore de filleuls. Commencez à partager votre lien !</p>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {stats?.referrals?.map((ref: any, idx: number) => (
                <motion.div 
                  key={idx}
                  variants={item}
                  className="glass-card rounded-2xl p-4 border border-white/5 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{ref.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">Inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <Gift className="w-4 h-4 text-gold/30" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReferralPage;
