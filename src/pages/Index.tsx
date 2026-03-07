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
        <Link to="/auth">
          <Button variant="outline" size="sm" className="border-white/10 text-muted-foreground hover:text-gold hover:border-gold/40 transition-all duration-200">
            Connexion
          </Button>
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-12 md:py-20">
        {/* Badge above title */}
        <div className="inline-flex items-center gap-2 glass-gold rounded-full px-4 py-1.5 text-sm text-gold font-medium mb-6 animate-pulse-gold">
          <Zap className="w-3.5 h-3.5" />
          Tirage quotidien — Jouez maintenant
        </div>

        {/* Logo icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl gradient-gold flex items-center justify-center glow-gold-strong mx-auto animate-float">
            <Dices className="w-12 h-12 md:w-14 md:h-14 text-primary-foreground" />
          </div>
          {/* Ring effect */}
          <div className="absolute inset-0 rounded-3xl border-2 border-gold/20 scale-110 mx-auto" />
          <div className="absolute inset-0 rounded-3xl border border-gold/10 scale-125 mx-auto" />
        </div>

        {/* Main title */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-4">
          <span className="gradient-text-gold">AF-WIN</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-2xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-3">
          Le Jeu <span className="text-emerald-brand font-semibold">Tirage Exclusif</span>
        </p>
        <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-10">
          Choisissez un chiffre entre 1 et 9 et misez vos CFA. À 18h, si votre numéro est sélectionné, vous remportez x{settings?.multiplier || 5}.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center items-center mb-12">
          <FeatureChip icon={<Shield className="w-3.5 h-3.5" />} label="Tirage Équitable" color="gold" />
          <FeatureChip icon={<Trophy className="w-3.5 h-3.5" />} label="Tirage quotidien à 18h" color="emerald" />
          <FeatureChip icon={<Zap className="w-3.5 h-3.5" />} label={`Gains x${settings?.multiplier || 4}`} color="gold" />
        </div>

        {/* CTA */}
        <Link to="/play">
          <Button
            size="lg"
            className="relative gradient-gold text-primary-foreground font-display font-bold text-lg px-10 py-7 rounded-2xl glow-gold-strong hover:opacity-95 transition-all duration-200 group overflow-hidden"
          >
            {/* Shimmer on hover */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            Participer au tirage
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-200" />
          </Button>
        </Link>
      </section>

      {/* ── Stat Cards ── */}
      <section className="relative z-10 px-4 pb-12 md:pb-20">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-gold" />} value="1 à 9" label="Chiffres disponibles" />
          <StatCard icon={<Trophy className="w-5 h-5 text-emerald-brand" />} value={`x${settings?.multiplier || 5}`} label="Multiplicateur" color="emerald" />
          <StatCard icon={<Shield className="w-5 h-5 text-gold" />} value="Sécurisé" label="Transactions Firestore" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-muted-foreground/50 text-xs border-t border-white/5">
        <p>Af-Win © 2026 — Jouez responsablement.</p>
      </footer>
    </div>
  );
};

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
