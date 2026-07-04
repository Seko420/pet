/**
 * Tiny markdown building helpers used by the GDD section builders.
 * Kept dependency-free and deliberately simple: sections are plain strings.
 */

/** Escape pipe characters so table cells cannot break the table layout. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/** Build a GitHub-flavoured markdown table. */
export function mdTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const head = `| ${headers.map(cell).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map(cell).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

/** Unordered list. */
export function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

/** Ordered list. */
export function numbered(items: readonly string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/** Join non-empty markdown blocks with blank lines. */
export function blocks(...parts: readonly (string | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).join('\n\n');
}
