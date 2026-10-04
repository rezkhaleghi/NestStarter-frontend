"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Code2,
  Database,
  FileClock,
  FileImage,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  Menu,
  Moon,
  Play,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Ticket,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  adminAuditLogsApi,
  adminDepositsApi,
  adminLedgersApi,
  adminNotificationsApi,
  adminTicketsApi,
  adminUsersApi,
  adminWithdrawalsApi,
  authApi,
  depositsApi,
  endpoints,
  filesApi,
  healthApi,
  RequestRecord,
  subscribeToRequests,
  ticketsApi,
  usersApi,
  withdrawalsApi,
} from "@/lib/api";

const DEFAULT_BODIES = {
  // =========================
  // Authentication
  // =========================

  requestOtp: {
    email: "test@example.com",
  },

  signUp: {
    email: "test@example.com",
    password: "TestPassword123!",
    otp: "123456",
  },

  simpleLogin: {
    email: "test@example.com",
    password: "TestPassword123!",
  },

  loginOtp: {
    email: "test@example.com",
    otp: "123456",
  },

  changePassword: {
    password: "NewTestPassword123!",
  },

  // =========================
  // User
  // =========================

  updateProfile: {
    firstName: "Test",
    lastName: "User",
    userName: "test_user",
    dateOfBirth: "1995-01-15",
    bio: "Test profile from NestStarter testing dashboard",
  },

  // =========================
  // Deposits
  // =========================

  createDeposit: {
    provider: "FAKE",
    currency: "USD",
    amount: "100",
  },

  // =========================
  // Withdrawals
  // =========================

  createWithdrawal: {
    currency: "USD",
    amount: "25",
    destination: "test-wallet-address",
  },

  // =========================
  // Tickets
  // =========================

  createTicket: {
    subject: "Test support ticket",
    message:
      "This is a test support ticket created from the testing dashboard.",
  },

  createTicketMessage: {
    body: "This is a test reply from the testing dashboard.",
  },

  // =========================
  // Admin Users
  // =========================

  createAdminUser: {
    email: "admin-test@example.com",
    password: "AdminTestPassword123!",
    role: "USER",
  },

  updateAdminUser: {
    email: "updated-test@example.com",
    role: "USER",
    emailVerified: true,
    firstName: "Updated",
    lastName: "User",
    userName: "updated_user",
    dateOfBirth: "1995-01-15",
    bio: "Updated from admin testing dashboard",
    status: "ACTIVE",
  },

  changeAdminUserPassword: {
    password: "NewAdminTestPassword123!",
  },

  // =========================
  // Admin User Balances
  // =========================

  updateUserBalance: {
    amount: "100",
  },

  // =========================
  // Admin Ticket Categories
  // =========================

  createTicketCategory: {
    name: "Technical Support",
    description: "Technical support test category",
  },

  updateTicketCategory: {
    name: "Updated Technical Support",
    description: "Updated test category",
    isActive: true,
  },

  // =========================
  // Admin Ticket Operations
  // =========================

  assignTicket: {
    assignedToUserId: null,
  },

  updateTicketStatus: {
    status: "OPEN",
  },

  updateTicketPriority: {
    priority: "MEDIUM",
  },

  createAdminTicketMessage: {
    body: "This is an admin reply from the testing dashboard.",
  },

  // =========================
  // Admin Withdrawal
  // =========================

  updateWithdrawalStatus: {
    status: "APPROVED",
    reason: "Withdrawal approved for testing.",
  },
} as const;

type Section =
  | "Dashboard"
  | "Authentication"
  | "Profile"
  | "Balance"
  | "Deposits"
  | "Withdrawals"
  | "Tickets"
  | "Notifications"
  | "Users"
  | "Admin Balances"
  | "Admin Deposits"
  | "Admin Withdrawals"
  | "Ledgers"
  | "Audit Logs"
  | "Admin Notifications"
  | "Admin Tickets"
  | "Files"
  | "Health"
  | "API Inspector"
  | "Request History"
  | "Settings";

type Action = {
  label: string;
  method: string;
  path: string;
  description: string;
  defaultBody?: Record<string, unknown>;
  execute: (input: OperationInput) => Promise<unknown>;
};

type OperationInput = {
  id: string;
  id2: string;
  query: string;
  body: string;
  idempotencyKey: string;
};

const userNav: {
  label: Section;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Authentication", icon: LogIn },
  { label: "Profile", icon: CircleUserRound },
  { label: "Balance", icon: WalletCards },
  { label: "Deposits", icon: ArrowDownToLine },
  { label: "Withdrawals", icon: ArrowUpFromLine },
  { label: "Tickets", icon: Ticket },
  { label: "Notifications", icon: Bell },
];

const adminNav: {
  label: Section;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Users", icon: Users },
  { label: "Admin Balances", icon: WalletCards },
  { label: "Admin Deposits", icon: ArrowDownToLine },
  { label: "Admin Withdrawals", icon: ArrowUpFromLine },
  { label: "Ledgers", icon: BookOpen },
  { label: "Audit Logs", icon: FileClock },
  { label: "Admin Notifications", icon: Bell },
  { label: "Admin Tickets", icon: Ticket },
];

