import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { BackupInfo } from '../../shared/ipc';
import type { Db } from '../db/database';
import type { Logger } from './logger';

/**
 * Crash-safe backups of the entire studio database.
 * - create: uses better-sqlite3's online backup API (consistent snapshot,
 *   safe while the app runs), keeps the newest 20 files.
 * - restore: copies a backup over the live DB and asks the caller to
 *   relaunch (the DB connection must be closed first).
 * Location: <userData>/backups/egf-backup-<timestamp>.sqlite
 */
export class BackupService {
  private readonly backupDir: string;

  constructor(
    private readonly db: Db,
    private readonly dbPath: string,
    userDataPath: string,
    private readonly logger: Logger,
  ) {
    this.backupDir = join(userDataPath, 'backups');
    mkdirSync(this.backupDir, { recursive: true });
  }

  getBackupDir(): string {
    return this.backupDir;
  }

  async create(): Promise<BackupInfo> {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `egf-backup-${stamp}.sqlite`;
    const target = join(this.backupDir, fileName);
    await this.db.backup(target);
    this.prune();
    const stat = statSync(target);
    this.logger.info(`Backup erstellt: ${fileName} (${Math.round(stat.size / 1024)} kB)`);
    return { fileName, path: target, createdAt: new Date().toISOString(), sizeBytes: stat.size };
  }

  list(): BackupInfo[] {
    if (!existsSync(this.backupDir)) return [];
    return readdirSync(this.backupDir)
      .filter((name) => name.startsWith('egf-backup-') && name.endsWith('.sqlite'))
      .map((name) => {
        const path = join(this.backupDir, name);
        const stat = statSync(path);
        return { fileName: name, path, createdAt: stat.mtime.toISOString(), sizeBytes: stat.size };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private prune(): void {
    const backups = this.list();
    for (const old of backups.slice(20)) {
      try {
        unlinkSync(old.path);
      } catch {
        /* best effort */
      }
    }
  }

  /**
   * Replace the live DB with a backup. The caller MUST close the DB before
   * calling this and relaunch the app afterwards.
   */
  restoreAfterDbClosed(fileName: string): void {
    // Only allow files from our backup directory - no arbitrary paths.
    const safeName = basename(fileName);
    const source = join(this.backupDir, safeName);
    if (!existsSync(source)) throw new Error('Backup-Datei nicht gefunden.');
    copyFileSync(source, this.dbPath);
    this.logger.warn(`Backup wiederhergestellt: ${safeName} - App wird neu gestartet.`);
  }
}
