import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Bell, Trophy, Info, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const NotificationsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getMine(),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) toast.error("Erreur de chargement des notifications");
  }, [error]);

  const markMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all unread as read when the page is viewed
  useEffect(() => {
    if (Array.isArray(notifications)) {
      const unread = notifications.filter((n: any) => !n.read);
      unread.forEach((n: any) => markMutation.mutate(n.id));
    }
  }, [Array.isArray(notifications) ? notifications.length : 0]);

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-gold" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground">{notifications.length} au total</p>
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lu
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center space-y-3">
            <Info className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground text-sm">Aucune notification pour le moment.</p>
            <p className="text-muted-foreground/50 text-xs">Vous serez notifié lors de vos gains et validations.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(notifications) && notifications.map((notif: any) => {
              const isWin = notif.type === "win";
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.id}
                  className={`glass-card rounded-xl p-4 border transition-all duration-200 ${
                    isUnread
                      ? isWin
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-gold/20 bg-gold/3"
                      : "border-border"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isWin ? "glass-emerald" : "glass-gold"
                    }`}>
                      {isWin
                        ? <Trophy className="w-5 h-5 text-emerald-brand" />
                        : <Bell className="w-5 h-5 text-gold" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm font-semibold truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </h3>
                        {isUnread && (
                          <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-2">
                        {new Date(notif.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
