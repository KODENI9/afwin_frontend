import { Link } from "react-router-dom";
import { ShieldCheck, ChevronLeft } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-wider">Conditions Générales d'Utilisation</h1>
          <p className="text-xs text-muted-foreground italic">Dernière mise à jour : 10 Avril 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">1. Acceptation des conditions</h2>
            <p>En accédant et en utilisant la plateforme AF-WIN, vous acceptez d'être lié par les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">2. Éligibilité</h2>
            <p>L'utilisation de nos services est strictement réservée aux personnes âgées de 18 ans ou plus. En créant un compte, vous certifiez sur l'honneur avoir l'âge légal requis dans votre pays de résidence.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">3. Gestion du Compte</h2>
            <p>Vous êtes responsable du maintien de la confidentialité de vos informations de connexion (PIN, mot de passe). AF-WIN ne pourra être tenu responsable des pertes résultant d'un accès non autorisé à votre compte dû à votre négligence.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">4. Dépôts et Retraits</h2>
            <p>Tous les dépôts sont effectués via les moyens de paiement autorisés sur la plateforme. Les retraits sont soumis à une vérification administrative et peuvent prendre jusqu'à 24h ouvrées. AF-WIN se réserve le droit de geler un compte en cas de suspicion de fraude.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">5. Responsabilité du Jeu</h2>
            <p>AF-WIN est une plateforme de divertissement. Les jeux d'argent comportent des risques. Ne misez que ce que vous pouvez vous permettre de perdre. AF-WIN décline toute responsabilité en cas de pertes financières liées à l'utilisation normale de la plateforme.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">6. Modifications</h2>
            <p>Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication sur cette page.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
