import { Link } from "react-router-dom";
import { Lock, ChevronLeft } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-wider">Politique de Confidentialité</h1>
          <p className="text-xs text-muted-foreground italic">Dernière mise à jour : 10 Avril 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">1. Données collectées</h2>
            <p>Nous collectons les informations nécessaires au bon fonctionnement de votre compte : numéro de téléphone (via Clerk), historique des transactions, et informations de profil fournies volontairement.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">2. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Gérer votre compte et vos paris.</li>
              <li>Traiter vos demandes de dépôts et retraits.</li>
              <li>Assurer la sécurité de la plateforme contre la fraude.</li>
              <li>Vous envoyer des notifications importantes concernant vos gains.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">3. Partage des informations</h2>
            <p>AF-WIN ne vend ni ne loue vos données personnelles à des tiers. Vos informations ne sont partagées qu'avec nos prestataires techniques (ex: Clerk pour l'authentification) nécessaires à la fourniture du service.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">4. Sécurité</h2>
            <p>Nous utilisons des protocoles de sécurité avancés (chiffrement SSL, authentification sécurisée) pour protéger vos données contre tout accès non autorisé.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-lg mb-2">5. Vos droits</h2>
            <p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ces droits en contactant notre support technique.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
