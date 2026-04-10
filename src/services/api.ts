import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({ baseURL: API_URL });

let authInterceptorId: number | null = null;

export const setAuthTokenGetter = (getToken: () => Promise<string | null>) => {
  if (authInterceptorId !== null) api.interceptors.request.eject(authInterceptorId);
  authInterceptorId = api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

export const walletApi = {
  getBalance: () => api.get("/wallet/balance").then(r => r.data),
  deposit: (smsContent: string) => api.post("/wallet/deposit", { smsContent }).then(r => r.data),
  withdraw: (amount: number, provider?: string, pin?: string, account_details?: string) =>
    api.post("/wallet/withdraw", { amount, provider, pin, account_details }).then(r => r.data),
  getTransactions: () => api.get("/wallet/transactions").then(r => r.data || []),
  getNetworks: () => api.get("/wallet/networks").then(r => r.data || []),
  searchUserByPseudo: (pseudo: string) => api.get(`/wallet/search-user?pseudo=${encodeURIComponent(pseudo)}`).then(r => r.data),
  transferFunds: (targetPseudo: string, amount: number, pin: string) =>
    api.post("/wallet/transfer", { targetPseudo, amount, pin }).then(r => r.data),
};

export const drawsApi = {
  getLive: () => api.get("/draws/active").then(r => r.data),
  getCurrent: () => api.get("/draws/current").then(r => r.data),
  getHistory: () => api.get("/draws/history").then(r => r.data || []),
  getSettings: () => api.get("/admin/settings").then(r => r.data),
};

export const betsApi = {
  placeBet: (draw_id: string, entries: { number: number; amount: number }[], request_id: string) =>
    api.post("/bets", { draw_id, entries, request_id }).then(r => r.data),
  getMyBets: () => api.get("/bets/my-bets").then(r => r.data || []),
  getMyHistory: (limit = 20, lastDocId?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (lastDocId) params.append("lastDocId", lastDocId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get(`/bets/my-history?${params.toString()}`).then(r => r.data);
  },
};

// ─── Flash Draw API ───────────────────────────────────────────────────────────
export const flashApi = {
  // Public
  getActive: () => api.get("/flash/active").then(r => r.data),

  // Admin — routes montées sur /api/flash (flash.routes.ts)
  create: (data: { label: string; durationMinutes: number; multiplier: number }) =>
    api.post("/flash/create", data).then(r => r.data),
  resolve: (flash_id: string) =>
    api.post("/flash/resolve", { flash_id }).then(r => r.data),
  list: () => api.get("/flash/list").then(r => r.data || []),
  getSchedule: () => api.get("/flash/schedule").then(r => r.data),
  saveSchedule: (config: any) => api.post("/flash/schedule", { config }).then(r => r.data),
};

export const adminApi = {
  checkAdminStatus: () => api.get("/admin/check").then(r => r.data),
  resolveDraw: (draw_id: string) => api.post("/admin/resolve-draw", { draw_id }).then(r => r.data),
  getDrawStats: (draw_id: string) => api.get(`/admin/draw-stats/${draw_id}`).then(r => r.data),
  getPendingTransactions: () => api.get("/admin/transactions/pending").then(r => r.data),
  reviewTransaction: (transaction_id: string, action: "approve" | "reject") =>
    api.post("/admin/transactions/review", { transaction_id, action }).then(r => r.data),
  getNetworks: () => api.get("/admin/networks").then(r => r.data),
  saveNetwork: (data: any) => api.post("/admin/networks", data).then(r => r.data),
  deleteNetwork: (id: string) => api.delete(`/admin/networks/${id}`).then(r => r.data),
  getSettings: () => api.get("/admin/settings").then(r => r.data),
  updateSettings: (data: any) => api.post("/admin/settings", data).then(r => r.data),
  getUsers: () => api.get("/admin/users").then(r => r.data),
  toggleUserBlock: (user_id: string, is_blocked: boolean) =>
    api.post("/admin/users/toggle-block", { user_id, is_blocked }).then(r => r.data),
  updateUserBalance: (user_id: string, new_balance: number, reason: string) =>
    api.post("/admin/users/update-balance", { user_id, new_balance, reason }).then(r => r.data),
  getUserTransactions: (user_id: string) =>
    api.get(`/admin/users/${user_id}/transactions`).then(r => r.data),
  createGlobalNotification: (data: { title: string; message: string; type: string }) =>
    api.post("/admin/notifications/create", data).then(r => r.data),
  getPendingNotifications: () => api.get("/admin/notifications/pending").then(r => r.data),
  approveNotification: (id: string) => api.post(`/admin/notifications/${id}/approve`).then(r => r.data),
  rejectNotification: (id: string, reason: string) =>
    api.post(`/admin/notifications/${id}/reject`, { reason }).then(r => r.data),
  getBasicStats: () => api.get("/admin/stats/basic").then(r => r.data),
  getGlobalStats: () => api.get("/admin/stats/global").then(r => r.data),
  getDailyStats: () => api.get("/admin/stats/daily").then(r => r.data),
  getProfitSimulations: () => api.get("/admin/stats/simulations").then(r => r.data),
  getSmartPlayers: () => api.get("/admin/users/smart").then(r => r.data),
  getAuditLogs: () => api.get("/admin/audit/logs").then(r => r.data),
  getFailedSMS: () => api.get("/admin/sms/failed").then(r => r.data),
  setMaintenance: (active: boolean, message?: string) =>
    api.post("/admin/maintenance", { active, message }).then(r => r.data),
  getMaintenanceStatus: () => api.get("/admin/maintenance").then(r => r.data),
  forceResolveClosedDraws: () => api.post("/admin/force-resolve-closed").then(r => r.data),
  getAdmins: () => api.get("/admin/admins").then(r => r.data),
  updatePermissions: (data: { userId: string; permissions: string[]; role?: string }) =>
    api.patch("/admin/permissions", data).then(r => r.data),
};

export const notificationsApi = {
  getMine: () => api.get("/notifications").then(r => r.data || []),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
};

export const profileApi = {
  requestPinReset: () => api.post("/profiles/request-pin-reset").then(r => r.data),
  verifyPinReset: (code: string, newPin: string) =>
    api.post("/profiles/verify-pin-reset", { code, newPin }).then(r => r.data),
  getReferrals: () => api.get("/profiles/referrals").then(r => r.data),
  getMe: (referredBy?: string) => {
    const url = referredBy ? `/profiles/me?referredBy=${referredBy}` : `/profiles/me`;
    return api.get(url).then(r => r.data);
  },
};

export default api;