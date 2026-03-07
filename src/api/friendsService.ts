import api from './apiClient';

export interface FriendItem {
  userArn: string;
  name: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
}

export interface ListFriendsResponse {
  friends: FriendItem[];
}

export interface FriendsProfileResponse {
  userArn: string;
  name: string;
}

export const listFriends = async (params?: { limit?: number }): Promise<ListFriendsResponse> => {
  const limit = params?.limit ?? 100;
  return api.get<ListFriendsResponse>(`/api/friends?limit=${limit}`);
};

export const addFriend = async (friendUserArn: string): Promise<void> => {
  await api.post('/api/friends', { friendUserArn });
};

/** Withdraw a sent friend invitation (cancel pending request). */
export const withdrawFriendInvitation = async (friendUserArn: string): Promise<void> => {
  await api.delete(`/api/friends/invitations/${encodeURIComponent(friendUserArn)}`);
};

export const removeFriend = async (friendUserArn: string): Promise<void> => {
  await api.delete(`/api/friends/${encodeURIComponent(friendUserArn)}`);
};

export const getFriendsProfile = async (): Promise<FriendsProfileResponse> => {
  return api.get<FriendsProfileResponse>('/api/friends/profile');
};
