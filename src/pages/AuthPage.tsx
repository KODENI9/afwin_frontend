import { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Dices } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center glow-gold mx-auto">
            <Dices className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-black text-gold tracking-wider">AF-WIN</h1>
        </div>

        <div className="flex justify-center">
          {isLogin ? (
            <SignIn 
              routing="hash" 
              signUpUrl="/auth#signup" 
              afterSignInUrl="/play"
              appearance={{
                elements: {
                  card: "glass border-none shadow-2xl",
                  headerTitle: "text-gold font-display",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton: "bg-muted border-border text-foreground hover:bg-muted/80",
                  formButtonPrimary: "gradient-gold text-primary-foreground glow-gold",
                  footerActionLink: "text-gold hover:text-gold/80"
                }
              }}
            />
          ) : (
            <SignUp 
              routing="hash" 
              signInUrl="/auth" 
              afterSignUpUrl="/play"
              appearance={{
                elements: {
                  card: "glass border-none shadow-2xl",
                  headerTitle: "text-gold font-display",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "gradient-gold text-primary-foreground glow-gold",
                  footerActionLink: "text-gold hover:text-gold/80"
                }
              }}
            />
          )}
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold hover:underline font-medium"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>

          <div className="flex justify-center">
            <a href="/live" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-muted-foreground group-hover:text-gold uppercase tracking-widest">Voir le tirage en direct sans compte</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
