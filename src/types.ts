import type { Location } from './api/tripService';

export type Role = 'driver' | 'passenger';

export enum TripStatus {
  PENDING = 'pending',
  MATCHING = 'matching',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface User {
  userArn: string;
  id?: string;
  name: string;
  email?: string;
  phone_number?: string;
  avatar: string;
  bio?: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  state: string;
  image: string;
}

export interface Participant {
  user: User;
  confirmed: boolean;
  isDriver: boolean;
  extraInfo?: string;
}

export interface UserGroupSummary {
  groupId: string;
  groupName: string;
  groupSize: number;
  imageUrl?: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  date: string;
  timeRange: string;
  status: TripStatus;
  participants: Participant[];
  maxCapacity: number;
  vehicle?: Vehicle;
  createdBy: string;
  notes?: string;
  userTripStatus?: string;
  userGroupArn?: string;
  locations: Location[];
  userGroups: UserGroupSummary[];
  startTime: number;
  isDriver: boolean;
}

export type Language = 'en' | 'zh';

export interface AppState {
  user: User | null;
  lang: Language;
  trips: Trip[];
  vehicles: Vehicle[];
  currentTripId?: string;
}
