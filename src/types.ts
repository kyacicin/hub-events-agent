// Shared types for the HubVibe Portal front end.
// UI models are adapted from the parsed-data schemas in src/lib/schemas.ts.

/** Region key from src/lib/hubAccounts.ts, e.g. "zhambyl", "pavlodar". */
export type HubRegion = string;

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type UiEventFormat = 'ONLINE' | 'OFFLINE' | 'HYBRID';

/** Card model the glassmorphic UI consumes, adapted from a parsed HubEvent. */
export interface UiEvent {
  id: string;
  title: string;
  description: string;
  /** ISO date, e.g. "2026-06-14" */
  date: string;
  /** Display date, e.g. "сб, 14 июня" */
  day: string;
  /** Weekday key used to anchor the event on the Smart Schedule grid */
  weekday: Weekday;
  /** "HH:MM" or empty string when the post had no time */
  time: string;
  hub: HubRegion;
  hubName: string;
  cityName: string;
  format: UiEventFormat;
  imageUrl: string;
  /** Link to the source Instagram post */
  instagramUrl: string;
  locationName: string;
  parsedAt?: string;
}

/** Directory entry adapted from a parsed HubStaff record. */
export interface UiMember {
  id: string;
  name: string;
  role: string;
  hub: HubRegion;
  hubName: string;
  cityName: string;
  bio: string;
  telegram: string | null;
  instagram: string | null;
  contact: string | null;
  avatarUrl: string;
  focus: string[];
}

export interface TimeSlot {
  day: Weekday;
  time: string;
  available: boolean;
  event?: UiEvent;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  carouselEvents?: UiEvent[];
  teamMembers?: UiMember[];
  showMapForEventId?: string;
  modelStatus?: 'ok' | 'fallback';
}

export interface HubLocation {
  name: string;
  cityName: string;
  instagram: string;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  addressPrecision: 'exact' | 'city';
}

/** Selectable hub for header pills, chat dropdown and schedule switcher. */
export interface HubOption {
  region: HubRegion;
  label: string;
  cityName: string;
}

export type MobileTab = 'content' | 'chat' | 'map';
