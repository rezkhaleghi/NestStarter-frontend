export type QueryValue = string | number | boolean | undefined | null;

export type QueryParams = Record<string, QueryValue>;

export type RequestRecord = {
  id: string;
  method: string;
  path: string;
  status?: number;
  duration: number;
  request?: unknown;
  response?: unknown;
  error?: unknown;
  createdAt: string;
};

export type RequestListener = (record: RequestRecord) => void;

let listener: RequestListener | undefined;

export const subscribeToRequests = (next: RequestListener) => {
  listener = next;

  return () => {
    listener = undefined;
  };
};

/**
 * Central HTTP client for the testing dashboard.
 *
 * Every request includes credentials because NestStarter uses
 * session-based authentication with the connect.sid cookie.
 *
 * The request listener is intentionally kept here so the dashboard
 * can display every API call, request payload, response and error.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & {
    query?: QueryParams;
  } = {},
): Promise<T> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);

  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const started = performance.now();
  const method = options.method || "GET";

  let requestBody: unknown;

  if (typeof options.body === "string") {
    try {
      requestBody = JSON.parse(options.body);
    } catch {
      requestBody = options.body;
    }
  } else if (options.body instanceof FormData) {
    requestBody = "[FormData]";
  }

  let response: Response | undefined;
  let parsed: unknown;

  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(typeof options.body === "string"
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const text = await response.text();

    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    const record: RequestRecord = {
      id: crypto.randomUUID(),
      method,
      path: `${url.pathname}${url.search}`,
      status: response.status,
      duration: Math.round(performance.now() - started),
      request: requestBody,
      response: parsed,
      createdAt: new Date().toISOString(),
    };

    listener?.(record);

    if (!response.ok) {
      const message =
        typeof parsed === "object" && parsed !== null && "message" in parsed
          ? String(parsed.message)
          : `Request failed — ${response.status}`;

      throw Object.assign(new Error(message), {
        status: response.status,
        payload: parsed,
      });
    }

    return parsed as T;
  } catch (error) {
    if (!response) {
      listener?.({
        id: crypto.randomUUID(),
        method,
        path: `${url.pathname}${url.search}`,
        duration: Math.round(performance.now() - started),
        request: requestBody,
        error: error instanceof Error ? error.message : error,
        createdAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

/**
 * JSON write helper.
 */
export const writeApi = <T = unknown>(
  path: string,
  method: string,
  body?: unknown,
  headers?: HeadersInit,
) =>
  apiRequest<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
  });

/* -------------------------------------------------------------------------- */
/* Shared query types                                                         */
/* -------------------------------------------------------------------------- */

export type PaginationQuery = {
  page?: number;
  limit?: number;
  sortDirection?: "ASC" | "DESC";
};

export type UserBalancesQuery = PaginationQuery & {
  sortBy?: "currency" | "amount" | "createdAt";
};

export type DepositListQuery = PaginationQuery & {
  sortBy?: "createdAt" | "amount";
};

export type WithdrawalListQuery = PaginationQuery & {
  sortBy?: "createdAt" | "amount";
};

export type TicketListQuery = PaginationQuery & {
  status?: string;
  priority?: string;
  categoryId?: string;
  sortBy?: "createdAt" | "priority" | "status";
};

export type AdminTicketListQuery = TicketListQuery & {
  userId?: string;
  assignedToUserId?: string;
};

export type AdminTicketCategoryListQuery = PaginationQuery & {
  sortBy?: "createdAt" | "name";
};

export type AdminUserListQuery = PaginationQuery & {
  search?: string;
  role?: string;
  emailVerified?: boolean;
  sortBy?: "createdAt" | "email" | "role";
  status?: string;
};

export type AuditLogListQuery = PaginationQuery & {
  action?: string;
  actorUserId?: string;
  targetUserId?: string;
  from?: string;
  to?: string;
};

export type AdminDepositListQuery = PaginationQuery & {
  userId?: string;
  currency?: string;
  status?: string;
  referenceId?: string;
  providerPaymentId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "amount";
};

export type AdminWithdrawalListQuery = PaginationQuery & {
  userId?: string;
  currency?: string;
  status?: string;
  referenceId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "amount";
};

export type LedgerListQuery = PaginationQuery & {
  userId?: string;
  currency?: string;
  type?: string;
  actorUserId?: string;
  referenceId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "amount";
};

export type UserNotificationListQuery = PaginationQuery & {
  channel?: string;
  type?: string;
};

export type AdminNotificationListQuery = PaginationQuery & {
  userId?: string;
  type?: string;
  channel?: string;
  status?: string;
  from?: string;
  to?: string;
};

/* -------------------------------------------------------------------------- */
/* Auth                                                                      */
/* -------------------------------------------------------------------------- */

export type RequestOtpInput = {
  email: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  otp: string;
};

export type LoginPasswordInput = {
  email: string;
  password: string;
};

export type LoginOtpInput = {
  email: string;
  otp: string;
};

export type ChangePasswordInput = {
  password: string;
};

