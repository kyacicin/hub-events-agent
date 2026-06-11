// Shared types for the HubVibe Portal front end (glassmorphic UI demo layer).

export type HubCity = 'Astana' | 'Zhambyl' | 'Pavlodar' | 'Taraz' | 'Kyzylorda';

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface HubEvent {
  id: string;
  title: string;
  description: string;
  /** Display date, e.g. "Sat, Jun 14" */
  day: string;
  /** Weekday key used to anchor the event on the Smart Schedule grid */
  weekday: Weekday;
  time: string;
  hub: HubCity;
  format: 'ONLINE' | 'OFFLINE';
  imageUrl: string;
  instagramUrl: string;
  locationName: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  hub: HubCity;
  bio: string;
  telegram: string;
  instagram: string;
  avatarUrl: string;
  /** Specialization tags shown in the expanded dossier drawer */
  focus: string[];
}

export interface TimeSlot {
  day: Weekday;
  time: string;
  available: boolean;
  event?: HubEvent;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  carouselEvents?: HubEvent[];
  teamMembers?: TeamMember[];
  showMapForEventId?: string;
}

export interface HubLocation {
  name: string;
  fullAddress: string;
}
