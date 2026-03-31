export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum AdminPermission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_USERS = 'VIEW_USERS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_DRAWS = 'MANAGE_DRAWS',
  VIEW_FINANCIALS = 'VIEW_FINANCIALS',
  VIEW_PROFIT = 'VIEW_PROFIT',
  VIEW_ADVANCED_STATS = 'VIEW_ADVANCED_STATS',
  SEND_GLOBAL_NOTIFICATION = 'SEND_GLOBAL_NOTIFICATION',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  MANAGE_NETWORKS = 'MANAGE_NETWORKS'
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  balance: number;
  role: UserRole | string;
  permissions: AdminPermission[] | string[];
  referral_code: string;
  email?: string;
  phone?: string;
  created_at: string;
  is_blocked?: boolean;
}