export const authApi = {
  requestOtp: (body: RequestOtpInput) =>
    writeApi("/auth/request-otp", "POST", body),

  signUp: (body: SignUpInput) => writeApi("/auth/sign-up", "POST", body),

  loginPassword: (body: LoginPasswordInput) =>
    writeApi("/auth/simple-login", "POST", body),

  loginOtp: (body: LoginOtpInput) => writeApi("/auth/login-otp", "POST", body),

  changePassword: (body: ChangePasswordInput) =>
    writeApi("/auth/change-password", "POST", body),

  logout: () => writeApi("/auth/logout", "POST"),

  /**
   * Google OAuth is a browser redirect rather than a JSON API call.
   */
  googleLoginUrl: () => `${getApiBaseUrl()}/auth/google`,
};

/* -------------------------------------------------------------------------- */
/* Current user                                                              */
/* -------------------------------------------------------------------------- */

export type UpdateProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
};

export const usersApi = {
  me: () => apiRequest("/users/me"),

  balances: (query: UserBalancesQuery = {}) =>
    apiRequest("/users/me/balances", {
      query,
    }),

  updateMe: (body: UpdateProfileInput) => writeApi("/users/me", "PATCH", body),

  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },

  deleteAvatar: () => writeApi("/users/me/avatar", "DELETE"),

  search: (query: { q: string; page?: number; limit?: number }) =>
    apiRequest("/users/search", {
      query,
    }),

  notifications: (query: UserNotificationListQuery = {}) =>
    apiRequest("/users/me/notifications", {
      query,
    }),

  markNotificationRead: (id: string) =>
    writeApi(`/users/me/notifications/${id}/read`, "PATCH"),
};

/* -------------------------------------------------------------------------- */
/* Deposits                                                                   */
/* -------------------------------------------------------------------------- */

export type CreateDepositInput = {
  provider: string;
  currency: string;
  amount: string;
};

export const depositsApi = {
  list: (query: DepositListQuery = {}) =>
    apiRequest("/deposits", {
      query,
    }),

  get: (id: string) => apiRequest(`/deposits/${id}`),

  create: (body: CreateDepositInput, idempotencyKey: string) =>
    apiRequest("/deposits", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    }),

  verify: (id: string) => writeApi(`/deposits/${id}/verify`, "POST"),
};

/* -------------------------------------------------------------------------- */
/* Withdrawals                                                                */
/* -------------------------------------------------------------------------- */

export type CreateWithdrawalInput = {
  currency: string;
  amount: string;
  destination: string;
};

export const withdrawalsApi = {
  list: (query: WithdrawalListQuery = {}) =>
    apiRequest("/withdrawals", {
      query,
    }),

  get: (id: string) => apiRequest(`/withdrawals/${id}`),

  create: (body: CreateWithdrawalInput) =>
    writeApi("/withdrawals", "POST", body),
};

/* -------------------------------------------------------------------------- */
/* Tickets                                                                    */
/* -------------------------------------------------------------------------- */

export type CreateTicketInput = {
  subject: string;
  categoryId?: string;
  priority?: string;
  message: string;
};

export type CreateTicketMessageInput = {
  body: string;
};

export const ticketsApi = {
  list: (query: TicketListQuery = {}) =>
    apiRequest("/tickets", {
      query,
    }),

  get: (id: string) => apiRequest(`/tickets/${id}`),

  create: (body: CreateTicketInput) => writeApi("/tickets", "POST", body),

  createMessage: (id: string, body: CreateTicketMessageInput) =>
    writeApi(`/tickets/${id}/messages`, "POST", body),
};

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The backend streams files instead of returning JSON.
 *
 * Do not send this through apiRequest(), because apiRequest() intentionally
 * parses JSON/text responses for the testing dashboard.
 */
export const filesApi = {
  url: (path: string) => `${getApiBaseUrl()}/files/${path.replace(/^\/+/, "")}`,
};

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export const healthApi = {
  check: () => apiRequest("/health"),
};

/* -------------------------------------------------------------------------- */
/* Admin users                                                                */
/* -------------------------------------------------------------------------- */

export type CreateAdminUserInput = {
  email: string;
  password: string;
  role?: string;
};

export type UpdateAdminUserInput = {
  email?: string;
  password?: string;
  role?: string;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  status?: string;
};

export type UpdateAdminUserPasswordInput = {
  password: string;
};

export const adminUsersApi = {
  statistics: () => apiRequest("/admin/users/statistics"),

  list: (query: AdminUserListQuery = {}) =>
    apiRequest("/admin/users", {
      query,
    }),

  get: (id: string) => apiRequest(`/admin/users/${id}`),

  create: (body: CreateAdminUserInput) =>
    writeApi("/admin/users", "POST", body),

  update: (id: string, body: UpdateAdminUserInput) =>
    writeApi(`/admin/users/${id}`, "PATCH", body),

  delete: (id: string) => writeApi(`/admin/users/${id}`, "DELETE"),

  changePassword: (id: string, body: UpdateAdminUserPasswordInput) =>
    writeApi(`/admin/users/${id}/password`, "PATCH", body),

  deleteAvatar: (id: string) => writeApi(`/admin/users/${id}/avatar`, "DELETE"),

  balances: (userId: string, query: UserBalancesQuery = {}) =>
    apiRequest(`/admin/users/${userId}/balances`, {
      query,
    }),

  updateBalance: (userId: string, currency: string, body: { amount: string }) =>
    writeApi(
      `/admin/users/${userId}/balances/${encodeURIComponent(currency)}`,
      "PATCH",
      body,
    ),
};

