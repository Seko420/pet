import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SecretsCipher } from '../../desktop/src/main/services/secrets';

/**
 * Secrets cipher for the web mode: AES-256-GCM with a random key stored in
 * <dataDir>/web-secret.key (file mode 0600).
 *
 * Honest security note (also in docs/WEB.md): unlike the desktop app, which
 * uses the OS keychain, the key lives on the server's disk. That protects
 * the database file on its own, but anyone with full access to the server
 * user can read both. For a private single-user server this is the standard
 * trade-off - never expose the server without password + HTTPS.
 */
export function createKeyFileCipher(dataDir: string): SecretsCipher {
  const keyPath = join(dataDir, 'web-secret.key');
  let key: Buffer;
  if (existsSync(keyPath)) {
    key = Buffer.from(readFileSync(keyPath, 'utf-8').trim(), 'hex');
    if (key.length !== 32) throw new Error('web-secret.key ist beschädigt (erwartet 32 Byte hex).');
  } else {
    key = randomBytes(32);
    mkdirSync(dirname(keyPath), { recursive: true });
    writeFileSync(keyPath, key.toString('hex'), { encoding: 'utf-8', mode: 0o600 });
    try {
      chmodSync(keyPath, 0o600);
    } catch {
      /* windows: ACLs statt chmod */
    }
  }

  return {
    isAvailable: () => true,
    encrypt(plaintext) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
    },
    decrypt(ciphertext) {
      const iv = ciphertext.subarray(0, 12);
      const tag = ciphertext.subarray(12, 28);
      const data = ciphertext.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf-8');
    },
  };
}
