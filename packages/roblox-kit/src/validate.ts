import type { ScaffoldFile } from '@egf/core';

export interface RobloxValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface RobloxValidationResult {
  ok: boolean;
  issues: RobloxValidationIssue[];
  checkedFiles: number;
}

/**
 * Static checks over a Rojo project tree (as in-memory files).
 * Errors block publishing; warnings inform.
 */
export function validateRobloxProject(files: ScaffoldFile[]): RobloxValidationResult {
  const issues: RobloxValidationIssue[] = [];
  const byPath = new Map(files.map((f) => [f.path.replace(/\\/g, '/'), f] as const));
  const error = (message: string): void => {
    issues.push({ severity: 'error', message });
  };
  const warning = (message: string): void => {
    issues.push({ severity: 'warning', message });
  };

  // --- project file
  const project = byPath.get('default.project.json');
  if (!project) {
    error('default.project.json fehlt – kein gültiges Rojo-Projekt.');
  } else {
    try {
      const parsed = JSON.parse(project.content) as { tree?: unknown; name?: unknown };
      if (!parsed.tree) error('default.project.json enthält keinen "tree"-Eintrag.');
    } catch {
      error('default.project.json ist kein gültiges JSON.');
    }
  }

  const luauFiles = files.filter((f) => f.path.endsWith('.luau') || f.path.endsWith('.lua'));
  if (!luauFiles.some((f) => /Main\.server\.luau?$/.test(f.path))) {
    error('Main.server.luau fehlt – der Server hat keinen Einstiegspunkt.');
  }

  const usesRemotes = luauFiles.some((f) => /Remote(Event|Function)/.test(f.content));
  const hasNet = luauFiles.some((f) => /\/Net\.luau?$/.test(f.path) || f.path === 'src/shared/Net.luau');
  if (usesRemotes && !hasNet) {
    error('RemoteEvents werden benutzt, aber es gibt keine zentrale Net-Registry (src/shared/Net.luau).');
  }

  // --- dangerous patterns
  const keyPattern = /(x-api-key|ROBLOSECURITY|api[_-]?key\s*=\s*["'][A-Za-z0-9+/_-]{24,})/i;
  const longSecretPattern = /["'][A-Za-z0-9+/=_-]{48,}["']/;
  for (const f of luauFiles) {
    if (keyPattern.test(f.content) || longSecretPattern.test(f.content)) {
      error(`Möglicher hartkodierter API-Key/Secret in ${f.path} – Keys gehören verschlüsselt in die App, nie in Code.`);
    }
    if (/\bloadstring\s*\(/.test(f.content)) {
      error(`loadstring-Verwendung in ${f.path} – Sicherheitsrisiko, entfernen.`);
    }
    const isClient = f.path.includes('/client/');
    if (isClient && /(HttpService\s*:|RequestAsync|GetAsync|PostAsync)/.test(f.content)) {
      error(`HTTP-Aufruf im Client-Code (${f.path}) – HTTP ist nur serverseitig erlaubt.`);
    }
  }

  // --- warnings
  if (!byPath.has('README.md')) warning('README.md fehlt – Workflow-Doku empfohlen.');
  if (!luauFiles.some((f) => /AntiExploit/i.test(f.path))) {
    warning('Kein AntiExploit-Service gefunden – Remotes sollten rate-limitiert und validiert werden.');
  }
  const configFile = byPath.get('src/shared/Config.luau');
  if (configFile && /GamePasses = \{\s*--/.test(configFile.content)) {
    warning('Monetarisierungs-IDs in Config.luau sind noch nicht eingetragen (auskommentierte Platzhalter).');
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    issues,
    checkedFiles: files.length,
  };
}
