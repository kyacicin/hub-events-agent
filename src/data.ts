// Demo data layer for the HubVibe Portal front end.
// Event seeds mirror the shape of data/events.json (Instagram-parsed hub announcements)
// remapped into the richer card model the glassmorphic UI consumes.

import { HubCity, HubEvent, HubLocation, TeamMember, TimeSlot, Weekday } from './types';

export const HUB_LOCATIONS: Record<HubCity, HubLocation> = {
  Astana: {
    name: 'Astana Hub (HQ)',
    fullAddress: 'Mangilik El Ave 55/8, EXPO C1, Astana',
  },
  Zhambyl: {
    name: 'Zhambyl IT Hub',
    fullAddress: 'Tole Bi Ave 35, Taraz, Zhambyl Region',
  },
  Pavlodar: {
    name: 'Pavlodar IT Hub',
    fullAddress: 'General Dyusenov St 80, 2nd floor, Pavlodar',
  },
  Taraz: {
    name: 'Taraz Innovation Hub',
    fullAddress: 'Tole Bi St 58, Hall 201, Taraz',
  },
  Kyzylorda: {
    name: 'Kyzylorda IT Hub',
    fullAddress: 'Aiteke Bi St 25, Kyzylorda',
  },
};

export const EVENTS: HubEvent[] = [
  {
    id: 'evt_zhambyl_bootcamp',
    title: 'AI Bootcamp: AI Tools for Developers',
    description:
      '15-day bootcamp covering AI tooling, no-code launches, dev environments, fullstack builders and agentic AI. Finale: Demo Day with project defenses.',
    day: 'Wed, Jun 10',
    weekday: 'Wed',
    time: '14:00',
    hub: 'Zhambyl',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/p/DZKjZBPBMAv/',
    locationName: 'Zhambyl Hub, Tole Bi Ave 35, Taraz',
  },
  {
    id: 'evt_zhambyl_demo_day',
    title: 'Demo Day: Pre-Incubation Cohort',
    description:
      'Final pitch presentations from the first pre-incubation cohort. Investors, mentors and the regional startup community in one hall.',
    day: 'Sat, Jun 14',
    weekday: 'Sat',
    time: '14:00',
    hub: 'Zhambyl',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/zhambyl_hub/',
    locationName: 'Zhambyl Hub, Tole Bi Ave 35, Taraz',
  },
  {
    id: 'evt_pavlodar_higgsfield',
    title: 'From Uber to Higgsfield: Building a World-Class AI Startup at Home',
    description:
      'Open online meetup with Ali Bazilov, Software Engineer at Higgsfield AI, on Big Tech, startup culture and opportunities in the AI industry.',
    day: 'Thu, Jun 11',
    weekday: 'Thu',
    time: '17:00',
    hub: 'Pavlodar',
    format: 'ONLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/p/DZCumH8oYE5/',
    locationName: 'Zoom — link in @pavlodar.hub bio',
  },
  {
    id: 'evt_pavlodar_business',
    title: 'BUSINESS UPGRADE',
    description:
      'Hands-on session for founders: safe handling of personal transfers, tax risk, and separating personal vs business finances.',
    day: 'Thu, Jun 11',
    weekday: 'Thu',
    time: '18:00',
    hub: 'Pavlodar',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/p/DZUwILaoa2R/',
    locationName: 'Pavlodar Hub, General Dyusenov St 80, 2nd floor',
  },
  {
    id: 'evt_astana_accelerator',
    title: 'Astana Innovations Accelerator 2026',
    description:
      'Applications open for IT projects ready to deploy solutions into Astana city infrastructure. Submission deadline: June 15, 2026.',
    day: 'Mon, Jun 15',
    weekday: 'Mon',
    time: '11:00',
    hub: 'Astana',
    format: 'ONLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/p/DZFC2mrCBNn/',
    locationName: 'Online — apply via astanahub.com',
  },
  {
    id: 'evt_astana_founders_night',
    title: 'Founders Night: EXPO Networking',
    description:
      'Evening networking mixer at the EXPO C1 campus. Founders, investors and hub residents — badge pickup from 18:30.',
    day: 'Fri, Jun 19',
    weekday: 'Fri',
    time: '19:00',
    hub: 'Astana',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/astana.hub/',
    locationName: 'Astana Hub HQ, Mangilik El Ave 55/8',
  },
  {
    id: 'evt_taraz_cursor',
    title: 'Cursor AI Workshop',
    description:
      'Practical workshop on working with Cursor AI for developers: agent workflows, repo-scale edits and prompt patterns.',
    day: 'Sat, Jun 20',
    weekday: 'Sat',
    time: '11:00',
    hub: 'Taraz',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/zhambyl_hub/',
    locationName: 'Taraz Innovation Hub, Tole Bi St 58, Hall 201',
  },
  {
    id: 'evt_taraz_hackathon',
    title: 'Taraz Open Hackathon: Smart City Track',
    description:
      '24-hour hackathon on city-data APIs. Teams of 2-5, mentors on site, 1M KZT prize pool from regional partners.',
    day: 'Sun, Jun 21',
    weekday: 'Sun',
    time: '09:00',
    hub: 'Taraz',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/zhambyl_hub/',
    locationName: 'Taraz Innovation Hub, Tole Bi St 58',
  },
  {
    id: 'evt_kyzylorda_ai101',
    title: 'AI 101: Intro Lecture for Students',
    description:
      'Introductory lecture series on machine learning fundamentals for university students. Registration free, seats limited.',
    day: 'Tue, Jun 16',
    weekday: 'Tue',
    time: '16:00',
    hub: 'Kyzylorda',
    format: 'OFFLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/kyzylordahub/',
    locationName: 'Kyzylorda IT Hub, Aiteke Bi St 25',
  },
  {
    id: 'evt_kyzylorda_online_pitch',
    title: 'Online Pitch Practice with HQ Mentors',
    description:
      'Remote pitch rehearsal session: Astana HQ mentors give live feedback on regional startup decks over video link.',
    day: 'Thu, Jun 18',
    weekday: 'Thu',
    time: '18:00',
    hub: 'Kyzylorda',
    format: 'ONLINE',
    imageUrl:
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=640&q=80&auto=format&fit=crop',
    instagramUrl: 'https://www.instagram.com/kyzylordahub/',
    locationName: 'Zoom — link in @kyzylordahub bio',
  },
];

