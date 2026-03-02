import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../data/trips/keys';
import tripService, {
  type TripMetadata,
  type UserTripListItem,
  type CreateTripParams,
  type UpdateTripMetadataParams,
  type ArriveLocationParams,
  type CreateUserGroupParams,
  type UpdateUserGroupParams,
} from '../api/tripService';
import type { Trip, Participant } from '../types';
import { TripStatus } from '../types';
import { useApp } from '../AppContext';
import { mapUserTripListItemToFrontend, mapBackendTripToFrontend } from '../utils/tripMappers';

export function useUncompletedTrips() {
  return useQuery({
    queryKey: tripKeys.list('uncompleted'),
    queryFn: async () => {
      const response = await tripService.listTrips({ completed: false });
      return response.trips.map(mapUserTripListItemToFrontend);
    },
    staleTime: 15 * 1000,
  });
}

export function useCompletedTrips() {
  return useQuery({
    queryKey: tripKeys.list('completed'),
    queryFn: async () => {
      const response = await tripService.listTrips({ completed: true });
      return response.trips.map(mapUserTripListItemToFrontend);
    },
    staleTime: 2 * 60 * 60 * 1000,
  });
}

export function useTrip(tripArn: string | null) {
  const { user } = useApp();
  const currentUserId = user?.userArn ?? user?.id ?? null;

  return useQuery({
    queryKey: tripKeys.detail(tripArn ?? ''),
    queryFn: async () => {
      if (!tripArn) return null;
      const response = await tripService.getTripDetails(tripArn);
      return mapBackendTripToFrontend(
        response.trip,
        response.status.userTripStatus ?? null,
        (response.status as { userStatusKey?: string | null }).userStatusKey ?? null,
        currentUserId
      );
    },
    enabled: !!tripArn,
    staleTime: 15 * 1000,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { user } = useApp();
  const currentUserId = user?.userArn ?? user?.id ?? null;

  return useMutation({
    mutationFn: (params: CreateTripParams) => tripService.createTrip(params),
    onSuccess: (newTrip: TripMetadata) => {
      queryClient.setQueryData(
        tripKeys.detail(newTrip.tripArn),
        mapBackendTripToFrontend(newTrip, null, null, currentUserId)
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  const { user } = useApp();
  const currentUserId = user?.userArn ?? user?.id ?? null;

  return useMutation({
    mutationFn: ({ tripArn, params }: { tripArn: string; params: UpdateTripMetadataParams }) =>
      tripService.updateTripMetadata(tripArn, params),
    onSuccess: (updatedTrip: TripMetadata) => {
      queryClient.setQueryData(
        tripKeys.detail(updatedTrip.tripArn),
        mapBackendTripToFrontend(updatedTrip, null, null, currentUserId)
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  const { user } = useApp();
  const currentUserId = user?.userArn ?? user?.id ?? null;

  return useMutation({
    mutationFn: (tripArn: string) => tripService.startTrip(tripArn),
    onSuccess: (updatedTrip: TripMetadata) => {
      queryClient.setQueryData(
        tripKeys.detail(updatedTrip.tripArn),
        mapBackendTripToFrontend(updatedTrip, null, null, currentUserId)
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useUpdateTripMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripArn, params }: { tripArn: string; params: UpdateTripMetadataParams }) =>
      tripService.updateTripMetadata(tripArn, params),
    onSuccess: (updatedTrip: TripMetadata, _variables, _context) => {
      queryClient.setQueryData(tripKeys.detail(updatedTrip.tripArn), (old: Trip | undefined) => {
        if (!old) return undefined;
        return mapBackendTripToFrontend(
          updatedTrip,
          old.userTripStatus ?? null,
          old.userGroupArn ?? null
        );
      });
    },
  });
}

export function useLeaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripArn: string) => tripService.leaveTrip(tripArn),
    onSuccess: (_, tripArn) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripArn) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useBecomeDriver() {
  const queryClient = useQueryClient();
  const { user } = useApp();
  const currentUserId = user?.userArn ?? user?.id ?? null;

  return useMutation({
    mutationFn: (tripArn: string) => tripService.becomeDriver(tripArn),
    onSuccess: (updatedTrip: TripMetadata) => {
      queryClient.setQueryData(
        tripKeys.detail(updatedTrip.tripArn),
        mapBackendTripToFrontend(updatedTrip, null, null, currentUserId)
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useMarkArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripArn,
      locationName,
      params,
    }: {
      tripArn: string;
      locationName: string;
      params: ArriveLocationParams;
    }) => tripService.arriveLocation(tripArn, locationName, params),
    onSuccess: (updatedTrip: TripMetadata) => {
      queryClient.setQueryData(
        tripKeys.detail(updatedTrip.tripArn),
        mapBackendTripToFrontend(updatedTrip)
      );
    },
  });
}

export function useCreateUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateUserGroupParams) => tripService.createUserGroup(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.tripArn) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useUpdateUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupArn, params }: { groupArn: string; params: UpdateUserGroupParams }) =>
      tripService.updateUserGroup(groupArn, params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.tripArn) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useJoinUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupArn: string) => tripService.joinUserGroup(groupArn),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.tripArn) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupArn: string) => tripService.acceptInvitation(groupArn),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.tripArn) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}

export function useUserGroup(groupArn: string | null) {
  return useQuery({
    queryKey: ['userGroup', groupArn],
    queryFn: () => (groupArn ? tripService.getUserGroup(groupArn) : null),
    enabled: !!groupArn,
  });
}
