import React from 'react';

/**
 * Minimal, safe markdown renderer: escapes ALL HTML first, then renders a
 * small subset (headings, bold/italic/inline code, fenced code blocks,
 * lists, tables, hr, paragraphs). No raw HTML ever reaches
 * dangerouslySetInnerHTML. Shared by the GDD view and the AI chats.
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-ink-950 px-1 text-forge-300">$1</code>');
}

export function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split('\n');
  const html: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let tableBuffer: string[] = [];
  let codeBuffer: string[] | null = null;
  let codeLang = '';

  const closeList = (): void => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };
  const flushTable = (): void => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.filter((row) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(row));
    const cells = (row: string): string[] =>
      row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    let table = '<table class="my-2 w-full text-sm"><tbody>';
    rows.forEach((row, i) => {
      const tag = i === 0 ? 'th' : 'td';
      table += `<tr>${cells(row)
        .map((c) => `<${tag} class="border border-ink-600 px-2 py-1 text-left ${i === 0 ? 'bg-ink-700 font-medium' : ''}">${inline(c)}</${tag}>`)
        .join('')}</tr>`;
    });
    table += '</tbody></table>';
    html.push(table);
    tableBuffer = [];
  };

  for (const line of lines) {
    // Fenced code blocks (```lang … ```): verbatim, monospaced, scrollable.
    const fence = /^\s*```\s*(\S*)\s*$/.exec(line);
    if (fence) {
      if (codeBuffer === null) {
        closeList();
        flushTable();
        codeBuffer = [];
        codeLang = fence[1] ?? '';
      } else {
        const label = codeLang ? `<div class="border-b border-ink-600 px-3 py-1 text-[10px] uppercase tracking-wide text-mist-500">${codeLang}</div>` : '';
        html.push(
          `<div class="my-2 overflow-hidden rounded-lg border border-ink-600 bg-ink-950">${label}<pre class="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-mist-200">${codeBuffer.join('\n')}</pre></div>`,
        );
        codeBuffer = null;
        codeLang = '';
      }
      continue;
    }
    if (codeBuffer !== null) {
      codeBuffer.push(line);
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      tableBuffer.push(line);
      continue;
    }
    flushTable();

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(heading[1]!.length + 2, 6);
      const sizes: Record<number, string> = { 3: 'text-lg font-semibold mt-4 mb-1', 4: 'text-base font-semibold mt-3 mb-1', 5: 'text-sm font-semibold mt-2 mb-1', 6: 'text-sm font-medium mt-2 mb-1' };
      html.push(`<h${level} class="${sizes[level]} text-mist-50">${inline(heading[2] ?? '')}</h${level}>`);
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      closeList();
      html.push('<hr class="my-3 border-ink-600" />');
      continue;
    }
    const unordered = /^\s*[-*]\s+(.*)$/.exec(line);
    if (unordered) {
      if (inList !== 'ul') {
        closeList();
        html.push('<ul class="my-1 list-inside list-disc space-y-0.5">');
        inList = 'ul';
      }
      html.push(`<li>${inline(unordered[1] ?? '')}</li>`);
      continue;
    }
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ordered) {
      if (inList !== 'ol') {
        closeList();
        html.push('<ol class="my-1 list-inside list-decimal space-y-0.5">');
        inList = 'ol';
      }
      html.push(`<li>${inline(ordered[1] ?? '')}</li>`);
      continue;
    }
    closeList();
    if (line.trim().length > 0) html.push(`<p class="my-1.5">${inline(line)}</p>`);
  }
  closeList();
  flushTable();
  // Unterminated fence (e.g. while streaming): render what we have so far.
  if (codeBuffer !== null) {
    html.push(
      `<div class="my-2 overflow-hidden rounded-lg border border-ink-600 bg-ink-950"><pre class="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-mist-200">${codeBuffer.join('\n')}</pre></div>`,
    );
  }
  return html.join('\n');
}

export function Markdown({ text, className }: { text: string; className?: string }): React.JSX.Element {
  return (
    <div
      className={`text-sm leading-relaxed text-mist-200 ${className ?? ''}`}
      // Safe: renderMarkdown escapes all HTML before building its own tags.
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
