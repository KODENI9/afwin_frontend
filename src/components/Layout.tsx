import { Link, useLocation } from "react-router-dom";
import { Dices, History, Trophy, Wallet, LayoutDashboard, LogOut, Bell, User, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/services/api";
import ProfileBanner from "./ProfileBanner";
import InstallPrompt from "./InstallPrompt";

const navItems = [
  { to: "/play", label: "Parier", icon: Dices },
  { to: "/referrals", label: "Cadeaux", icon: Gift },
  { to: "/results", label: "Résultats", icon: Trophy },
  { to: "/wallet", label: "Portefeuille", icon: Wallet },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getMine(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.read).length 
    : 0;

  return (
    <div className="min-h-screen">
      <ProfileBanner />
      {/* ── Header ── */}
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        {/* Subtle top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl gradient-gold flex items-center justify-center glow-gold transition-all duration-300 group-hover:glow-gold-strong">
              <Dices className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold gradient-text-gold tracking-wider">
              AF-WIN
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl glass">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "glass-gold text-gold glow-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-gold" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === "/admin"
                    ? "glass-gold text-gold glow-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link to="/notifications" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-gold hover:bg-gold/10 relative transition-all duration-200"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all duration-200"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass">
        <div className="absolute bottom-full left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="flex justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className={`transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="container py-8 pb-28 md:pb-8">
        {children}
        <InstallPrompt />
      </main>
    </div>
  );
};

export default Layout;
