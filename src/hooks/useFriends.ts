import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFriends, addFriend, withdrawFriendInvitation, removeFriend, getFriendsProfile } from '../api/friendsService';

export const friendKeys = {
  all: ['friends'] as const,
  list: (limit?: number) => [...friendKeys.all, 'list', limit ?? 100] as const,
  profile: () => [...friendKeys.all, 'profile'] as const,
};

export function useFriends(limit?: number) {
  return useQuery({
    queryKey: friendKeys.list(limit),
    queryFn: () => listFriends({ limit: limit ?? 100 }),
    staleTime: 30 * 1000,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendUserArn: string) => addFriend(friendUserArn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useWithdrawFriendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendUserArn: string) => withdrawFriendInvitation(friendUserArn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendUserArn: string) => removeFriend(friendUserArn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useFriendsProfile() {
  return useQuery({
    queryKey: friendKeys.profile(),
    queryFn: getFriendsProfile,
    staleTime: 60 * 1000,
  });
}
