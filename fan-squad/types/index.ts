// Club interface
export interface Club {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  crestUrl: string;
  playerImageUrl: string;
}

// NewsItem interface — bullets is a 3-element tuple
export interface NewsItem {
  id: string;
  title: string;
  bullets: [string, string, string];
  aiTag: string;
}

// PropQuestion type alias
export type PropQuestion = string;

// User interface
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

// Player interface — NO stats or OVR fields
export interface Player {
  id: string;
  name: string;
  clubCrestUrl: string;
  imageUrl: string;
}

// MatchEvent interface
export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'var';
  description: string;
  teamId: string;
}

// Theme interface
export interface Theme {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  cardBackground: string;
  border: string;
}

// AppState interface for Zustand store
export interface AppState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  selectedClub: Club | null;
  propLockerLocked: boolean;
  lobbyPoints: number;

  // Actions
  login: () => void;
  logout: () => void;
  setClub: (club: Club | null) => void;
  lockProps: () => void;
  addPoints: (pts: number) => void;
}
