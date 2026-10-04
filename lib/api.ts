export type RequestRecord = { id: string; method: string; path: string; status?: number; duration: number; request?: unknown; response?: unknown; error?: unknown; createdAt: string }

export type RequestListener = (record: RequestRecord) => void
let listener: RequestListener | undefined
export const subscribeToRequests = (next: RequestListener) => { listener = next; return () => { listener = undefined } }

export async function apiRequest<T>(path: string, options: RequestInit & { query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const url = new URL(`${baseUrl}/${path.replace(/^\//, '')}`)
  Object.entries(options.query || {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, String(value)))
  const started = performance.now()
  const method = options.method || 'GET'
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : undefined
  let response: Response | undefined
  let parsed: unknown
  try {
    response = await fetch(url, { ...options, credentials: 'include', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
    const text = await response.text()
    try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
    const record: RequestRecord = { id: crypto.randomUUID(), method, path: `${url.pathname}${url.search}`, status: response.status, duration: Math.round(performance.now() - started), request: body, response: parsed, createdAt: new Date().toISOString() }
    listener?.(record)
    if (!response.ok) throw Object.assign(new Error(typeof parsed === 'object' && parsed && 'message' in parsed ? String(parsed.message) : `Request failed — ${response.status}`), { status: response.status, payload: parsed })
    return parsed as T
  } catch (error) {
    if (!response) listener?.({ id: crypto.randomUUID(), method, path: `${url.pathname}${url.search}`, duration: Math.round(performance.now() - started), request: body, error: error instanceof Error ? error.message : error, createdAt: new Date().toISOString() })
    throw error
  }
}

export const endpoints = {
  me: () => apiRequest('/users/me'),
  balances: (query = {}) => apiRequest('/users/me/balances', { query }),
  notifications: (query = {}) => apiRequest('/users/me/notifications', { query }),
  withdrawals: (query = {}) => apiRequest('/withdrawals', { query }),
  deposits: (query = {}) => apiRequest('/deposits', { query }),
  tickets: (query = {}) => apiRequest('/tickets', { query }),
  adminStats: () => apiRequest('/admin/users/statistics'),
  adminUsers: (query = {}) => apiRequest('/admin/users', { query }),
  adminWithdrawals: (query = {}) => apiRequest('/admin/withdrawals', { query }),
  adminDeposits: (query = {}) => apiRequest('/admin/deposits', { query }),
  ledgers: (query = {}) => apiRequest('/admin/ledgers', { query }),
  auditLogs: (query = {}) => apiRequest('/admin/users/audit-logs', { query }),
  adminNotifications: (query = {}) => apiRequest('/admin/notifications', { query }),
}
export const writeApi = (path: string, method: string, body?: unknown, headers?: HeadersInit) => apiRequest(path, { method, body: body === undefined ? undefined : JSON.stringify(body), headers })

export function getApiBaseUrl() { return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000' }
