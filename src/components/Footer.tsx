import { Link } from "react-router-dom";
import { ShieldCheck, MessageCircle, Info, Heart, Lock, Dices } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-black/40 backdrop-blur-md border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Section */}
        <div className="space-y-4 col-span-1 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center">
              <Dices className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold gradient-text-gold tracking-wider">AF-WIN</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            La première plateforme de tirage en direct sécurisée. Jouez, gagnez et retirez vos gains instantanément.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
              <span className="text-[10px] font-black">VISA</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
              <span className="text-[10px] font-black">MTN</span>
            </div>
          </div>
        </div>

        {/* Links: Legal */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Sécurité & Légal
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-2">
                <Info className="w-3 h-3" /> Conditions d'Utilisation
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-2">
                <Lock className="w-3 h-3" /> Confidentialité
              </Link>
            </li>
            <li>
              <Link to="/responsible-gaming" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-2">
                <Heart className="w-3 h-3 text-emerald-500" /> Jeu Responsable
              </Link>
            </li>
          </ul>
        </div>

        {/* Links: Support */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" /> Support 24/7
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a href="https://wa.me/22890513279" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-2">
                WhatsApp Support
              </a>
            </li>
            <li>
              <a href="#" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-2">
                Canal Telegram
              </a>
            </li>
            <li>
              <span className="text-[10px] text-muted-foreground/40 mt-2 block">
                Assistance technique du Lundi au Dimanche
              </span>
            </li>
          </ul>
        </div>

        {/* Certification */}
        <div className="space-y-4 border-l border-white/5 pl-6 hidden md:block">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-bold text-foreground mb-2">Certification AF-WIN</p>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Algorithmes de tirage vérifiés par la communauté et transparence totale sur les volumes de mises en temps réel.
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black">
          AF-WIN © 2026 — Tous droits réservés
        </p>
      </div>
    </footer>
  );
};

export default Footer;
