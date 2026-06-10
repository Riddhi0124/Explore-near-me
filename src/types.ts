export interface UserSession {
  email: string;
  name: string;
  avatar: string;
  isGuest: boolean;
  createdAt: string;
}

export enum AppTab {
  MAP = 'map',
  LIST = 'list',
  SAVED = 'saved'
}

export interface PlaceCategory {
  id: string;
  label: string;
  icon: any;
  type: string[];
}
