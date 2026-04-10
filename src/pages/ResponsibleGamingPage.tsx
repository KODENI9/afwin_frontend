import { Link } from "react-router-dom";
import { Heart, ChevronLeft, AlertCircle } from "lucide-react";

const ResponsibleGamingPage = () => {
  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-wider">Jeu Responsable</h1>
          <p className="text-xs text-muted-foreground italic">Parce que le jeu doit rester un plaisir.</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="space-y-2">
              <h2 className="text-amber-500 font-bold text-base m-0">Attention aux risques</h2>
              <p className="m-0 text-amber-500/80">Les jeux d'argent peuvent être addictifs et entraîner des pertes financières. Jouez avec modération et ne dépensez jamais l'argent nécessaire à vos besoins essentiels.</p>
            </div>
          </div>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">1. Nos engagements</h2>
            <p>Chez AF-WIN, nous croyons que le jeu en ligne doit être une source de divertissement et non une source de problèmes. Nous mettons en œuvre des mesures pour aider nos utilisateurs à garder le contrôle.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">2. Conseils pour un jeu sain</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Fixez-vous un budget de jeu strict et ne le dépassez pas.</li>
              <li>Ne considérez pas le jeu comme un moyen de gagner de l'argent ou de rembourser des dettes.</li>
              <li>Ne jouez pas sous l'influence de l'alcool ou de substances.</li>
              <li>Faites des pauses régulières et limitez votre temps de connexion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">3. Reconnaître les signes d'addiction</h2>
            <p>Si vous ressentez le besoin constant de jouer, si vous cachez vos habitudes de jeu ou si le jeu impacte votre vie sociale et professionnelle, vous avez peut-être besoin d'aide.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">4. Auto-limitation</h2>
            <p>Si vous souhaitez faire une pause, contactez notre support client pour demander une suspension temporaire ou définitive de votre compte.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResponsibleGamingPage;
