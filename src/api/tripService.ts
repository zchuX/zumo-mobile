import api from './apiClient';
import { MOCK_TRIPS } from './mockTrips';

export interface Car {
  plateNumber?: string | null;
  color?: string | null;
  model?: string | null;
}

export interface Location {
  locationName: string;
  pickupGroups: string[];
  dropOffGroups: string[];
  arrived: boolean;
  arrivedTime?: number | null;
  plannedTime?: number | null;
}

export interface UserGroupSummary {
  groupId: string;
  groupName: string;
  groupSize: number;
  imageUrl?: string | null;
}

export interface TripUser {
  userId?: string | null;
  name: string;
  imageUrl?: string | null;
}

export interface TripMetadata {
  tripArn: string;
  locations: Location[];
  startTime: number;
  completionTime?: number | null;
  status: string;
  driver?: string | null;
  driverName?: string | null;
  driverPhotoUrl?: string | null;
  driverConfirmed?: boolean | null;
  car?: Car | null;
  usergroups?: UserGroupSummary[] | null;
  users?: TripUser[] | null;
  notes?: string | null;
  version: number;
}

export interface GroupUser {
  userId: string;
  name: string;
  imageUrl?: string | null;
  accept: boolean;
}

export interface UserGroupRecord {
  groupArn: string;
  tripArn: string;
  groupName: string;
  start: string;
  destination: string;
  pickupTime: number;
  version: number;
  numAnonymousUsers: number;
  users: GroupUser[];
}

export interface UserTrip {
  arn: string;
  tripArn: string;
  userStatusKey: string;
  tripDateTime: number;
  tripStatus: string;
  start: string;
  destination: string;
  departureDateTime: number;
  isDriver: boolean;
  driverConfirmed: boolean;
  version: number;
}

export interface UserTripListItem {
  tripArn: string;
  startTime: number;
  status: string;
  start: string;
  destination: string;
  isDriver: boolean;
  driverConfirmed: boolean;
  userTripArn: string;
  userTripStatus: string;
}

export interface GetTripByIdResponse {
  trip: TripMetadata;
  status: {
    userTripStatus?: string | null;
    [key: string]: unknown;
  };
}

export interface ListTripsParams {
  completed: boolean;
}

export interface CreateTripParams {
  startTime: number;
  start?: string | null;
  destination?: string | null;
  driver?: string | null;
  car?: Car | null;
  notes?: string | null;
  groups: UserGroupRecord[];
}

export interface UpdateTripMetadataParams {
  startTime?: number | null;
  notes?: string | null;
  locations?: string[] | null;
  vehicleArn?: string | null;
}

export interface ArriveLocationParams {
  arrived: boolean;
}

export interface CreateUserGroupParams {
  tripArn: string;
  groupName: string;
  start: string;
  destination: string;
  pickupTime: number;
  numAnonymousUsers: number;
  users: GroupUser[];
}

export interface UpdateUserGroupParams {
  groupName?: string | null;
  start?: string | null;
  destination?: string | null;
  pickupTime?: number | null;
  users?: GroupUser[] | null;
  numAnonymousUsers?: number | null;
}

export const listTrips = async (params: ListTripsParams): Promise<{ trips: UserTripListItem[] }> => {
  try {
    const response = await api.get<{ trips: UserTripListItem[] }>('/api/trips', { params });
    const isCompleted = params.completed;
    const filteredMocks = (MOCK_TRIPS as TripMetadata[]).map((t) => ({
      tripArn: t.tripArn,
      startTime: t.startTime,
      status: t.status,
      start: t.locations[0]?.locationName ?? '',
      destination: t.locations[t.locations.length - 1]?.locationName ?? '',
      isDriver: t.driver === 'user_1',
      driverConfirmed: t.driverConfirmed ?? false,
      userTripArn: `mock-utrip-${t.tripArn}`,
      userTripStatus: (t as TripMetadata & { userTripStatus?: string }).userTripStatus ?? '',
    })).filter((t) => (isCompleted ? t.status === 'Completed' : t.status !== 'Completed'));
    return { trips: [...filteredMocks, ...response.trips] };
  } catch (error) {
    const isCompleted = params.completed;
    const filteredMocks = (MOCK_TRIPS as TripMetadata[]).map((t) => ({
      tripArn: t.tripArn,
      startTime: t.startTime,
      status: t.status,
      start: t.locations[0]?.locationName ?? '',
      destination: t.locations[t.locations.length - 1]?.locationName ?? '',
      isDriver: t.driver === 'user_1',
      driverConfirmed: t.driverConfirmed ?? false,
      userTripArn: `mock-utrip-${t.tripArn}`,
      userTripStatus: (t as TripMetadata & { userTripStatus?: string }).userTripStatus ?? '',
    })).filter((t) => (isCompleted ? t.status === 'Completed' : t.status !== 'Completed'));
    return { trips: filteredMocks };
  }
};

