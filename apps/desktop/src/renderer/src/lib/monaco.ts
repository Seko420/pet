/**
 * Offline Monaco setup for Electron, trimmed to what this app actually
 * edits (Luau/GDScript/JSON/config), NOT the full ~90-language build.
 *
 * We import the core editor API plus only the language *contributions* we
 * use. Syntax highlighting comes from the lightweight `basic-languages`
 * grammars; the only heavy language *service* we keep is JSON (validation
 * is genuinely useful for config files). We deliberately DROP the
 * TypeScript language service - its worker alone is ~12 MB and this is a
 * game studio, not a TS IDE. `.ts/.js` files still get highlighting via the
 * basic grammar, just without IntelliSense.
 *
 * Everything is bundled locally - no CDN (the CSP forbids remote scripts
 * and the desktop app must work offline).
 */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Lightweight syntax grammars (tokenization only, no worker):
import 'monaco-editor/esm/vs/basic-languages/lua/lua.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';

// The one rich language service we keep (JSON validation + formatting):
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { loader } from '@monaco-editor/react';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    if (label === 'json') return new jsonWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

export { monaco };
