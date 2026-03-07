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

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gold hover:underline font-medium"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