/* -------------------------------------------------------------------------- */
/* Admin deposits                                                             */
/* -------------------------------------------------------------------------- */

export const adminDepositsApi = {
  list: (query: AdminDepositListQuery = {}) =>
    apiRequest("/admin/deposits", {
      query,
    }),

  get: (id: string) => apiRequest(`/admin/deposits/${id}`),
};

/* -------------------------------------------------------------------------- */
/* Admin withdrawals                                                          */
/* -------------------------------------------------------------------------- */

export type UpdateWithdrawalStatusInput = {
  status: "APPROVED" | "REJECTED" | "COMPLETED";
  reason?: string;
  transactionId?: string;
};

export const adminWithdrawalsApi = {
  list: (query: AdminWithdrawalListQuery = {}) =>
    apiRequest("/admin/withdrawals", {
      query,
    }),

  get: (id: string) => apiRequest(`/admin/withdrawals/${id}`),

  updateStatus: (id: string, body: UpdateWithdrawalStatusInput) =>
    writeApi(`/admin/withdrawals/${id}/status`, "PATCH", body),
};

/* -------------------------------------------------------------------------- */
/* Admin ledgers                                                              */
/* -------------------------------------------------------------------------- */

export const adminLedgersApi = {
  list: (query: LedgerListQuery = {}) =>
    apiRequest("/admin/ledgers", {
      query,
    }),
};

/* -------------------------------------------------------------------------- */
/* Admin audit logs                                                           */
/* -------------------------------------------------------------------------- */

export const adminAuditLogsApi = {
  list: (query: AuditLogListQuery = {}) =>
    apiRequest("/admin/users/audit-logs", {
      query,
    }),
};

/* -------------------------------------------------------------------------- */
/* Admin notifications                                                        */
/* -------------------------------------------------------------------------- */

export const adminNotificationsApi = {
  list: (query: AdminNotificationListQuery = {}) =>
    apiRequest("/admin/notifications", {
      query,
    }),

  get: (id: string) => apiRequest(`/admin/notifications/${id}`),
};

/* -------------------------------------------------------------------------- */
/* Admin tickets                                                              */
/* -------------------------------------------------------------------------- */

export type CreateTicketCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateTicketCategoryInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export type AssignTicketInput = {
  assignedToUserId: string | null;
};

export type UpdateTicketStatusInput = {
  status: string;
};

export type UpdateTicketPriorityInput = {
  priority: string;
};

export const adminTicketsApi = {
  list: (query: AdminTicketListQuery = {}) =>
    apiRequest("/admin/tickets", {
      query,
    }),

  get: (id: string) => apiRequest(`/admin/tickets/${id}`),

  createMessage: (id: string, body: CreateTicketMessageInput) =>
    writeApi(`/admin/tickets/${id}/messages`, "POST", body),

  assign: (id: string, body: AssignTicketInput) =>
    writeApi(`/admin/tickets/${id}/assign`, "PATCH", body),

  updateStatus: (id: string, body: UpdateTicketStatusInput) =>
    writeApi(`/admin/tickets/${id}/status`, "PATCH", body),

  updatePriority: (id: string, body: UpdateTicketPriorityInput) =>
    writeApi(`/admin/tickets/${id}/priority`, "PATCH", body),

  categories: (query: AdminTicketCategoryListQuery = {}) =>
    apiRequest("/admin/tickets/categories", {
      query,
    }),

  createCategory: (body: CreateTicketCategoryInput) =>
    writeApi("/admin/tickets/categories", "POST", body),

  updateCategory: (id: string, body: UpdateTicketCategoryInput) =>
    writeApi(`/admin/tickets/categories/${id}`, "PATCH", body),

  deactivateCategory: (id: string) =>
    writeApi(`/admin/tickets/categories/${id}/deactivate`, "PATCH"),
};

/* -------------------------------------------------------------------------- */
/* Backwards-compatible endpoint object                                      */
/* -------------------------------------------------------------------------- */

/**
 * Keep the original `endpoints` object so existing dashboard components
 * don't immediately break while we migrate them to the grouped API objects.
 */
export const endpoints = {
  me: usersApi.me,
  balances: usersApi.balances,
  notifications: usersApi.notifications,

  withdrawals: withdrawalsApi.list,
  deposits: depositsApi.list,
  tickets: ticketsApi.list,

  adminStats: adminUsersApi.statistics,
  adminUsers: adminUsersApi.list,
  adminWithdrawals: adminWithdrawalsApi.list,
  adminDeposits: adminDepositsApi.list,
  ledgers: adminLedgersApi.list,
  auditLogs: adminAuditLogsApi.list,
  adminNotifications: adminNotificationsApi.list,
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
}
