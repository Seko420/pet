import type { IsoDateTime } from './common';

/** Asset & content planning (Asset- und Content-System). */
export type ContentCategory =
  | 'character'
  | 'skin'
  | 'weapon'
  | 'item'
  | 'pet'
  | 'vehicle'
  | 'world'
  | 'level'
  | 'quest'
  | 'enemy'
  | 'boss'
  | 'reward'
  | 'sound'
  | 'music'
  | 'ui_element'
  | 'icon'
  | 'store_image'
  | 'trailer_idea'
  | 'thumbnail'
  | 'screenshot';

export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  character: 'Charakter',
  skin: 'Skin',
  weapon: 'Waffe',
  item: 'Item',
  pet: 'Pet',
  vehicle: 'Fahrzeug',
  world: 'Welt',
  level: 'Level',
  quest: 'Quest',
  enemy: 'Gegner',
  boss: 'Boss',
  reward: 'Belohnung',
  sound: 'Sound',
  music: 'Musik',
  ui_element: 'UI-Element',
  icon: 'Icon',
  store_image: 'Store-Bild',
  trailer_idea: 'Trailer-Idee',
  thumbnail: 'Thumbnail',
  screenshot: 'Screenshot',
};

export type ContentItemStatus = 'planned' | 'in_progress' | 'done';

export interface ContentItem {
  id: string;
  projectId: string;
  category: ContentCategory;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  status: ContentItemStatus;
  /**
   * Originality note - all content must be original work.
   * The UI reminds users: no copyrighted brands, characters, sounds or designs.
   */
  notes: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
