import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import type BetterSqlite3 from 'better-sqlite3';

// Works in both the CJS main bundle and ESM test runners.
const requireModule = createRequire(import.meta.url);

/**
 * SQLite bootstrap: WAL journal, foreign keys, versioned migrations.
 * Storage pattern: full domain objects as JSON in `data`, plus a few
 * indexed columns for queries.
 */

const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        platform TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE ideas (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE gdds (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX idx_tasks_project ON tasks(project_id);
      CREATE TABLE content_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        data TEXT NOT NULL
      );
      CREATE INDEX idx_content_project ON content_items(project_id);
      CREATE TABLE analytics_plans (
        project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
        data TEXT NOT NULL
      );
      CREATE TABLE checklist_state (
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        checklist_kind TEXT NOT NULL,
        item_id TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (project_id, checklist_kind, item_id)
      );
      CREATE TABLE secrets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        service TEXT NOT NULL,
        hint TEXT NOT NULL,
        ciphertext BLOB NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE agent_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX idx_agent_messages_project ON agent_messages(project_id, created_at);
      CREATE TABLE agent_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX idx_agent_runs_project ON agent_runs(project_id, created_at);
      CREATE TABLE build_records (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        ok INTEGER NOT NULL,
        at TEXT NOT NULL,
        summary TEXT NOT NULL
      );
      CREATE INDEX idx_build_records_project ON build_records(project_id, at);
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE playtest_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX idx_playtests_project ON playtest_sessions(project_id, created_at);
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];

export type Db = BetterSqlite3.Database;

export function openDatabase(dbPath: string): Db {
  let DatabaseCtor: typeof BetterSqlite3;
  try {
    // Deferred require: gives a clear, actionable error instead of a raw
    // ABI stack trace when the native module was not rebuilt for Electron.
    DatabaseCtor = requireModule('better-sqlite3') as typeof BetterSqlite3;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `better-sqlite3 konnte nicht geladen werden. Vermutlich fehlt der native Build für Electron - bitte im Projektordner "npm run rebuild" ausführen und die App neu starten.\n(Details: ${detail})`,
    );
  }

  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseCtor(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`);
  const appliedRow = db.prepare('SELECT MAX(version) AS v FROM migrations').get() as { v: number | null };
  const applied = appliedRow.v ?? 0;
  for (const migration of MIGRATIONS) {
    if (migration.version <= applied) continue;
    const run = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare('INSERT INTO migrations (version, applied_at) VALUES (?, ?)').run(
        migration.version,
        new Date().toISOString(),
      );
    });
    run();
  }
  return db;
}
