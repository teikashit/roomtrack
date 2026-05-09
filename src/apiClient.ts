const BASE_URL = "https://roomtrack-backend.onrender.com";

// ── Token management ──────────────────────────────────────────────────────────
let _token: string | null = localStorage.getItem("jwt_token");

export function setToken(token: string) {
  _token = token;
  localStorage.setItem("jwt_token", token);
}

export function getToken(): string | null {
  return _token;
}

export function clearToken() {
  _token = null;
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("rt_user");
}

// ── Base fetch helper ─────────────────────────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Some endpoints return 204 No Content
  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204 || !contentType.includes("application/json")) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      role: string;
      phone?: string;
    };
  };
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  photo_url: string | null;
}

export interface Room {
  id: string;
  unit_name: string;
  monthly_rate: number;
  status: string;
  floor: string;
  size: string;
  description: string;
  tenant_id: string | null;
  tenant_name: string | null;
  photo_url: string | null;
}

export interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  room_id: string;
  amount: number;
  status: string;
  due_date: string;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  landlord_id: string;
  landlord_name: string;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("POST", "/auth/login", { email, password });
  },

  register(
    email: string,
    password: string,
    full_name: string,
    phone: string,
    role: string
  ) {
    return request<AuthResponse>("POST", "/auth/register", {
      email,
      password,
      data: { full_name, phone, role },
    });
  },

  // ── Profiles ────────────────────────────────────────────────────────────────
  getProfile(id: string) {
    return request<Profile>("GET", `/profiles/${id}`);
  },

  getTenants() {
    return request<Profile[]>("GET", "/profiles/tenants");
  },

  upsertProfile(profile: Partial<Profile> & { id: string }) {
    return request<Profile>("POST", "/profiles", profile);
  },

  updatePassword(new_password: string) {
    return request<void>("PUT", "/profiles/password", { new_password });
  },

  // ── Rooms ────────────────────────────────────────────────────────────────────
  getRooms() {
    return request<Room[]>("GET", "/rooms");
  },

  getRoomByTenantId(tenantId: string) {
    return request<Room[]>("GET", `/rooms/tenant/${tenantId}`);
  },

  createRoom(room: Omit<Room, "id">) {
    return request<Room>("POST", "/rooms", room);
  },

  assignTenant(
    roomId: string,
    tenant_id: string,
    tenant_name: string
  ) {
    return request<Room>("PATCH", `/rooms/${roomId}/assign`, {
      tenant_id,
      tenant_name,
    });
  },

  unassignTenant(roomId: string) {
    return request<Room>("PATCH", `/rooms/${roomId}/unassign`);
  },

  // ── Payments ─────────────────────────────────────────────────────────────────
  getAllPayments() {
    return request<Payment[]>("GET", "/payments");
  },

  getPaymentsByTenant(tenantId: string) {
    return request<Payment[]>("GET", `/payments/tenant/${tenantId}`);
  },

  createPayment(payment: Omit<Payment, "id">) {
    return request<Payment>("POST", "/payments", payment);
  },

  updatePaymentStatus(id: string, status: string) {
    return request<Payment>("PATCH", `/payments/${id}/status`, { status });
  },

  // ── Announcements ─────────────────────────────────────────────────────────
  getAllAnnouncements() {
    return request<Announcement[]>("GET", "/announcements");
  },

  createAnnouncement(data: {
    title: string;
    content: string;
    landlord_id: string;
    landlord_name: string;
  }) {
    return request<Announcement>("POST", "/announcements", data);
  },

  deleteAnnouncement(id: string) {
    return request<void>("DELETE", `/announcements/${id}`);
  },
};
