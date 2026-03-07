import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { setAuthTokenGetter, profileApi, adminApi } from "@/services/api";

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  isAdmin: boolean;
  balance: number;
  refreshBalance: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const fetchProfileData = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const referredBy = localStorage.getItem("referredBy") || undefined;
      const profileData = await profileApi.getMe(referredBy);
      
      setProfile(profileData);
      setBalance(profileData.balance || 0);
      
      try {
        const adminRes = await adminApi.checkAdminStatus();
        setIsAdmin(adminRes.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      setAuthTokenGetter(getToken);
      fetchProfileData();
    }
  }, [isUserLoaded, isSignedIn]);

  const signOut = async () => {
    await clerkSignOut();
    setIsAdmin(false);
    setBalance(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      loading: !isUserLoaded || loading, 
      isAdmin, 
      balance, 
      refreshBalance: fetchProfileData,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
