import React, { createContext, useContext, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../src/constants';
import type { User, Language, Trip } from '../src/types';

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
}

const initialInvitation = null as AppStateContextValue['invitationDetails'];

const AppStateContext = createContext<AppStateContextValue | null>(null);

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
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useApp must be used within AppStateProvider');
  return ctx;
}
