import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a short delay if not dismissed recently
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      const now = Date.now();
      if (!dismissed || now - parseInt(dismissed) > 1000 * 60 * 60 * 24 * 3) { // 3 days
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Force show for user to see it even if the event didn't fire yet
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const now = Date.now();
    if (!dismissed || now - parseInt(dismissed) > 1000 * 60 * 60 * 24 * 3) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt event yet, just show a message or generic instructions
      alert("Utilisez le menu de votre navigateur (trois points) et cliquez sur 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:bottom-8 md:left-auto md:right-8 md:w-80"
        >
          <div className="glass-card rounded-2xl p-5 border border-gold/30 shadow-2xl relative overflow-hidden">
            {/* Background highlight */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full blur-2xl -mr-8 -mt-8" />
            
            <button 
              onClick={dismissPrompt}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shrink-0 glow-gold">
                <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded-lg" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-foreground">Installer AF-WIN</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  Ajoutez l'application à votre écran d'accueil pour une expérience 100% immersive.
                </p>
              </div>
            </div>

            <div className="mt-4 relative z-10">
              {isIOS ? (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    1. Appuyez sur le bouton Partager <Share className="w-3 h-3 text-blue-400" />
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                    2. Sélectionnez "Sur l'écran d'accueil" <PlusSquare className="w-3 h-3" />
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleInstallClick}
                  className="w-full h-10 gradient-gold text-black font-black text-xs rounded-xl gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  INSTALLER MAINTENANT
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
