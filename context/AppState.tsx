import React, { createContext, useContext, useMemo, useState } from 'react';
import { TRANSLATIONS, MOCK_VEHICLES } from '../src/constants';
import type { User, Language, Trip, Vehicle } from '../src/types';

export interface AppStateContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  lang: Language;
  setLang: (l: Language) => void;
  currentScreen: string;
  setCurrentScreen: (s: string) => void;
  t: Record<string, string>;
  dashboardShowHistory: boolean;
  setDashboardShowHistory: (v: boolean) => void;
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  memberProfileSource: string;
  setMemberProfileSource: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGroupArn: string | null;
  setSelectedGroupArn: (arn: string | null) => void;
  briefTrip: Trip | null;
  setBriefTrip: (t: Trip | null) => void;
  invitationDetails: { type: 'driver' | 'passenger'; inviterName: string; groupName?: string } | null;
  setInvitationDetails: (d: typeof initialInvitation) => void;
  // Same as web App context
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  friendIds: Set<string>;
  setFriendIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  pendingRequestIds: Set<string>;
  setPendingRequestIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  incomingRequestIds: Set<string>;
  setIncomingRequestIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  nicknames: Record<string, string>;
  setNicknames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Draft passenger group for Post Trip (looking for a car). Persisted until Confirm and Generate Trip. */
  draftPassengerGroup: { groupName: string; userIds: string[] } | null;
  setDraftPassengerGroup: React.Dispatch<React.SetStateAction<{ groupName: string; userIds: string[] } | null>>;
}

const initialInvitation = null as AppStateContextValue['invitationDetails'];

const AppStateContext = createContext<AppStateContextValue | null>(null);

const defaultFriendIds = new Set<string>(['user:sarah_j', 'user:alen_w', 'user:jane_c', 'user:kevin_d']);
const defaultPendingRequestIds = new Set<string>(['user:michael_w']);
const defaultIncomingRequestIds = new Set<string>(['user:luna_z', 'driver_alex']);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('zh');
  const [currentScreen, setCurrentScreen] = useState('login');
  const [dashboardShowHistory, setDashboardShowHistory] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [memberProfileSource, setMemberProfileSource] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupArn, setSelectedGroupArn] = useState<string | null>(null);
  const [briefTrip, setBriefTrip] = useState<Trip | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<AppStateContextValue['invitationDetails']>(initialInvitation);
  const [vehicles, setVehicles] = useState<Vehicle[]>((MOCK_VEHICLES as Vehicle[]).slice());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set(defaultFriendIds));
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set(defaultPendingRequestIds));
  const [incomingRequestIds, setIncomingRequestIds] = useState<Set<string>>(new Set(defaultIncomingRequestIds));
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [draftPassengerGroup, setDraftPassengerGroup] = useState<{ groupName: string; userIds: string[] } | null>(null);

  const t = useMemo(() => TRANSLATIONS[lang] ?? TRANSLATIONS.en, [lang]);

  const value: AppStateContextValue = useMemo(
    () => ({
      user,
      setUser,
      lang,
      setLang,
      currentScreen,
      setCurrentScreen,
      t,
      dashboardShowHistory,
      setDashboardShowHistory,
      selectedTripId,
      setSelectedTripId,
      selectedMemberId,
      setSelectedMemberId,
      selectedVehicleId,
      setSelectedVehicleId,
      memberProfileSource,
      setMemberProfileSource,
      searchQuery,
      setSearchQuery,
      selectedGroupArn,
      setSelectedGroupArn,
      briefTrip,
      setBriefTrip,
      invitationDetails,
      setInvitationDetails,
      vehicles,
      setVehicles,
      friendIds,
      setFriendIds,
      pendingRequestIds,
      setPendingRequestIds,
      incomingRequestIds,
      setIncomingRequestIds,
      nicknames,
      setNicknames,
      notes,
      setNotes,
      draftPassengerGroup,
      setDraftPassengerGroup,
    }),
    [
      user,
      lang,
      currentScreen,
      t,
      dashboardShowHistory,
      selectedTripId,
      selectedMemberId,
      selectedVehicleId,
      memberProfileSource,
      searchQuery,
      selectedGroupArn,
      briefTrip,
      invitationDetails,
      vehicles,
      friendIds,
      pendingRequestIds,
      incomingRequestIds,
      nicknames,
      notes,
      draftPassengerGroup,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useApp must be used within AppStateProvider');
  return ctx;
}
