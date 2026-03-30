import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6 glass-card rounded-3xl m-4 border-destructive/20 bg-destructive/5 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black text-foreground uppercase tracking-widest">
              Oups ! Un problème est survenu
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Le moteur de rendu a rencontré une désynchronisation temporaire du DOM. 
              Cliquez sur le bouton ci-dessous pour recharger ce module proprement.
            </p>
          </div>
          
          <Button 
            onClick={() => window.location.reload()}
            className="gradient-gold font-bold px-8 h-12 rounded-2xl group shadow-lg shadow-gold/20"
          >
            <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Rafraîchir le Dashboard
          </Button>

          {import.meta.env.MODE !== 'production' && (
            <pre className="mt-8 p-4 bg-black/40 rounded-xl text-[10px] font-mono text-destructive text-left overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