// Contact directory ("Team Deck"). Roles embed the hub name so the chat parser
// can match members by active city.
export const CHUBS: TeamMember[] = [
  {
    id: 'aziz_seytkali',
    name: 'Aziz Seytkali',
    role: 'Director, Zhambyl Hub',
    hub: 'Zhambyl',
    bio: 'Leads the Zhambyl regional incubator: pre-incubation cohorts, AI bootcamps and the Demo Day pipeline for Taraz-region startups.',
    telegram: '@aziz_hub',
    instagram: '@aziz_hub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=aziz&backgroundColor=10b981',
    focus: ['Incubation', 'Demo Day', 'AI Bootcamp'],
  },
  {
    id: 'maria_zhambyl',
    name: 'Maria Alibekova',
    role: 'Regional Manager, Zhambyl Hub',
    hub: 'Zhambyl',
    bio: 'Coordinates partner programs and event logistics across the Zhambyl region; first point of contact for residents.',
    telegram: '@maria_zhambyl',
    instagram: '@zhambyl_hub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=maria&backgroundColor=3b82f6',
    focus: ['Partnerships', 'Operations'],
  },
  {
    id: 'elena_pavlodar',
    name: 'Elena Nurkenova',
    role: 'Director, Pavlodar Hub',
    hub: 'Pavlodar',
    bio: 'Runs the Pavlodar IT Hub speaker-talk series and founder finance workshops; ex-fintech product lead.',
    telegram: '@elena_pvl',
    instagram: '@pavlodar.hub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=elena&backgroundColor=f59e0b',
    focus: ['Speaker Talks', 'Founder Finance'],
  },
  {
    id: 'daniyar_astana',
    name: 'Daniyar Omarov',
    role: 'Head of Regional Network, Astana Hub HQ',
    hub: 'Astana',
    bio: 'Oversees all regional hub programming from the EXPO C1 headquarters, including the Innovations Accelerator intake.',
    telegram: '@daniyar_hq',
    instagram: '@astana.hub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=daniyar&backgroundColor=8b5cf6',
    focus: ['Accelerator', 'HQ Network', 'Grants'],
  },
  {
    id: 'aigerim_taraz',
    name: 'Aigerim Bekova',
    role: 'Community Lead, Taraz Innovation Hub',
    hub: 'Taraz',
    bio: 'Builds the Taraz developer community: hackathons, Cursor AI workshops and student outreach across local universities.',
    telegram: '@aigerim_trz',
    instagram: '@zhambyl_hub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=aigerim&backgroundColor=ec4899',
    focus: ['Hackathons', 'Workshops', 'Community'],
  },
  {
    id: 'nurlan_kyzylorda',
    name: 'Nurlan Abenov',
    role: 'Director, Kyzylorda Hub',
    hub: 'Kyzylorda',
    bio: 'Heads the Kyzylorda IT Hub education track — AI 101 lectures and remote pitch practice with HQ mentors.',
    telegram: '@nurlan_kzo',
    instagram: '@kyzylordahub',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=nurlan&backgroundColor=14b8a6',
    focus: ['Education', 'Student Programs'],
  },
];

const SCHEDULE_DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SCHEDULE_TIMES = ['09:00', '11:00', '14:00', '16:00', '18:00'];

// Deterministic pseudo-random availability so the grid renders identically on
// server and client (no hydration mismatch).
function slotSeed(city: string, day: string, time: string): number {
  const key = `${city}|${day}|${time}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getSchedule(city: HubCity): TimeSlot[] {
  const cityEvents = EVENTS.filter((e) => e.hub === city);

  return SCHEDULE_DAYS.flatMap((day) =>
    SCHEDULE_TIMES.map((time) => {
      const event = cityEvents.find((e) => e.weekday === day && e.time === time);
      return {
        day,
        time,
        // Roughly a quarter of free slots show as blocked-out rooms.
        available: !!event || slotSeed(city, day, time) % 4 !== 0,
        event,
      };
    }),
  );
}
