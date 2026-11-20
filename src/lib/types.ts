export type Profile = {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  interests: string[];
  photoUrl: string;
};
export type Match = { id: string; matchedAt: string; profile: Profile };
export type Direction = 'like' | 'pass';
