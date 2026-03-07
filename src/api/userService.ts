import api from './apiClient';

export type UserSearchType = 'email' | 'phone' | 'name';

export interface UserSearchResult {
  userArn: string;
  name: string;
  photoUrl: string | null;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
}

export interface UserProfile {
  userArn: string;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  totalPassengerDelivered?: number;
  totalCarpoolJoined?: number;
  tripsCompletedAsDriver?: number;
  tripsCompletedAsPassenger?: number;
  registeredAt?: number;
}

export interface GetUserProfileResponse {
  status: string;
  user: UserProfile;
}

/**
 * Search users by email, phone, or name.
 * GET /api/users/search?type=email|phone|name&q=...&limit= (limit only for type=name)
 */
export const searchUsers = async (params: {
  type: UserSearchType;
  q: string;
  limit?: number;
}): Promise<UserSearchResponse> => {
  const { type, q, limit } = params;
  const searchParams = new URLSearchParams({ type, q });
  if (type === 'name' && limit != null) {
    searchParams.set('limit', String(limit));
  }
  return api.get<UserSearchResponse>(`/api/users/search?${searchParams.toString()}`);
};

/** Simple email format: contains @ and no spaces */
function isEmailFormat(q: string): boolean {
  const t = q.trim();
  return t.includes('@') && !/\s/.test(t) && t.length > 3;
}

/**
 * Phone format: +1 + 10 digits, or 1 + 10 digits, or exactly 10 digits.
 * Returns normalized E.164 (+1XXXXXXXXXX) or null if not phone format.
 */
function normalizePhone(q: string): string | null {
  const digits = q.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+1${digits.slice(1)}`;
  return null;
}

function isPhoneFormat(q: string): boolean {
  const digits = q.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/**
 * Search by input format: email → email + name search merged; phone → phone (normalized) + name search merged; else name only.
 * Results deduplicated by userArn (first occurrence wins).
 */
export const searchUsersByQuery = async (query: string): Promise<UserSearchResponse> => {
  const q = query.trim();
  if (!q) return { users: [] };

  const merge = (a: UserSearchResult[], b: UserSearchResult[]): UserSearchResult[] => {
    const seen = new Set(a.map((u) => u.userArn));
    const out = [...a];
    for (const u of b) {
      if (!seen.has(u.userArn)) {
        seen.add(u.userArn);
        out.push(u);
      }
    }
    return out;
  };

  if (isEmailFormat(q)) {
    const [emailRes, nameRes] = await Promise.all([
      searchUsers({ type: 'email', q }),
      searchUsers({ type: 'name', q, limit: 50 }),
    ]);
    return { users: merge(emailRes.users, nameRes.users) };
  }

  const normalizedPhone = normalizePhone(q);
  if (normalizedPhone !== null) {
    const [phoneRes, nameRes] = await Promise.all([
      searchUsers({ type: 'phone', q: normalizedPhone }),
      searchUsers({ type: 'name', q, limit: 50 }),
    ]);
    return { users: merge(phoneRes.users, nameRes.users) };
  }

  return searchUsers({ type: 'name', q, limit: 50 });
};

/**
 * Get user profile by ARN. Full details (email, phone_number) only if caller is self or friend.
 * GET /api/users/{userArn}
 * Response: { status: "ok", user: UserProfile }
 */
export const getUserProfile = async (userArn: string): Promise<UserProfile> => {
  const encoded = encodeURIComponent(userArn);
  const res = await api.get<GetUserProfileResponse | UserProfile>(`/api/users/${encoded}`);
  return 'user' in res && res.user != null ? res.user : (res as UserProfile);
};
