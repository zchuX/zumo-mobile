import type { TripMetadata, UserTripListItem } from '../api/tripService';
import type { Trip, TripStatus, Participant } from '../types';

export function mapUserTripListItemToFrontend(ut: UserTripListItem): Trip {
  const startTime = ut.startTime && ut.startTime > 0 ? new Date(ut.startTime) : null;
  const dateStr = startTime ? startTime.toISOString().split('T')[0] : 'TBD';
  const timeStr = startTime
    ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'TBD';

  let status = TripStatus.MATCHING;
  if (ut.status === 'InProgress') status = TripStatus.IN_PROGRESS;
  else if (ut.status === 'Completed') status = TripStatus.COMPLETED;
  else if (ut.status === 'Upcoming') status = TripStatus.CONFIRMED;
  else if (ut.status === 'Cancelled') status = TripStatus.PENDING;

  const participants: Participant[] = [];
  if (ut.isDriver) {
    participants.push({
      user: { userArn: 'me', id: 'me', name: 'Me', avatar: '', email: '' },
      confirmed: true,
      isDriver: true,
    });
  } else {
    participants.push({
      user: { userArn: 'driver', id: 'driver', name: 'Driver', avatar: '', email: '' },
      confirmed: ut.driverConfirmed,
      isDriver: true,
    });
  }

  return {
    id: ut.tripArn,
    origin: ut.start,
    destination: ut.destination,
    date: dateStr,
    timeRange: `${timeStr} - TBD`,
    status,
    participants,
    maxCapacity: 4,
    createdBy: ut.isDriver ? 'me' : 'unknown',
    notes: undefined,
    userTripStatus: ut.userTripStatus,
    userGroupArn: ut.userTripArn,
    locations: [],
    userGroups: [],
    startTime: ut.startTime,
    isDriver: ut.isDriver,
  };
}

export function mapBackendTripToFrontend(
  bt: TripMetadata,
  userTripStatus?: string | null,
  userGroupArn?: string | null,
  currentUserId?: string | null
): Trip {
  const startTime = bt.startTime && bt.startTime > 0 ? new Date(bt.startTime) : null;
  const dateStr = startTime ? startTime.toISOString().split('T')[0] : 'TBD';
  const timeStr = startTime
    ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'TBD';

  const origin = bt.locations?.[0]?.locationName ?? 'Unknown Origin';
  const destination = bt.locations?.[bt.locations.length - 1]?.locationName ?? 'Unknown Destination';

  const participants: Participant[] = (bt.users ?? []).map((u) => {
    const userId = u.userId ?? 'unknown';
    const cleanUserId = userId.replace('user:', '');
    const cleanDriverId = (bt.driver ?? '').replace('user:', '');
    return {
      user: {
        userArn: userId,
        id: userId,
        name: u.name,
        avatar: u.imageUrl ?? 'https://picsum.photos/seed/default/200',
        email: '',
      },
      confirmed: true,
      isDriver: cleanUserId === cleanDriverId && cleanDriverId !== '',
    };
  });

  const cleanDriverId = (bt.driver ?? '').replace('user:', '');
  if (
    bt.driver &&
    !participants.find((p) => p.user.userArn.replace('user:', '') === cleanDriverId)
  ) {
    participants.push({
      user: {
        userArn: bt.driver,
        id: bt.driver,
        name: bt.driverName ?? 'Driver',
        avatar: bt.driverPhotoUrl ?? 'https://picsum.photos/seed/driver/200',
        email: '',
      },
      confirmed: bt.driverConfirmed ?? false,
      isDriver: true,
    });
  }

  let status = TripStatus.MATCHING;
  if (bt.status === 'InProgress') status = TripStatus.IN_PROGRESS;
  else if (bt.status === 'Completed') status = TripStatus.COMPLETED;
  else if (bt.status === 'Upcoming') status = TripStatus.CONFIRMED;
  else if (bt.status === 'Cancelled') status = TripStatus.PENDING;

  return {
    id: bt.tripArn,
    origin,
    destination,
    date: dateStr,
    timeRange: `${timeStr} - TBD`,
    status,
    participants,
    maxCapacity: 4,
    vehicle: bt.car
      ? {
          id: 'v1',
          brand: bt.car.model ?? 'Unknown',
          model: '',
          color: bt.car.color ?? '',
          licensePlate: bt.car.plateNumber ?? '',
          state: '',
          image: 'https://picsum.photos/seed/car/200',
        }
      : undefined,
    createdBy: bt.driver ?? 'unknown',
    notes: bt.notes ?? undefined,
    userTripStatus: userTripStatus ?? undefined,
    userGroupArn: userGroupArn ?? undefined,
    locations: bt.locations ?? [],
    userGroups: (bt.usergroups ?? []).map((g) => ({
      groupId: g.groupId,
      groupName: g.groupName,
      groupSize: g.groupSize,
      imageUrl: g.imageUrl ?? undefined,
    })),
    startTime: bt.startTime,
    isDriver:
      bt.driver === currentUserId ||
      (bt.driver ?? '').replace('user:', '').toLowerCase() ===
        (currentUserId ?? '').replace('user:', '').toLowerCase(),
  };
}
