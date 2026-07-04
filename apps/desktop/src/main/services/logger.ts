import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Minimal file logger: <userData>/logs/main.log, rotated at ~1 MB (one
 * backup generation). Never log secrets or payloads - messages only.
 */
export class Logger {
  private readonly logPath: string;

  constructor(userDataPath: string) {
    const dir = join(userDataPath, 'logs');
    mkdirSync(dir, { recursive: true });
    this.logPath = join(dir, 'main.log');
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
    try {
      if (existsSync(this.logPath) && statSync(this.logPath).size > 1024 * 1024) {
        renameSync(this.logPath, this.logPath + '.1');
      }
      appendFileSync(this.logPath, `${new Date().toISOString()} [${level}] ${message}\n`, 'utf-8');
    } catch {
      // Logging must never crash the app.
    }
    const line = `[egf:${level.toLowerCase()}] ${message}`;
    if (level === 'ERROR') console.error(line);
    else if (level === 'WARN') console.warn(line);
    else console.log(line);
  }

  info(message: string): void {
    this.write('INFO', message);
  }
  warn(message: string): void {
    this.write('WARN', message);
  }
  error(message: string): void {
    this.write('ERROR', message);
  }
}
