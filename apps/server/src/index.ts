import { timingSafeEqual, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Response } from 'express';
import { createServices, disposeServices } from '../../desktop/src/main/services';
import { buildHandlers, type PlatformOps } from '../../desktop/src/main/ipc/handlers';
import type { IpcChannel } from '../../desktop/src/shared/ipc';
import { createKeyFileCipher } from './cipher';

/**
 * Empire Game Forge AI - Web-Modus.
 * Gleiche Services, gleiche UI, gleicher IPC-Vertrag wie die Desktop-App -
 * nur die Bridge ist HTTP (POST /api/invoke/:channel) + SSE (/api/events).
 *
 * Zugriffsschutz: HTTP Basic Auth (Nutzer "forge"), Passwort aus
 * EGF_WEB_PASSWORD oder automatisch generiert in <dataDir>/web-config.json.
 * Standardmäßig bindet der Server NUR an 127.0.0.1.
 */

// --------------------------------------------------------------- Konfiguration
const dataDir = process.env.EGF_DATA_DIR ?? join(homedir(), '.empire-game-forge');
mkdirSync(dataDir, { recursive: true });

interface WebConfig {
  password: string;
  port: number;
  host: string;
}

const configPath = join(dataDir, 'web-config.json');
let config: WebConfig;
if (existsSync(configPath)) {
  config = JSON.parse(readFileSync(configPath, 'utf-8')) as WebConfig;
} else {
  config = { password: randomBytes(12).toString('base64url'), port: 8321, host: '127.0.0.1' };
  writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
}
const password = process.env.EGF_WEB_PASSWORD ?? config.password;
const port = Number(process.env.EGF_WEB_PORT ?? config.port);
const host = process.env.EGF_WEB_HOST ?? config.host;

const documentsDefault = join(homedir(), 'Documents');
const services = createServices(
  {
    userDataPath: dataDir,
    documentsPath: existsSync(documentsDefault) ? documentsDefault : dataDir,
  },
  createKeyFileCipher(dataDir),
);
services.logger.info('Web-Modus gestartet.');

// ------------------------------------------------------------------- Handler
const ops: PlatformOps = {
  mode: 'web',
  appVersion: () => '0.1.0 (web)',
  safeStorageAvailable: () => true, // AES-Key-Datei-Cipher ist immer verfügbar
  async openPath(path) {
    throw new Error(
      `Im Web-Modus öffnet der Server keine Ordner auf deinem Gerät. Der Pfad auf dem Server lautet: ${path}`,
    );
  },
  async pickDirectory() {
    return null; // Kein nativer Dialog im Browser - Features nutzen feste Server-Pfade.
  },
  async exportProjectDialog() {
    throw new Error('Im Web-Modus läuft der Export über den Browser-Download (die UI nutzt das automatisch).');
  },
  async importProjectDialog() {
    throw new Error('Im Web-Modus läuft der Import über den Datei-Upload (die UI nutzt das automatisch).');
  },
  afterBackupRestore() {
    services.logger.warn('Backup wiederhergestellt - Server beendet sich, bitte neu starten (npm run web).');
    setTimeout(() => process.exit(0), 300);
  },
};
const handlers = buildHandlers(services, ops);

// -------------------------------------------------------------------- Server
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));

// Basic Auth (timing-safe) für ALLES.
app.use((req, res, next) => {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    const expected = `forge:${password}`;
    const a = Buffer.from(decoded);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      next();
      return;
    }
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Empire Game Forge AI", charset="UTF-8"');
  res.status(401).send('Anmeldung erforderlich.');
});

// SSE: Build-Events an alle offenen Browser-Tabs.
const sseClients = new Set<Response>();
services.build.setSink((event) => {
  const name = event.type === 'output' ? 'event:buildOutput' : 'event:buildExit';
  const frame = `event: ${name}\ndata: ${JSON.stringify(event.payload)}\n\n`;
  for (const client of sseClients) client.write(frame);
});

app.get('/api/events', (req, res) => {
  res.setHeader('content-type', 'text/event-stream');
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('connection', 'keep-alive');
  res.flushHeaders();
  res.write(': verbunden\n\n');
  sseClients.add(res);
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Typed invoke endpoint - the browser bridge's counterpart to ipcRenderer.invoke.
app.post('/api/invoke/:channel', async (req, res) => {
  const channel = req.params.channel as IpcChannel;
  const handler = handlers[channel];
  // CSRF-Schutz: eigene Header erzwingen Preflight, das wir nie erlauben.
  if (req.headers['x-egf-request'] !== '1') {
    res.status(403).json({ error: 'Ungültige Anfrage.' });
    return;
  }
  if (!handler) {
    res.status(404).json({ error: `Unbekannter Kanal: ${channel}` });
    return;
  }
  try {
    const result = await (handler as (r: unknown) => Promise<unknown>)(req.body?.req);
    res.json({ ok: true, result: result ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    services.logger.error(`web ${channel}: ${message}`);
    res.status(400).json({ ok: false, error: message });
  }
});

// Statische UI: derselbe Renderer-Build wie in der Desktop-App.
const rendererDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../desktop/out/renderer');
if (!existsSync(join(rendererDir, 'index.html'))) {
  console.error(
    '\nRenderer-Build fehlt. Bitte zuerst bauen:  npm run build -w apps/desktop\n(oder alles in einem: npm run web)\n',
  );
  process.exit(1);
}
app.use(express.static(rendererDir));

const server = app.listen(port, host, () => {
  const shownHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log('');
  console.log('  ⚒  Empire Game Forge AI — Web-Modus');
  console.log(`  →  http://${shownHost}:${port}`);
  console.log(`  →  Anmeldung: Benutzer "forge", Passwort in ${configPath}`);
  if (host !== '127.0.0.1') {
    console.log('  ⚠  Server ist nicht nur auf localhost gebunden - nur mit HTTPS-Reverse-Proxy betreiben!');
  }
  console.log('');
});

process.on('SIGINT', () => {
  server.close();
  disposeServices(services);
  process.exit(0);
});
