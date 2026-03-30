import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
});

let authInterceptorId: number | null = null;

// We'll pass the token getter from Clerk to the api service
export const setAuthTokenGetter = (getToken: () => Promise<string | null>) => {
  if (authInterceptorId !== null) {
    api.interceptors.request.eject(authInterceptorId);
  }

  authInterceptorId = api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};
        
export const walletApi = {
  getBalance: () => api.get("/wallet/balance").then(res => res.data),
  deposit: (smsContent: string) => api.post("/wallet/deposit", { smsContent }).then(res => res.data),
  withdraw: (amount: number, provider?: string, pin?: string, account_details?: string) => 
    api.post("/wallet/withdraw", { amount, provider, pin, account_details }).then(res => res.data),
  getTransactions: () => api.get("/wallet/transactions").then(res => res.data || []),
  getNetworks: () => api.get("/wallet/networks").then(res => res.data || []),
  searchUserByPseudo: (pseudo: string) => api.get(`/wallet/search-user?pseudo=${encodeURIComponent(pseudo)}`).then(res => res.data),
  transferFunds: (targetPseudo: string, amount: number, pin: string) => 
    api.post("/wallet/transfer", { targetPseudo, amount, pin }).then(res => res.data),
};

export const drawsApi = {
  getCurrent: () => api.get("/draws/current").then(res => res.data),
  getHistory: () => api.get("/draws/history").then(res => res.data || []),
  getSettings: () => api.get("/draws/settings").then(res => res.data),
};

export const betsApi = {
  placeBet: (draw_id: string, entries: { number: number; amount: number }[], request_id: string) =>
    api.post("/bets", { draw_id, entries, request_id }).then(res => res.data),
  getMyBets: () => api.get("/bets/my-bets").then(res => res.data || []),
  getMyHistory: (limit = 20, lastDocId?: string) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (lastDocId) params.append("lastDocId", lastDocId);
    return api.get(`/bets/my-history?${params.toString()}`).then(res => res.data);
  },
};

export const adminApi = {
  checkAdminStatus: () => api.get("/admin/check").then(res => res.data),
  resolveDraw: (draw_id: string) => api.post("/admin/resolve-draw", { draw_id }).then(res => res.data),
  getDrawStats: (draw_id: string) => api.get(`/admin/draw-stats/${draw_id}`).then(res => res.data),
  getPendingTransactions: () => api.get("/admin/transactions/pending").then(res => res.data),
  reviewTransaction: (transaction_id: string, action: "approve" | "reject") => 
    api.post("/admin/transactions/review", { transaction_id, action }).then(res => res.data),
  getNetworks: () => api.get("/admin/networks").then(res => res.data),
  saveNetwork: (data: any) => api.post("/admin/networks", data).then(res => res.data),
  deleteNetwork: (id: string) => api.delete(`/admin/networks/${id}`).then(res => res.data),
  getSettings: () => api.get("/admin/settings").then(res => res.data),
  updateSettings: (data: any) => api.post("/admin/settings", data).then(res => res.data),
  getUsers: () => api.get("/admin/users").then(res => res.data),
  toggleUserBlock: (user_id: string, is_blocked: boolean) => 
    api.post("/admin/users/toggle-block", { user_id, is_blocked }).then(res => res.data),
  updateUserBalance: (user_id: string, new_balance: number, reason: string) => 
    api.post("/admin/users/update-balance", { user_id, new_balance, reason }).then(res => res.data),
  getUserTransactions: (user_id: string) => 
    api.get(`/admin/users/${user_id}/transactions`).then(res => res.data),
  sendNotification: (data: { user_id?: string; title: string; message: string; type: string; target: "user" | "all" }) => 
    api.post("/admin/notifications/send", data).then(res => res.data),
  getGlobalStats: () => api.get("/admin/stats/global").then(res => res.data),
  getDailyStats: () => api.get("/admin/stats/daily").then(res => res.data),
  getAnalyticsSimulations: () => api.get("/admin/stats/simulations").then(res => res.data),
  getSmartPlayers: () => api.get("/admin/users/smart").then(res => res.data),
  getAuditLogs: () => api.get("/admin/audit/logs").then(res => res.data),
  getFailedSMS: () => api.get("/admin/sms/failed").then(res => res.data),
  setMaintenance: (active: boolean, message?: string) =>
    api.post("/admin/maintenance", { active, message }).then(res => res.data),
  getMaintenanceStatus: () =>
    api.get("/admin/maintenance").then(res => res.data),
  forceResolveClosedDraws: () =>
    api.post("/admin/force-resolve-closed").then(res => res.data),
};

export const notificationsApi = {
  getMine: () => api.get("/notifications").then(res => res.data || []),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`).then(res => res.data),
};

export const profileApi = {
  requestPinReset: () => api.post("/profiles/request-pin-reset").then(res => res.data),
  verifyPinReset: (code: string, newPin: string) => api.post("/profiles/verify-pin-reset", { code, newPin }).then(res => res.data),
  getReferrals: () => api.get("/profiles/referrals").then(res => res.data),
  getMe: (referredBy?: string) => {
    const url = referredBy ? `/profiles/me?referredBy=${referredBy}` : `/profiles/me`;
    return api.get(url).then(res => res.data);
  },
};

export default api;