export const getTripDetails = async (tripArn: string): Promise<GetTripByIdResponse> => {
  const mockTrip = (MOCK_TRIPS as (TripMetadata & { userTripStatus?: string })[]).find((t) => t.tripArn === tripArn);
  if (mockTrip) {
    return {
      trip: mockTrip,
      status: { userTripStatus: mockTrip.userTripStatus },
    };
  }
  return api.get<GetTripByIdResponse>(`/api/trips/${encodeURIComponent(tripArn)}`);
};

export const createTrip = async (params: CreateTripParams): Promise<TripMetadata> => {
  return api.post<TripMetadata>('/api/trips', params);
};

export const updateTripMetadata = async (tripArn: string, params: UpdateTripMetadataParams): Promise<TripMetadata> => {
  return api.put<TripMetadata>(`/api/trips/${encodeURIComponent(tripArn)}`, params);
};

export const startTrip = async (tripArn: string): Promise<TripMetadata> => {
  return api.post<TripMetadata>(`/api/trips/${encodeURIComponent(tripArn)}/start`);
};

export const arriveLocation = async (
  tripArn: string,
  locationName: string,
  params: ArriveLocationParams
): Promise<TripMetadata> => {
  return api.post<TripMetadata>(
    `/api/trips/${encodeURIComponent(tripArn)}/locations/${encodeURIComponent(locationName)}/arrival`,
    params
  );
};

export const leaveTrip = async (tripArn: string): Promise<{ message?: string }> => {
  return api.post<{ message?: string }>(`/api/trips/${encodeURIComponent(tripArn)}/leave`);
};

export const becomeDriver = async (tripArn: string): Promise<TripMetadata> => {
  return api.post<TripMetadata>(`/api/trips/${encodeURIComponent(tripArn)}/driver`);
};

export const listTripUsers = async (tripArn: string): Promise<{ users: UserTrip[] }> => {
  return api.get<{ users: UserTrip[] }>(`/api/trips/${encodeURIComponent(tripArn)}/users`);
};

export const createUserGroup = async (params: CreateUserGroupParams): Promise<UserGroupRecord> => {
  return api.post<UserGroupRecord>('/api/user-groups', params);
};

export const updateUserGroup = async (groupArn: string, params: UpdateUserGroupParams): Promise<UserGroupRecord> => {
  return api.put<UserGroupRecord>(`/api/user-groups/${encodeURIComponent(groupArn)}`, params);
};

export const joinUserGroup = async (groupArn: string): Promise<UserGroupRecord> => {
  return api.post<UserGroupRecord>(`/api/user-groups/${encodeURIComponent(groupArn)}/join`);
};

export const acceptInvitation = async (groupArn: string): Promise<UserGroupRecord> => {
  return api.post<UserGroupRecord>(`/api/user-groups/${encodeURIComponent(groupArn)}/accept`);
};

export const getUserGroup = async (groupArn: string): Promise<UserGroupRecord> => {
  return api.get<UserGroupRecord>(`/api/user-groups/${encodeURIComponent(groupArn)}`);
};

export default {
  listTrips,
  getTripDetails,
  createTrip,
  updateTripMetadata,
  startTrip,
  arriveLocation,
  leaveTrip,
  becomeDriver,
  listTripUsers,
  createUserGroup,
  updateUserGroup,
  joinUserGroup,
  acceptInvitation,
  getUserGroup,
};
