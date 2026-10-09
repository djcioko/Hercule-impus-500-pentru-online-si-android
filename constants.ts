import { YoutubeSong } from './types';

export const YOUTUBE_DB: YoutubeSong[] = [
  { vibe: "Energetic Dance", name: "Bastard! - Bailalo", id: "v2H4l9RpkwM" },
  { vibe: "Romanian Party", name: "Bogdan DLP - Hitana", id: "kJQP7kiw5Fk" },
  { vibe: "Hip-Hop Vibe", name: "B.U.G. Mafia - Pantelimon", id: "67_9fXU6z_o" },
  { vibe: "Relaxing Chill", name: "Lofi Girl - chill beats to study/relax to", id: "jfKfPfyDnLM" },
  { vibe: "Upbeat Pop", name: "Dua Lipa - Don't Start Now", id: "kjuI1m_D6mE" },
  { vibe: "Smooth Jazz", name: "Kenny G - Songbird", id: "Z3lQeC35E6k" },
  { vibe: "Electronic Groove", name: "Daft Punk - Around the World", id: "s9_m6-5qj4g" },
  { vibe: "Classical Serene", name: "Ludovico Einaudi - Nuvole Bianche", id: "k-w8xU4w2lQ" },
];

export const DEFAULT_YOUTUBE_ID = YOUTUBE_DB[0].id;
export const LOCAL_STORAGE_HISTORY_KEY = 'hercule_ai_history';
