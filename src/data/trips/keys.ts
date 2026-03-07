export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (status: string) => [...tripKeys.lists(), status] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (tripArn: string) => [...tripKeys.details(), tripArn] as const,
  users: (tripArn: string) => [...tripKeys.detail(tripArn), 'users'] as const,
};
