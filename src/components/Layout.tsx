import { Link, useLocation } from "react-router-dom";
import { Dices, History, Trophy, Wallet, LayoutDashboard, LogOut, Bell, User, Gift, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/services/api";
import ProfileBanner from "./ProfileBanner";
import InstallPrompt from "./InstallPrompt";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/play",       label: "Parier",     icon: Dices   },
  { to: "/referrals",  label: "Cadeaux",    icon: Gift    },
  { to: "/history",    label: "Historique", icon: History },
  { to: "/results",    label: "Résultats",  icon: Trophy  },
  { to: "/wallet",     label: "Banque",     icon: Wallet  },
  { to: "/send-money", label: "Envoi",      icon: Send    },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getMine(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  const isSuperAdmin = profile?.role === UserRole.SUPER_ADMIN;

  // Items affichés dans la bottom nav mobile — max 5 pour ne pas déborder
  // Admin et Sécurité sont accessibles via le header uniquement
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen">
      <ProfileBanner />

      {/* ── Header ── */}
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="container flex items-center justify-between h-14 md:h-16 gap-2">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-xl gradient-gold flex items-center justify-center glow-gold transition-all duration-300 group-hover:glow-gold-strong">
              <Dices className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-base md:text-lg font-bold gradient-text-gold tracking-wider">
              AF-WIN
            </span>
          </Link>

          {/* Desktop nav — masquée sur mobile */}
          <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl glass overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "glass-gold text-gold glow-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-gold" : ""}`} />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  location.pathname === "/admin"
                    ? "glass-gold text-gold glow-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Admin
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                to="/admin/permissions"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  location.pathname === "/admin/permissions"
                    ? "glass-gold text-gold glow-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Sécurité
              </Link>
            )}
          </nav>

          {/* Nav tablette (md → lg) — icônes seules */}
          <nav className="hidden md:flex lg:hidden items-center gap-0.5 p-1 rounded-xl glass">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "glass-gold text-gold glow-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                title="Admin"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  location.pathname === "/admin"
                    ? "glass-gold text-gold glow-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                to="/admin/permissions"
                title="Sécurité"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  location.pathname === "/admin/permissions"
                    ? "glass-gold text-gold glow-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}
          </nav>

          {/* Actions droite */}
          <div className="flex items-center gap-0.5 shrink-0">
            <ThemeToggle />

            <Link to="/notifications" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-gold hover:bg-gold/10 relative transition-all duration-200 w-8 h-8 p-0"
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
                className="text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all duration-200 w-8 h-8 p-0"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-8 h-8 p-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass">
        <div className="absolute bottom-full left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        {/* safe-area-inset-bottom pour iPhone avec home indicator */}
        <div
          className="flex justify-around py-2 px-1"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        >
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-0 flex-1 ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span className={`truncate w-full text-center transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Bouton Admin dans la bottom nav si admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-0 flex-1 ${
                location.pathname === "/admin" ? "text-gold" : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="truncate w-full text-center opacity-70">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ── Contenu principal ── */}
      {/* pb-24 mobile pour compenser la bottom nav + safe area */}
      <main className="container py-6 md:py-8 pb-24 md:pb-8">
        {children}
        <InstallPrompt />
      </main>
    </div>
  );
};

export default Layout;
