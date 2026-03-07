import type { Trip } from '../src/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: { title?: string };
  ResetPassword: { title?: string };
};

export type TripsStackParamList = {
  TripDashboard: undefined;
  TripDetail: { tripId: string; title?: string };
  TripBrief: { trip: Trip };
  TripInvitation: { trip?: Trip; type?: 'driver' | 'passenger'; inviterName?: string; groupName?: string; title?: string };
  AddPassengerGroup: undefined;
  DriverProfile: undefined;
  PassengerGroupDetail: undefined;
  PassengerGroupBrief: undefined;
  ShareTrip: { tripId: string; groupArn: string };
  AddMemberSelection: undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  FriendInvites: undefined;
  PeopleSearch: { initialQuery?: string };
  PeopleSearchResults: { query: string };
  MemberProfile: { memberId: string; source: string; avatarUrl?: string; displayName?: string };
};

export type AddStackParamList = {
  CreateTrip: undefined;
  ConfigureDraftGroup: undefined;
};

export type GarageStackParamList = {
  GarageList: undefined;
  VehicleForm: { mode: 'add' | 'edit'; vehicleId?: string };
};

export type AccountStackParamList = {
  AccountMain: undefined;
  Settings: undefined;
  Support: undefined;
  ManageAccount: undefined;
  ModifyPassword: undefined;
};

export type MainTabParamList = {
  Trips: undefined;
  Friends: undefined;
  Add: undefined;
  Garage: undefined;
  Account: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        TripsStackParamList,
        FriendsStackParamList,
        AddStackParamList,
        GarageStackParamList,
        AccountStackParamList,
        MainTabParamList {}
  }
}
