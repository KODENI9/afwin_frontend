import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { setAuthTokenGetter, profileApi, adminApi } from "@/services/api";
import { UserRole, AdminPermission, UserProfile } from "@/types/auth";

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  balance: number;
  refreshBalance: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
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

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!profile) return false;
    // SUPER_ADMIN has all permissions
    if (profile.role === UserRole.SUPER_ADMIN) return true;
    // ADMIN check permissions array
    if (profile.role === UserRole.ADMIN || profile.role === 'admin') {
      return Array.isArray(profile.permissions) && profile.permissions.includes(permission);
    }
    return false;
  };

  const signOut = async () => {
    await clerkSignOut();
    setIsAdmin(false);
    setProfile(null);
    setBalance(0);
  };

  const combinedIsAdmin = isAdmin || profile?.role === UserRole.SUPER_ADMIN || profile?.role === UserRole.ADMIN || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      loading: !isUserLoaded || loading, 
      isAdmin: combinedIsAdmin, 
      balance, 
      refreshBalance: fetchProfileData,
      signOut,
      hasPermission
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
