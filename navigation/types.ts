import type { Trip } from '../src/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: { title?: string };
  ResetPassword: { title?: string };
};

export type TripsStackParamList = {
  TripDashboard: undefined;
  TripDetail: { tripId: string; title?: string };
  TripSearch: undefined;
  TripBrief: { trip: Trip };
  TripInvitation: { trip?: Trip; type?: 'driver' | 'passenger'; inviterName?: string; groupName?: string; title?: string };
  AddPassengerGroup: undefined;
  DriverProfile: undefined;
  PassengerGroupDetail: undefined;
  PassengerGroupBrief: undefined;
  ShareTrip: undefined;
  AddMemberSelection: undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  FriendInvites: undefined;
  PeopleSearch: undefined;
  PeopleSearchResults: { query: string };
  MemberProfile: { memberId: string; source: string };
};

export type AddStackParamList = {
  CreateTrip: undefined;
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
