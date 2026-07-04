/**
 * ID + slug helpers. IDs are prefixed so log lines and DB rows are
 * self-describing (e.g. "prj_01j9...", "idea_01j9...").
 */

const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'; // Crockford base32, lowercase

function randomPart(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Sortable-ish unique id: prefix + ms timestamp (base32) + random tail. */
export function createId(prefix: string): string {
  const time = Date.now().toString(32);
  return `${prefix}_${time}${randomPart(10)}`;
}

/** Filesystem- and URL-safe slug from a display name. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'game';
}

export function nowIso(): string {
  return new Date().toISOString();
}
