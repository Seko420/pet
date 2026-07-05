import type { SecretRef, SecretService } from '@egf/core';
import { createId, nowIso } from '@egf/core';
import type { Db } from '../db/database';

/**
 * Secret storage. Values are encrypted with an injected cipher (Electron
 * safeStorage in production, a fake in tests) and persisted as BLOBs.
 *
 * INVARIANTS:
 * - Plaintext never crosses IPC back to the renderer (no channel returns it).
 * - Plaintext never appears in logs or error messages.
 * - getPlaintext() is main-process-internal, for services that call APIs.
 */

export interface SecretsCipher {
  isAvailable(): boolean;
  encrypt(plaintext: string): Buffer;
  decrypt(ciphertext: Buffer): string;
}

export class SecretsService {
  constructor(
    private readonly db: Db,
    private readonly cipher: SecretsCipher,
  ) {}

  private assertAvailable(): void {
    if (!this.cipher.isAvailable()) {
      throw new Error(
        'Sichere Verschlüsselung ist auf diesem System nicht verfügbar (safeStorage). Unter Linux wird ein aktiver Keyring (z.B. gnome-keyring) benötigt. Keys werden aus Sicherheitsgründen NICHT unverschlüsselt gespeichert.',
      );
    }
  }

  list(): SecretRef[] {
    const rows = this.db
      .prepare('SELECT id, name, service, hint, created_at, updated_at FROM secrets ORDER BY created_at DESC')
      .all() as { id: string; name: string; service: string; hint: string; created_at: string; updated_at: string }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      service: r.service as SecretService,
      hint: r.hint,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  set(name: string, service: SecretService, value: string): SecretRef {
    this.assertAvailable();
    const trimmed = value.trim();
    // Local AI endpoints (LM Studio/Ollama) accept short placeholder keys.
    if (trimmed.length < 4) {
      throw new Error('Der Schlüssel ist zu kurz - bitte den vollständigen API-Key einfügen (für lokale KIs reicht z.B. "lokal").');
    }
    if (!name.trim()) {
      throw new Error('Bitte einen Namen für den Schlüssel angeben.');
    }
    const ciphertext = this.cipher.encrypt(trimmed);
    const now = nowIso();
    const ref: SecretRef = {
      id: createId('sec'),
      name: name.trim(),
      service,
      hint: `…${trimmed.slice(-4)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare('INSERT INTO secrets (id, name, service, hint, ciphertext, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(ref.id, ref.name, ref.service, ref.hint, ciphertext, now, now);
    return ref;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM secrets WHERE id = ?').run(id);
  }

  /** Newest secret of a service, or null. Main-process-internal. */
  latestRefFor(service: SecretService): SecretRef | null {
    return this.list().find((s) => s.service === service) ?? null;
  }

  /** Main-process-internal only - never expose via IPC. */
  getPlaintext(id: string): string {
    this.assertAvailable();
    const row = this.db.prepare('SELECT ciphertext FROM secrets WHERE id = ?').get(id) as
      | { ciphertext: Buffer }
      | undefined;
    if (!row) {
      throw new Error('Der hinterlegte Schlüssel wurde nicht gefunden - bitte in den Einstellungen neu anlegen.');
    }
    return this.cipher.decrypt(row.ciphertext);
  }
}

/** Production cipher backed by Electron safeStorage (OS keychain/DPAPI). */
export function createSafeStorageCipher(safeStorage: {
  isEncryptionAvailable(): boolean;
  encryptString(s: string): Buffer;
  decryptString(b: Buffer): string;
}): SecretsCipher {
  return {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (plaintext) => safeStorage.encryptString(plaintext),
    decrypt: (ciphertext) => safeStorage.decryptString(ciphertext),
  };
}