const systemNav: {
  label: Section;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Files", icon: FileImage },
  { label: "Health", icon: HeartPulse },
  { label: "API Inspector", icon: Code2 },
  { label: "Request History", icon: Activity },
  { label: "Settings", icon: Settings },
];

function pretty(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function parseJson(value: string): Record<string, unknown> {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  return parsed;
}

function parseQuery(value: string): Record<string, string | number | boolean> {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Query must be a JSON object.");
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(([, item]) => item !== undefined),
  ) as Record<string, string | number | boolean>;
}

function endpointLabel(method: string, path: string) {
  return `${method} ${path}`;
}

export function Dashboard() {
  const [section, setSection] = useState<Section>("Dashboard");
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useMemo(() => {
    return subscribeToRequests((record) => {
      setRecords((items) => [record, ...items].slice(0, 100));
    });
  }, []);

  const me =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;

  const execute = async (label: string, operation: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    setLastAction(label);

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => execute("GET /users/me", () => usersApi.me());

  const navigate = (next: Section) => {
    setSection(next);
    setMobileOpen(false);

    if (next === "Dashboard" || next === "Profile") {
      void loadCurrentUser();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r bg-sidebar transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Database className="size-4" />
            </div>

            <div>
              <p className="font-semibold tracking-tight">NestStarter</p>
              <p className="text-[11px] text-muted-foreground">
                API control plane
              </p>
            </div>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex max-h-[calc(100vh-4rem)] flex-col gap-5 overflow-y-auto p-3 text-sm">
          <NavGroup
            title="USER"
            items={userNav}
            section={section}
            setSection={navigate}
          />

          <NavGroup
            title="ADMIN"
            items={adminNav}
            section={section}
            setSection={navigate}
          />

          <NavGroup
            title="SYSTEM / DEBUG"
            items={systemNav}
            section={section}
            setSection={navigate}
          />
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span>Workspace</span>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{section}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border px-3 py-1.5 font-mono text-xs text-muted-foreground md:inline">
              {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}
            </span>

            <button
              className="rounded-md p-2 hover:bg-muted"
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.classList.toggle("dark", next);
              }}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 lg:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Internal backend testing dashboard
              </p>

              <h1 className="text-2xl font-semibold tracking-tight">
                {section}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Execute and inspect the real NestStarter API.
              </p>
            </div>

            {![
              "Authentication",
              "API Inspector",
              "Request History",
              "Settings",
              "Dashboard",
            ].includes(section) && (
              <button
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  void loadSection(section);
                }}
              >
                <RefreshCw className="size-4" />
                Refresh
              </button>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <X className="size-4" />
                Request failed
              </div>

              <pre className="mt-2 overflow-auto text-xs">{error}</pre>
            </div>
          )}

          {lastAction && (
            <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5" />
              Last operation: {lastAction}
            </div>
          )}

          {section === "Dashboard" && (
            <Overview data={me} records={records} navigate={navigate} />
          )}

          {section === "Authentication" && (
            <Authentication
              execute={execute}
              loadCurrentUser={loadCurrentUser}
            />
          )}

          {section === "Profile" && (
            <Profile data={data} execute={execute} refresh={loadCurrentUser} />
          )}

          {section === "Balance" && (
            <OperationPanel
              title="Current user balances"
              actions={getBalanceActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Deposits" && (
            <OperationPanel
              title="Deposits"
              actions={getDepositActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Withdrawals" && (
            <OperationPanel
              title="Withdrawals"
              actions={getWithdrawalActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Tickets" && (
            <OperationPanel
              title="Tickets"
              actions={getTicketActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Notifications" && (
            <OperationPanel
              title="Notifications"
              actions={getNotificationActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Users" && (
            <OperationPanel
              title="Admin users"
              actions={getAdminUserActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Admin Balances" && (
            <OperationPanel
              title="Admin user balances"
              actions={getAdminBalanceActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Admin Deposits" && (
            <OperationPanel
              title="Admin deposits"
              actions={getAdminDepositActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Admin Withdrawals" && (
            <OperationPanel
              title="Admin withdrawals"
              actions={getAdminWithdrawalActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Ledgers" && (
            <OperationPanel
              title="Ledgers"
              actions={getLedgerActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Audit Logs" && (
            <OperationPanel
              title="Audit logs"
              actions={getAuditActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Admin Notifications" && (
            <OperationPanel
              title="Admin notifications"
              actions={getAdminNotificationActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Admin Tickets" && (
            <OperationPanel
              title="Admin tickets"
              actions={getAdminTicketActions(execute)}
              data={data}
              loading={loading}
            />
          )}

          {section === "Files" && <FilesPanel />}

          {section === "Health" && (
            <OperationPanel
              title="System health"
              actions={[
                {
                  label: "Health check",
                  method: "GET",
                  path: "/health",
                  description: "Check backend health dependencies.",
                  execute: () => healthApi.check(),
                },
              ]}
              data={data}
              loading={loading}
            />
          )}

          {section === "API Inspector" && <Inspector record={records[0]} />}

          {section === "Request History" && (
            <History records={records} clear={() => setRecords([])} />
          )}

          {section === "Settings" && (
            <SettingsPanel dark={dark} setDark={setDark} records={records} />
          )}
        </main>
      </div>
    </div>
  );

  async function loadSection(current: Section) {
    const actions = getSectionActions(current, execute);

    if (!actions.length) {
      return;
    }

    await actions[0].execute({
      id: "",
      id2: "",
      query: "",
      body: "",
      idempotencyKey: "",
    });
  }
}

function NavGroup({
  title,
  items,
  section,
  setSection,
}: {
  title: string;
  items: { label: Section; icon: typeof LayoutDashboard }[];
  section: Section;
  setSection: (section: Section) => void;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
        {title}
      </p>

      <div className="flex flex-col gap-1">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setSection(label)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              section === label
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Overview({
  data,
  records,
  navigate,
}: {
  data: Record<string, unknown> | null;
  records: RequestRecord[];
  navigate: (section: Section) => void;
}) {
  const cards = [
    {
      label: "Session",
      value: data ? "Authenticated" : "Unknown",
      hint: data ? String(data.email || "") : "Run authentication",
    },
    {
      label: "Requests",
      value: String(records.length),
      hint: "Captured in this browser tab",
    },
    {
      label: "API",
      value: "Online",
      hint: "localhost:3000",
    },
    {
      label: "Testing mode",
      value: "Active",
      hint: "No production frontend logic",
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>

            <p className="mt-3 text-xl font-semibold">{card.value}</p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {card.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5" />
          <div>
            <h2 className="font-semibold">Backend test surface</h2>
            <p className="text-sm text-muted-foreground">
              Every major backend module is directly accessible.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Authentication", "Test sessions and OTP flows."],
            ["Deposits", "Create, verify and inspect deposits."],
            ["Withdrawals", "Create and inspect withdrawal lifecycle."],
            ["Tickets", "Create tickets and messages."],
            ["Users", "Search and administer users."],
            ["Admin Tickets", "Manage ticket workflow."],
            ["Ledgers", "Inspect financial ledger records."],
            ["Audit Logs", "Inspect administrative actions."],
            ["Health", "Verify infrastructure health."],
          ].map(([name, description]) => (
            <button
              key={name}
              onClick={() => navigate(name as Section)}
              className="rounded-lg border p-4 text-left transition hover:bg-muted"
            >
              <p className="font-medium">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Authentication({
  execute,
  loadCurrentUser,
}: {
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>;
  loadCurrentUser: () => Promise<unknown>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <OperationPanel
        title="Authentication API"
        actions={[
          {
            label: "Request OTP",
            method: "POST",
            path: "/auth/request-otp",
            description: "Request an email OTP.",
            defaultBody: DEFAULT_BODIES.requestOtp,
            execute: ({ body }) =>
              execute("POST /auth/request-otp", () =>
                authApi.requestOtp(parseJson(body) as { email: string }),
              ),
          },
          {
            label: "Sign up",
            method: "POST",
            path: "/auth/sign-up",
            description: "Create account using OTP.",
            defaultBody: DEFAULT_BODIES.signUp,
            execute: ({ body }) =>
              execute("POST /auth/sign-up", () =>
                authApi.signUp(
                  parseJson(body) as {
                    email: string;
                    password: string;
                    otp: string;
                  },
                ),
              ),
          },
          {
            label: "Password login",
            method: "POST",
            path: "/auth/simple-login",
            description: "Create a session using email/password.",
            defaultBody: DEFAULT_BODIES.simpleLogin,
            execute: ({ body }) =>
              execute("POST /auth/simple-login", () =>
                authApi.loginPassword(
                  parseJson(body) as {
                    email: string;
                    password: string;
                  },
                ),
              ),
          },
          {
            label: "OTP login",
            method: "POST",
            path: "/auth/login-otp",
            description: "Create a session using OTP.",
            defaultBody: DEFAULT_BODIES.loginOtp,
            execute: ({ body }) =>
              execute("POST /auth/login-otp", () =>
                authApi.loginOtp(
                  parseJson(body) as {
                    email: string;
                    otp: string;
                  },
                ),
              ),
          },
          {
            label: "Change password",
            method: "POST",
            path: "/auth/change-password",
            description: "Change the current password.",
            defaultBody: DEFAULT_BODIES.changePassword,
            execute: ({ body }) =>
              execute("POST /auth/change-password", () =>
                authApi.changePassword(parseJson(body) as { password: string }),
              ),
          },
          {
            label: "Logout",
            method: "POST",
            path: "/auth/logout",
            description: "Destroy the current session.",
            execute: () => execute("POST /auth/logout", () => authApi.logout()),
          },
          {
            label: "Current user",
            method: "GET",
            path: "/users/me",
            description: "Verify current session.",
            execute: () => execute("GET /users/me", () => loadCurrentUser()),
          },
        ]}
        data={null}
        loading={false}
      />

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold">Google OAuth</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          OAuth is a browser redirect rather than a JSON API call.
        </p>

        <a
          href={authApi.googleLoginUrl()}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <LogIn className="size-4" />
          Start Google login
        </a>

        <div className="mt-8 rounded-lg bg-muted p-4">
          <p className="font-mono text-xs">GET /auth/google</p>
        </div>
      </div>
    </div>
  );
}

function Profile({
  data,
  execute,
  refresh,
}: {
  data: unknown;
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>;
  refresh: () => Promise<unknown>;
}) {
  return (
    <OperationPanel
      title="Current user"
      actions={[
        {
          label: "Get profile",
          method: "GET",
          path: "/users/me",
          description: "Fetch the authenticated user.",
          execute: () => execute("GET /users/me", () => usersApi.me()),
        },
        {
          label: "Update profile",
          method: "PATCH",
          path: "/users/me",
          description: "Update profile fields.",
          defaultBody: DEFAULT_BODIES.updateProfile,
          execute: ({ body }) =>
            execute("PATCH /users/me", () =>
              usersApi.updateMe(
                parseJson(body) as {
                  firstName?: string | null;
                  lastName?: string | null;
                  userName?: string | null;
                  dateOfBirth?: string | null;
                  bio?: string | null;
                },
              ),
            ),
        },
        {
          label: "Delete avatar",
          method: "DELETE",
          path: "/users/me/avatar",
          description: "Remove the current avatar.",
          execute: () =>
            execute("DELETE /users/me/avatar", () => usersApi.deleteAvatar()),
        },
        {
          label: "Refresh profile",
          method: "GET",
          path: "/users/me",
          description: "Refresh current user data.",
          execute: refresh,
        },
      ]}
      data={data}
      loading={false}
      extra={<AvatarUpload execute={execute} />}
    />
  );
}

function AvatarUpload({
  execute,
}: {
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Upload avatar</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        JPEG, PNG, WebP or GIF. Maximum 5 MB.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="text-sm"
        />

        <button
          disabled={!file}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (!file) return;

            void execute("POST /users/me/avatar", () =>
              usersApi.updateAvatar(file),
            );
          }}
        >
          Upload
        </button>
      </div>
    </div>
  );
}

function OperationPanel({
  title,
  actions,
  data,
  loading,
  extra,
}: {
  title: string;
  actions: Action[];
  data: unknown;
  loading: boolean;
  extra?: React.ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const [id, setId] = useState("");
  const [id2, setId2] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState(() =>
    actions[0]?.defaultBody
      ? JSON.stringify(actions[0].defaultBody, null, 2)
      : "",
  );
  const [idempotencyKey, setIdempotencyKey] = useState(crypto.randomUUID());

  const action = actions[selected];

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select an operation to execute it against NestStarter.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {actions.map((item, index) => (
              <button
                key={`${item.method}-${item.path}`}
                onClick={() => {
                  setSelected(index);
                  setBody(
                    item.defaultBody
                      ? JSON.stringify(item.defaultBody, null, 2)
                      : "",
                  );
                }}
                className={`rounded-lg border p-3 text-left ${
                  index === selected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold">
                    {item.method}
                  </span>

                  <span className="text-sm font-medium">{item.label}</span>
                </div>

                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                  {item.path}
                </p>
              </button>
            ))}
          </div>
        </div>

        {extra}
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold">
                  {action.method}
                </span>

                <h2 className="font-semibold">{action.label}</h2>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {action.description}
              </p>

              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {action.path}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {action.path.includes(":") && (
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="ID / UUID"
                  value={id}
                  onChange={setId}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />

                <Field
                  label="Second ID / parameter"
                  value={id2}
                  onChange={setId2}
                  placeholder="Optional"
                />
              </div>
            )}

            {action.method === "GET" && (
              <JsonField
                label="Query parameters"
                value={query}
                onChange={setQuery}
                placeholder={`{
  "page": 1,
  "limit": 20
}`}
              />
            )}

            {action.method !== "GET" && action.method !== "DELETE" && (
              <JsonField
                label="JSON body"
                value={body}
                onChange={setBody}
                placeholder={`{
  "email": "user@example.com"
}`}
              />
            )}

            {action.path === "/deposits" && action.method === "POST" && (
              <Field
                label="Idempotency-Key"
                value={idempotencyKey}
                onChange={setIdempotencyKey}
                placeholder="Unique request key"
              />
            )}

            <button
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              onClick={async () => {
                try {
                  await action.execute({
                    id,
                    id2,
                    query,
                    body,
                    idempotencyKey,
                  });
                } catch {
                  // Error is displayed by the parent dashboard.
                }
              }}
            >
              <Play className="size-4" />
              {loading ? "Running…" : "Execute request"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold">Response</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Raw API response
              </p>
            </div>

            {loading && <RefreshCw className="size-4 animate-spin" />}
          </div>

          <pre className="max-h-[650px] overflow-auto p-5 text-xs leading-6 text-muted-foreground">
            {pretty(data)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-sm">
      {label}

      <input
        className="mt-2 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function JsonField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="text-sm">
      {label}

      <textarea
        className="mt-2 min-h-40 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs leading-5"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </label>
  );
}

function getBalanceActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List balances",
      method: "GET",
      path: "/users/me/balances",
      description: "List current user balances.",
      execute: ({ query }) =>
        execute("GET /users/me/balances", () =>
          usersApi.balances(parseQuery(query)),
        ),
    },
  ];
}

function getDepositActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List deposits",
      method: "GET",
      path: "/deposits",
      description: "List current user deposits.",
      execute: ({ query }) =>
        execute("GET /deposits", () => depositsApi.list(parseQuery(query))),
    },
    {
      label: "Get deposit",
      method: "GET",
      path: "/deposits/:id",
      description: "Get one deposit by UUID.",
      execute: ({ id }) =>
        execute(`GET /deposits/${id}`, () => depositsApi.get(id)),
    },
    {
      label: "Create deposit",
      method: "POST",
      path: "/deposits",
      description: "Create a deposit. Idempotency-Key is required.",
      defaultBody: DEFAULT_BODIES.createDeposit,
      execute: ({ body, idempotencyKey }) =>
        execute("POST /deposits", () =>
          depositsApi.create(
            parseJson(body) as {
              provider: string;
              currency: string;
              amount: string;
            },
            idempotencyKey,
          ),
        ),
    },
    {
      label: "Verify deposit",
      method: "POST",
      path: "/deposits/:id/verify",
      description: "Verify an existing deposit.",
      execute: ({ id }) =>
        execute(`POST /deposits/${id}/verify`, () => depositsApi.verify(id)),
    },
  ];
}

function getWithdrawalActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List withdrawals",
      method: "GET",
      path: "/withdrawals",
      description: "List current user withdrawals.",
      execute: ({ query }) =>
        execute("GET /withdrawals", () =>
          withdrawalsApi.list(parseQuery(query)),
        ),
    },
    {
      label: "Get withdrawal",
      method: "GET",
      path: "/withdrawals/:id",
      description: "Get one withdrawal by UUID.",
      execute: ({ id }) =>
        execute(`GET /withdrawals/${id}`, () => withdrawalsApi.get(id)),
    },
    {
      label: "Create withdrawal",
      method: "POST",
      path: "/withdrawals",
      description: "Create a withdrawal request.",
      defaultBody: DEFAULT_BODIES.createWithdrawal,
      execute: ({ body }) =>
        execute("POST /withdrawals", () =>
          withdrawalsApi.create(
            parseJson(body) as {
              currency: string;
              amount: string;
              destination: string;
            },
          ),
        ),
    },
  ];
}

function getTicketActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List tickets",
      method: "GET",
      path: "/tickets",
      description: "List current user tickets.",
      execute: ({ query }) =>
        execute("GET /tickets", () => ticketsApi.list(parseQuery(query))),
    },
    {
      label: "Get ticket",
      method: "GET",
      path: "/tickets/:id",
      description: "Get ticket detail.",
      execute: ({ id }) =>
        execute(`GET /tickets/${id}`, () => ticketsApi.get(id)),
    },
    {
      label: "Create ticket",
      method: "POST",
      path: "/tickets",
      description: "Create a ticket with its initial message.",
      defaultBody: DEFAULT_BODIES.createTicket,
      execute: ({ body }) =>
        execute("POST /tickets", () =>
          ticketsApi.create(
            parseJson(body) as {
              subject: string;
              categoryId?: string;
              priority?: string;
              message: string;
            },
          ),
        ),
    },
    {
      label: "Create ticket message",
      method: "POST",
      path: "/tickets/:id/messages",
      description: "Reply to an existing ticket.",
      defaultBody: DEFAULT_BODIES.createTicketMessage,
      execute: ({ id, body }) =>
        execute(`POST /tickets/${id}/messages`, () =>
          ticketsApi.createMessage(id, {
            body: String(parseJson(body).body || ""),
          }),
        ),
    },
  ];
}

function getNotificationActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List notifications",
      method: "GET",
      path: "/users/me/notifications",
      description: "List current user notifications.",
      execute: ({ query }) =>
        execute("GET /users/me/notifications", () =>
          usersApi.notifications(parseQuery(query)),
        ),
    },
    {
      label: "Mark notification read",
      method: "PATCH",
      path: "/users/me/notifications/:id/read",
      description: "Mark an in-app notification as read.",
      execute: ({ id }) =>
        execute(`PATCH /users/me/notifications/${id}/read`, () =>
          usersApi.markNotificationRead(id),
        ),
    },
  ];
}

function getAdminUserActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "Statistics",
      method: "GET",
      path: "/admin/users/statistics",
      description: "Get admin dashboard statistics.",
      execute: () =>
        execute("GET /admin/users/statistics", () =>
          adminUsersApi.statistics(),
        ),
    },
    {
      label: "List users",
      method: "GET",
      path: "/admin/users",
      description: "Search and filter users.",
      execute: ({ query }) =>
        execute("GET /admin/users", () =>
          adminUsersApi.list(parseQuery(query)),
        ),
    },
    {
      label: "Get user",
      method: "GET",
      path: "/admin/users/:id",
      description: "Get one user.",
      execute: ({ id }) =>
        execute(`GET /admin/users/${id}`, () => adminUsersApi.get(id)),
    },
    {
      label: "Create user",
      method: "POST",
      path: "/admin/users",
      description: "Create a user or administrator.",
      defaultBody: DEFAULT_BODIES.createAdminUser,
      execute: ({ body }) =>
        execute("POST /admin/users", () =>
          adminUsersApi.create(
            parseJson(body) as {
              email: string;
              password: string;
              role?: string;
            },
          ),
        ),
    },
    {
      label: "Update user",
      method: "PATCH",
      path: "/admin/users/:id",
      description: "Update account/profile information.",
      defaultBody: DEFAULT_BODIES.updateAdminUser,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/users/${id}`, () =>
          adminUsersApi.update(id, parseJson(body) as Record<string, unknown>),
        ),
    },
    {
      label: "Delete user",
      method: "DELETE",
      path: "/admin/users/:id",
      description: "Delete a user.",
      execute: ({ id }) =>
        execute(`DELETE /admin/users/${id}`, () => adminUsersApi.delete(id)),
    },
    {
      label: "Reset password",
      method: "PATCH",
      path: "/admin/users/:id/password",
      description: "Reset another user password.",
      defaultBody: DEFAULT_BODIES.changeAdminUserPassword,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/users/${id}/password`, () =>
          adminUsersApi.changePassword(id, {
            password: String(parseJson(body).password || ""),
          }),
        ),
    },
    {
      label: "Delete avatar",
      method: "DELETE",
      path: "/admin/users/:id/avatar",
      description: "Delete another user avatar.",
      execute: ({ id }) =>
        execute(`DELETE /admin/users/${id}/avatar`, () =>
          adminUsersApi.deleteAvatar(id),
        ),
    },
    {
      label: "Audit logs",
      method: "GET",
      path: "/admin/users/audit-logs",
      description: "List administrative audit logs.",
      execute: ({ query }) =>
        execute("GET /admin/users/audit-logs", () =>
          adminAuditLogsApi.list(parseQuery(query)),
        ),
    },
  ];
}

function getAdminBalanceActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "Get user balances",
      method: "GET",
      path: "/admin/users/:userId/balances",
      description: "Get balances for a specific user.",
      execute: ({ id, query }) =>
        execute(`GET /admin/users/${id}/balances`, () =>
          adminUsersApi.balances(id, parseQuery(query)),
        ),
    },
    {
      label: "Update balance",
      method: "PATCH",
      path: "/admin/users/:userId/balances/:currency",
      description: "Set a user balance amount.",
      defaultBody: DEFAULT_BODIES.updateUserBalance,
      execute: ({ id, id2, body }) =>
        execute(`PATCH /admin/users/${id}/balances/${id2}`, () =>
          adminUsersApi.updateBalance(id, id2, {
            amount: String(parseJson(body).amount || ""),
          }),
        ),
    },
  ];
}

function getAdminDepositActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List deposits",
      method: "GET",
      path: "/admin/deposits",
      description: "List/filter all deposits.",
      execute: ({ query }) =>
        execute("GET /admin/deposits", () =>
          adminDepositsApi.list(parseQuery(query)),
        ),
    },
    {
      label: "Get deposit",
      method: "GET",
      path: "/admin/deposits/:id",
      description: "Get one deposit.",
      execute: ({ id }) =>
        execute(`GET /admin/deposits/${id}`, () => adminDepositsApi.get(id)),
    },
  ];
}

function getAdminWithdrawalActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List withdrawals",
      method: "GET",
      path: "/admin/withdrawals",
      description: "List/filter withdrawals.",
      execute: ({ query }) =>
        execute("GET /admin/withdrawals", () =>
          adminWithdrawalsApi.list(parseQuery(query)),
        ),
    },
    {
      label: "Get withdrawal",
      method: "GET",
      path: "/admin/withdrawals/:id",
      description: "Get one withdrawal.",
      execute: ({ id }) =>
        execute(`GET /admin/withdrawals/${id}`, () =>
          adminWithdrawalsApi.get(id),
        ),
    },
    {
      label: "Update withdrawal status",
      method: "PATCH",
      path: "/admin/withdrawals/:id/status",
      description: "Approve, reject or complete a withdrawal.",
      defaultBody: DEFAULT_BODIES.updateWithdrawalStatus,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/withdrawals/${id}/status`, () =>
          adminWithdrawalsApi.updateStatus(id, {
            status: String(parseJson(body).status || "APPROVED") as
              | "APPROVED"
              | "REJECTED"
              | "COMPLETED",
            reason: parseJson(body).reason as string | undefined,
            transactionId: parseJson(body).transactionId as string | undefined,
          }),
        ),
    },
  ];
}

function getLedgerActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List ledgers",
      method: "GET",
      path: "/admin/ledgers",
      description: "List/filter financial ledger records.",
      execute: ({ query }) =>
        execute("GET /admin/ledgers", () =>
          adminLedgersApi.list(parseQuery(query)),
        ),
    },
  ];
}

function getAuditActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List audit logs",
      method: "GET",
      path: "/admin/users/audit-logs",
      description: "List administrative audit records.",
      execute: ({ query }) =>
        execute("GET /admin/users/audit-logs", () =>
          adminAuditLogsApi.list(parseQuery(query)),
        ),
    },
  ];
}

function getAdminNotificationActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List notifications",
      method: "GET",
      path: "/admin/notifications",
      description: "List/filter notifications.",
      execute: ({ query }) =>
        execute("GET /admin/notifications", () =>
          adminNotificationsApi.list(parseQuery(query)),
        ),
    },
    {
      label: "Get notification",
      method: "GET",
      path: "/admin/notifications/:id",
      description: "Get one notification.",
      execute: ({ id }) =>
        execute(`GET /admin/notifications/${id}`, () =>
          adminNotificationsApi.get(id),
        ),
    },
  ];
}

function getAdminTicketActions(
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  return [
    {
      label: "List tickets",
      method: "GET",
      path: "/admin/tickets",
      description: "List/filter tickets as administrator.",
      execute: ({ query }) =>
        execute("GET /admin/tickets", () =>
          adminTicketsApi.list(parseQuery(query)),
        ),
    },
    {
      label: "List categories",
      method: "GET",
      path: "/admin/tickets/categories",
      description: "List ticket categories.",
      execute: ({ query }) =>
        execute("GET /admin/tickets/categories", () =>
          adminTicketsApi.categories(parseQuery(query)),
        ),
    },
    {
      label: "Create category",
      method: "POST",
      path: "/admin/tickets/categories",
      description: "Create a ticket category.",
      defaultBody: DEFAULT_BODIES.createTicketCategory,
      execute: ({ body }) =>
        execute("POST /admin/tickets/categories", () =>
          adminTicketsApi.createCategory(
            parseJson(body) as {
              name: string;
              description?: string;
            },
          ),
        ),
    },
    {
      label: "Update category",
      method: "PATCH",
      path: "/admin/tickets/categories/:id",
      description: "Update a ticket category.",
      defaultBody: DEFAULT_BODIES.updateTicketCategory,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/tickets/categories/${id}`, () =>
          adminTicketsApi.updateCategory(
            id,
            parseJson(body) as {
              name?: string;
              description?: string | null;
              isActive?: boolean;
            },
          ),
        ),
    },
    {
      label: "Deactivate category",
      method: "PATCH",
      path: "/admin/tickets/categories/:id/deactivate",
      description: "Deactivate a ticket category.",
      execute: ({ id }) =>
        execute(`PATCH /admin/tickets/categories/${id}/deactivate`, () =>
          adminTicketsApi.deactivateCategory(id),
        ),
    },
    {
      label: "Get ticket",
      method: "GET",
      path: "/admin/tickets/:id",
      description: "Get ticket detail as administrator.",
      execute: ({ id }) =>
        execute(`GET /admin/tickets/${id}`, () => adminTicketsApi.get(id)),
    },
    {
      label: "Admin reply",
      method: "POST",
      path: "/admin/tickets/:id/messages",
      description: "Reply to a ticket as administrator.",
      defaultBody: DEFAULT_BODIES.createAdminTicketMessage,
      execute: ({ id, body }) =>
        execute(`POST /admin/tickets/${id}/messages`, () =>
          adminTicketsApi.createMessage(id, {
            body: String(parseJson(body).body || ""),
          }),
        ),
    },
    {
      label: "Assign ticket",
      method: "PATCH",
      path: "/admin/tickets/:id/assign",
      description: "Assign or unassign an administrator.",
      defaultBody: DEFAULT_BODIES.assignTicket,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/tickets/${id}/assign`, () =>
          adminTicketsApi.assign(id, {
            assignedToUserId:
              (parseJson(body).assignedToUserId as string) ?? null,
          }),
        ),
    },
    {
      label: "Update status",
      method: "PATCH",
      path: "/admin/tickets/:id/status",
      description: "Change ticket status.",
      defaultBody: DEFAULT_BODIES.updateTicketStatus,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/tickets/${id}/status`, () =>
          adminTicketsApi.updateStatus(id, {
            status: String(parseJson(body).status || ""),
          }),
        ),
    },
    {
      label: "Update priority",
      method: "PATCH",
      path: "/admin/tickets/:id/priority",
      description: "Change ticket priority.",
      defaultBody: DEFAULT_BODIES.updateTicketPriority,
      execute: ({ id, body }) =>
        execute(`PATCH /admin/tickets/${id}/priority`, () =>
          adminTicketsApi.updatePriority(id, {
            priority: String(parseJson(body).priority || ""),
          }),
        ),
    },
  ];
}

function getSectionActions(
  section: Section,
  execute: (
    label: string,
    operation: () => Promise<unknown>,
  ) => Promise<unknown>,
): Action[] {
  switch (section) {
    case "Balance":
      return getBalanceActions(execute);
    case "Deposits":
      return getDepositActions(execute);
    case "Withdrawals":
      return getWithdrawalActions(execute);
    case "Tickets":
      return getTicketActions(execute);
    case "Notifications":
      return getNotificationActions(execute);
    case "Users":
      return getAdminUserActions(execute);
    case "Admin Balances":
      return getAdminBalanceActions(execute);
    case "Admin Deposits":
      return getAdminDepositActions(execute);
    case "Admin Withdrawals":
      return getAdminWithdrawalActions(execute);
    case "Ledgers":
      return getLedgerActions(execute);
    case "Audit Logs":
      return getAuditActions(execute);
    case "Admin Notifications":
      return getAdminNotificationActions(execute);
    case "Admin Tickets":
      return getAdminTicketActions(execute);
    case "Health":
      return [
        {
          label: "Health check",
          method: "GET",
          path: "/health",
          description: "Check infrastructure health.",
          execute: () => execute("GET /health", () => healthApi.check()),
        },
      ];
    default:
      return [];
  }
}

function FilesPanel() {
  const [path, setPath] = useState("avatars/example/avatar.webp");

  return (
    <div className="max-w-3xl rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <FileImage className="size-5" />
        <div>
          <h2 className="font-semibold">Public files</h2>
          <p className="text-sm text-muted-foreground">
            NestStarter streams public avatar files.
          </p>
        </div>
      </div>

      <label className="mt-6 block text-sm">
        Avatar object path
        <input
          className="mt-2 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="avatars/user-id/avatar.webp"
        />
      </label>

      <a
        href={filesApi.url(path)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Open file
      </a>

      <pre className="mt-5 rounded-lg bg-muted p-4 text-xs">
        {filesApi.url(path)}
      </pre>
    </div>
  );
}

function Inspector({ record }: { record?: RequestRecord }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <Code2 className="size-4" />
          <h2 className="font-semibold">Latest request</h2>
        </div>

        <pre className="mt-5 max-h-[650px] overflow-auto text-xs leading-6 text-muted-foreground">
          {pretty(
            record || {
              message: "Execute an API operation to inspect it here.",
            },
          )}
        </pre>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Inspector</h2>

        <div className="mt-5 space-y-4 text-sm text-muted-foreground">
          <p>
            Session requests use <code>credentials: include</code>.
          </p>

          <p>
            Every request records method, URL, status, duration, request payload
            and response.
          </p>

          <p>Failed HTTP requests preserve the backend error payload.</p>

          <p>History exists only in the current browser tab.</p>
        </div>
      </div>
    </div>
  );
}

function History({
  records,
  clear,
}: {
  records: RequestRecord[];
  clear: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="font-semibold">Request history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Client-side only.
          </p>
        </div>

        <button
          onClick={clear}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          Clear
        </button>
      </div>

      <div className="divide-y">
        {records.length ? (
          records.map((record) => (
            <div
              key={record.id}
              className="flex flex-wrap items-center gap-4 p-4"
            >
              <span className="w-16 font-mono text-xs font-semibold">
                {record.method}
              </span>

              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {record.path}
              </span>

              <span
                className={`rounded-full px-2 py-1 font-mono text-xs ${
                  record.status && record.status < 400
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {record.status || "ERR"}
              </span>

              <span className="text-xs text-muted-foreground">
                {record.duration}ms
              </span>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No requests yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({
  dark,
  setDark,
  records,
}: {
  dark: boolean;
  setDark: (value: boolean) => void;
  records: RequestRecord[];
}) {
  return (
    <div className="max-w-2xl rounded-xl border bg-card p-6">
      <h2 className="font-semibold">Dashboard settings</h2>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm font-medium">API base URL</p>

          <p className="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm">
            {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Configure NEXT_PUBLIC_API_BASE_URL in the frontend environment.
          </p>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Current dashboard appearance.
            </p>
          </div>

          <button
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.classList.toggle("dark", next);
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {dark ? "Dark" : "Light"}
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div>
            <p className="text-sm font-medium">Request history</p>
            <p className="text-xs text-muted-foreground">
              Stored in memory only.
            </p>
          </div>

          <span className="font-mono text-sm">{records.length}</span>
        </div>
      </div>
    </div>
  );
}
