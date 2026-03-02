import { TripMetadata } from './tripService';

const now = Date.now();
const oneDay = 86400000;

export interface MockTripMetadata extends TripMetadata {
  userTripStatus: string;
}

export const MOCK_IN_PROGRESS_TRIP: MockTripMetadata = {
  tripArn: 'arn:aws:coride:trip:in-progress-1',
  startTime: now,
  status: 'InProgress',
  completionTime: null,
  driver: 'user-1',
  driverName: 'John Driver',
  driverPhotoUrl: 'https://picsum.photos/seed/driver1/200',
  driverConfirmed: true,
  notes: 'Heading to the office, picking up near the main gate.',
  car: {
    plateNumber: 'ABC-1234',
    color: 'Silver',
    model: 'Tesla Model 3',
  },
  locations: [
    {
      locationName: 'Residential Complex X',
      pickupGroups: ['group-1'],
      dropOffGroups: [],
      arrived: true,
      arrivedTime: now - 300000,
      plannedTime: now - 600000,
    },
    {
      locationName: 'Office Block A',
      pickupGroups: [],
      dropOffGroups: ['group-1'],
      arrived: false,
      plannedTime: now + 1800000,
    },
  ],
  usergroups: [
    {
      groupId: 'group-1',
      groupName: 'Morning Commute',
      groupSize: 3,
      imageUrl: 'https://picsum.photos/seed/group1/200',
    },
  ],
  users: [
    { userId: 'user-1', name: 'John Driver', imageUrl: 'https://picsum.photos/seed/driver1/200' },
    { userId: 'user-2', name: 'Alice Passenger', imageUrl: 'https://picsum.photos/seed/user2/200' },
  ],
  version: 1,
  userTripStatus: 'Confirmed',
};

export const MOCK_UPCOMING_TRIP: MockTripMetadata = {
  tripArn: 'arn:aws:coride:trip:upcoming-1',
  startTime: now + oneDay,
  status: 'Upcoming',
  completionTime: null,
  driver: 'user-3',
  driverName: 'Bob Driver',
  driverPhotoUrl: 'https://picsum.photos/seed/driver3/200',
  driverConfirmed: true,
  notes: 'Evening return trip.',
  car: {
    plateNumber: 'XYZ-5678',
    color: 'Blue',
    model: 'Toyota Prius',
  },
  locations: [
    {
      locationName: 'Office Block A',
      pickupGroups: ['group-2'],
      dropOffGroups: [],
      arrived: false,
      plannedTime: now + oneDay,
    },
    {
      locationName: 'Residential Complex X',
      pickupGroups: [],
      dropOffGroups: ['group-2'],
      arrived: false,
      plannedTime: now + oneDay + 1800000,
    },
  ],
  usergroups: [
    {
      groupId: 'group-2',
      groupName: 'Evening Return',
      groupSize: 2,
      imageUrl: 'https://picsum.photos/seed/group2/200',
    },
  ],
  users: [
    { userId: 'user-3', name: 'Bob Driver', imageUrl: 'https://picsum.photos/seed/driver3/200' },
    { userId: 'user-4', name: 'Charlie Passenger', imageUrl: 'https://picsum.photos/seed/user4/200' },
  ],
  version: 1,
  userTripStatus: 'Confirmed',
};

export const MOCK_TRIPS: MockTripMetadata[] = [MOCK_IN_PROGRESS_TRIP, MOCK_UPCOMING_TRIP];
