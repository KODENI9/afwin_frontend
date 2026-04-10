import { Link } from "react-router-dom";
import { Dices, Trophy, TrendingDown, ArrowRight, Zap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useQuery } from "@tanstack/react-query";
import { drawsApi } from "@/services/api";

const Index = () => {
  const { data: settings } = useQuery({
    queryKey: ["gameSettings"],
    queryFn: () => drawsApi.getSettings(),
  });

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gold/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald/5 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-violet-900/8 blur-[80px]" />
      </div>

      {/* ── Header mini ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center glow-gold">
            <Dices className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold gradient-text-gold tracking-wider">AF-WIN</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/live">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Direct Live</span>
            </div>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="border-white/10 text-muted-foreground hover:text-gold hover:border-gold/40 transition-all duration-200">
              Connexion
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-12 md:py-20">
        <div className="inline-flex items-center gap-2 glass-gold rounded-full px-4 py-1.5 text-sm text-gold font-medium mb-6 animate-pulse-gold">
          <Zap className="w-3.5 h-3.5" />
          Tirage quotidien — Jouez maintenant
        </div>

        <div className="relative mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl gradient-gold flex items-center justify-center glow-gold-strong mx-auto animate-float">
            <Dices className="w-12 h-12 md:w-14 md:h-14 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-gold/20 scale-110 mx-auto" />
          <div className="absolute inset-0 rounded-3xl border border-gold/10 scale-125 mx-auto" />
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-4">
          <span className="gradient-text-gold">AF-WIN</span>
        </h1>

        <p className="text-lg md:text-2xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-3">
          Le Jeu <span className="text-emerald-brand font-semibold">Tirage Exclusif</span>
        </p>
        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-10">
          Choisissez un chiffre entre 1 et 9 et multipliez vos CFA par {settings?.multiplier || 5} à chaque tirage gagnant.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Link to="/play">
            <Button
              size="lg"
              className="relative gradient-gold text-primary-foreground font-display font-bold text-lg px-10 py-7 rounded-2xl glow-gold-strong hover:opacity-95 transition-all duration-200 group overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              Participer au tirage
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-200" />
            </Button>
          </Link>
          <Link to="/live" className="text-xs font-bold text-muted-foreground hover:text-gold transition-colors flex items-center gap-2 group">
            <div className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-gold" />
            Regarder sans s'inscrire (Mode Spectateur)
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 py-20 bg-black/40 backdrop-blur-sm border-y border-white/5 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground italic">
              Comment ça <span className="gradient-text-gold">marche ?</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              Gagner n'a jamais été aussi simple. Suivez nos 3 étapes pour devenir le prochain grand gagnant.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            <StepCard 
              number="01" 
              icon={<Dices className="w-7 h-7 text-gold" />}
              title="Choisissez"
              desc="Sélectionnez votre chiffre porte-bonheur entre 1 et 9."
            />
            <StepCard 
              number="02" 
              icon={<Zap className="w-7 h-7 text-emerald-brand" />}
              title="Misez"
              desc="Déterminez le montant de votre mise (entre 100 et 50.000 CFA)."
            />
            <StepCard 
              number="03" 
              icon={<Trophy className="w-7 h-7 text-gold" />}
              title="Gagnez"
              desc={`Si votre chiffre sort, vous remportez x${settings?.multiplier || 5} votre mise.`}
            />
          </div>

          {/* Slots Table Card */}
          <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-gold/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-3xl -mr-48 -mt-48 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-gold text-xs font-black uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full mb-2">
                  <Zap className="w-3 h-3" /> Horaires des Tirages
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold">Sessions <span className="text-gold">Quotidiennes</span></h3>
                <p className="text-muted-foreground text-xs md:text-sm">6 opportunités de gagner chaque jour, du matin au soir.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground whitespace-nowrap">
                <Shield className="w-4 h-4 text-emerald-brand" /> Sécurisé par AF-WIN System
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <TimeSlotCard id="S1" time="06h - 09h" label="Petit Matin" />
              <TimeSlotCard id="S2" time="09h - 12h" label="Matinée" />
              <TimeSlotCard id="S3" time="12h - 15h" label="Midi" />
              <TimeSlotCard id="S4" time="15h - 17h" label="Après-midi" />
              <TimeSlotCard id="S5" time="17h - 20h" label="Soirée" />
              <TimeSlotCard id="S6" time="20h - 00h" label="Nuit" />
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-gold/5 border border-gold/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] md:text-xs text-muted-foreground italic text-center md:text-left">
                * Les mises pour chaque session sont clôturées 5 minutes avant le tirage.
              </p>
              <Button asChild variant="ghost" className="text-gold hover:text-white hover:bg-gold/10 font-bold uppercase tracking-widest text-[10px]">
                <Link to="/play" className="flex items-center gap-2">Découvrir le tirage actuel <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-gold" />} value="1 à 9" label="Chiffres dispos" />
          <StatCard icon={<Trophy className="w-5 h-5 text-emerald-brand" />} value={`x${settings?.multiplier || 5}`} label="Multiplicateur" color="emerald" />
          <StatCard icon={<Shield className="w-5 h-5 text-gold" />} value="Instantané" label="Paiement Mobile" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-muted-foreground/30 text-[10px] uppercase font-bold tracking-[0.3em] border-t border-white/5">
        <p>Af-Win © 2026 — Loterie Africaine en Ligne</p>
      </footer>
    </div>
  );
};

const StepCard = ({ number, icon, title, desc }: { number: string; icon: React.ReactNode; title: string; desc: string }) => (
  <div className="glass-card rounded-[2rem] p-8 space-y-4 border border-white/5 hover:border-gold/20 transition-all duration-300 group relative overflow-hidden">
    <div className="absolute -top-4 -right-4 text-7xl font-black text-white/[0.03] group-hover:text-gold/[0.05] transition-colors">{number}</div>
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const TimeSlotCard = ({ id, time, label }: { id: string; time: string; label: string }) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1 hover:bg-gold/5 hover:border-gold/20 transition-all duration-200">
    <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">{id}</div>
    <div className="text-sm font-black text-foreground">{time}</div>
    <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
  </div>
);

const FeatureChip = ({
  icon,
  label,
  color = "gold",
}: {
  icon: React.ReactNode;
  label: string;
  color?: "gold" | "emerald";
}) => (
  <div
    className={`${color === "gold" ? "glass-gold text-gold" : "glass-emerald text-emerald-brand"} rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium`}
  >
    {icon}
    {label}
  </div>
);

const StatCard = ({
  icon,
  value,
  label,
  color = "gold",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: "gold" | "emerald";
}) => (
  <div className="glass-card rounded-2xl p-5 text-center space-y-2 hover:border-gold/20 transition-all duration-300 group highlight-top">
    <div className={`w-10 h-10 rounded-xl ${color === "gold" ? "glass-gold" : "glass-emerald"} flex items-center justify-center mx-auto mb-3`}>
      {icon}
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Index;
