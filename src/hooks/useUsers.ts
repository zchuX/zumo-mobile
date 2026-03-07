import { useQuery } from '@tanstack/react-query';
import { searchUsers, searchUsersByQuery, getUserProfile, type UserSearchType } from '../api/userService';

export const userKeys = {
  all: ['users'] as const,
  search: (type: UserSearchType, q: string, limit?: number) =>
    [...userKeys.all, 'search', type, q, limit ?? 50] as const,
  searchByQuery: (q: string) => [...userKeys.all, 'searchByQuery', q] as const,
  profile: (userArn: string) => [...userKeys.all, 'profile', userArn] as const,
};

export function useUserSearch(params: {
  type: UserSearchType;
  q: string;
  limit?: number;
}) {
  const { type, q, limit } = params;
  const enabled = !!type && !!q.trim();
  return useQuery({
    queryKey: userKeys.search(type, q.trim(), limit),
    queryFn: () => searchUsers({ type, q: q.trim(), limit }),
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Search by query string; format (email / phone / name) is inferred and appropriate API calls are made and merged. */
export function useUserSearchByQuery(query: string) {
  const q = query.trim();
  const enabled = q.length > 0;
  return useQuery({
    queryKey: userKeys.searchByQuery(q),
    queryFn: () => searchUsersByQuery(q),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUserProfile(userArn: string | null) {
  return useQuery({
    queryKey: userKeys.profile(userArn ?? ''),
    queryFn: () => getUserProfile(userArn!),
    enabled: !!userArn,
    staleTime: 60 * 1000,
  });
}
