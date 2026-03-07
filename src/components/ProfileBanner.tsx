import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileBanner = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  const hasPhone = profile?.phone && profile.phone.trim() !== "";
  const hasPin = profile?.pin_code && profile.pin_code.trim() !== "";

  // If still loading or profile is complete, don't show the banner
  if (loading || (hasPhone && hasPin)) {
    return null;
  }

  const message = !hasPhone && !hasPin 
    ? "Complétez votre profil (téléphone & PIN) pour sécuriser vos retraits."
    : !hasPhone 
      ? "Ajoutez un numéro de téléphone pour faciliter vos retraits."
      : "Configurez un code PIN pour sécuriser vos demandes de retrait.";

  return (
    <div className="bg-gold/10 border-b border-gold/20 py-2.5 px-4 animate-in slide-in-from-top duration-500">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-gold" />
          </div>
          <p className="text-[11px] md:text-xs text-foreground font-medium leading-tight">
            {message}
          </p>
        </div>
        <button 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1 text-[11px] font-bold text-gold hover:underline whitespace-nowrap"
        >
          Compléter
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ProfileBanner;
