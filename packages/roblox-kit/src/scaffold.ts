import type { Genre, MonetizationModel, ScaffoldFile } from '@egf/core';
import {
  ANTI_EXPLOIT_LUAU,
  DATA_SERVICE_LUAU,
  ECONOMY_SERVICE_LUAU,
  INPUT_CONTROLLER_LUAU,
  LEADERSTATS_LUAU,
  MAIN_CLIENT_LUAU,
  MAIN_SERVER_LUAU,
  MAIN_SERVER_WITH_MATCH_LUAU,
  MATCH_SERVICE_LUAU,
  NET_LUAU,
  QUEST_SERVICE_LUAU,
  SHOP_SERVICE_LUAU,
  TYPES_LUAU,
  UI_CONTROLLER_LUAU,
} from './luauTemplates';

export interface RobloxScaffoldInput {
  projectName: string;
  slug: string;
  genre: Genre;
  multiplayer: boolean;
  monetization: MonetizationModel[];
}

interface GenreTuning {
  currencies: { name: string; start: number }[];
  leaderstats: string[];
  quests: { id: string; title: string; goal: number; rewardCurrency: string; rewardAmount: number }[];
  shop: { id: string; displayName: string; currency: string; price: number; maxOwned: number | null }[];
  tuning: Record<string, number>;
}

function genreTuning(genre: Genre): GenreTuning {
  switch (genre) {
    case 'simulator':
    case 'idle':
      return {
        currencies: [
          { name: 'Coins', start: 50 },
          { name: 'Gems', start: 0 },
        ],
        leaderstats: ['Coins', 'Gems'],
        quests: [
          { id: 'collect_100', title: 'Sammle 100 Coins', goal: 100, rewardCurrency: 'Gems', rewardAmount: 5 },
          { id: 'buy_upgrade', title: 'Kaufe 1 Aufwertung', goal: 1, rewardCurrency: 'Coins', rewardAmount: 150 },
          { id: 'play_10min', title: 'Spiele 10 Minuten', goal: 600, rewardCurrency: 'Gems', rewardAmount: 3 },
        ],
        shop: [
          { id: 'collector_1', displayName: 'Turbo-Sammler I', currency: 'Coins', price: 100, maxOwned: 1 },
          { id: 'collector_2', displayName: 'Turbo-Sammler II', currency: 'Coins', price: 450, maxOwned: 1 },
          { id: 'backpack_1', displayName: 'Großer Beutel', currency: 'Gems', price: 12, maxOwned: 1 },
        ],
        tuning: { CollectValue: 1, CollectIntervalSeconds: 2, UpgradeMultiplier: 2 },
      };
    case 'tycoon':
      return {
        currencies: [
          { name: 'Cash', start: 100 },
          { name: 'Prestige', start: 0 },
        ],
        leaderstats: ['Cash', 'Prestige'],
        quests: [
          { id: 'earn_500', title: 'Verdiene 500 Cash', goal: 500, rewardCurrency: 'Cash', rewardAmount: 200 },
          { id: 'build_3', title: 'Baue 3 Anlagen', goal: 3, rewardCurrency: 'Cash', rewardAmount: 300 },
          { id: 'play_10min', title: 'Spiele 10 Minuten', goal: 600, rewardCurrency: 'Cash', rewardAmount: 250 },
        ],
        shop: [
          { id: 'dropper_1', displayName: 'Erzeuger I', currency: 'Cash', price: 150, maxOwned: 1 },
          { id: 'dropper_2', displayName: 'Erzeuger II', currency: 'Cash', price: 600, maxOwned: 1 },
          { id: 'conveyor_boost', displayName: 'Band-Beschleuniger', currency: 'Cash', price: 350, maxOwned: 3 },
        ],
        tuning: { BaseIncomePerSecond: 2, IncomeGrowth: 1.6, RebirthUnlockCash: 100000 },
      };
    case 'obby':
      return {
        currencies: [{ name: 'Stars', start: 0 }],
        leaderstats: ['Stars'],
        quests: [
          { id: 'reach_cp5', title: 'Erreiche Checkpoint 5', goal: 5, rewardCurrency: 'Stars', rewardAmount: 3 },
          { id: 'finish_run', title: 'Schaffe einen Durchlauf', goal: 1, rewardCurrency: 'Stars', rewardAmount: 10 },
          { id: 'no_fall_10', title: '10 Checkpoints ohne Sturz', goal: 10, rewardCurrency: 'Stars', rewardAmount: 8 },
        ],
        shop: [
          { id: 'trail_spark', displayName: 'Funken-Spur (Cosmetic)', currency: 'Stars', price: 15, maxOwned: 1 },
          { id: 'emote_flip', displayName: 'Salto-Emote (Cosmetic)', currency: 'Stars', price: 25, maxOwned: 1 },
        ],
        tuning: { CheckpointCount: 25, StarPerCheckpoint: 1, RespawnSeconds: 2 },
      };
    case 'battle_arena':
      return {
        currencies: [
          { name: 'Credits', start: 0 },
          { name: 'Trophies', start: 0 },
        ],
        leaderstats: ['Trophies'],
        quests: [
          { id: 'win_1', title: 'Gewinne 1 Match', goal: 1, rewardCurrency: 'Credits', rewardAmount: 100 },
          { id: 'play_3', title: 'Spiele 3 Matches', goal: 3, rewardCurrency: 'Credits', rewardAmount: 80 },
          { id: 'deal_1000', title: 'Verursache 1000 Schaden', goal: 1000, rewardCurrency: 'Credits', rewardAmount: 120 },
        ],
        shop: [
          { id: 'skin_neon', displayName: 'Neon-Skin (Cosmetic)', currency: 'Credits', price: 300, maxOwned: 1 },
          { id: 'banner_wolf', displayName: 'Wolfs-Banner (Cosmetic)', currency: 'Credits', price: 150, maxOwned: 1 },
        ],
        tuning: { RoundSeconds: 180, MinPlayers: 2, ComebackShieldPercent: 15 },
      };
    default:
      return {
        currencies: [
          { name: 'Coins', start: 25 },
          { name: 'Gems', start: 0 },
        ],
        leaderstats: ['Coins'],
        quests: [
          { id: 'first_steps', title: 'Erste Schritte abschließen', goal: 1, rewardCurrency: 'Coins', rewardAmount: 50 },
          { id: 'collect_50', title: 'Sammle 50 Coins', goal: 50, rewardCurrency: 'Gems', rewardAmount: 3 },
          { id: 'play_10min', title: 'Spiele 10 Minuten', goal: 600, rewardCurrency: 'Coins', rewardAmount: 100 },
        ],
        shop: [
          { id: 'starter_pack', displayName: 'Starter-Ausrüstung', currency: 'Coins', price: 75, maxOwned: 1 },
          { id: 'cosmetic_hat', displayName: 'Forge-Helm (Cosmetic)', currency: 'Gems', price: 10, maxOwned: 1 },
        ],
        tuning: { SessionGoalMinutes: 8 },
      };
  }
}

function luauNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, '');
}

function buildConfigLuau(input: RobloxScaffoldInput, t: GenreTuning): string {
  const currencies = t.currencies.map((c) => `\t${c.name} = ${c.start},`).join('\n');
  const leaderstats = t.leaderstats.map((n) => `\t"${n}",`).join('\n');
  const quests = t.quests
    .map(
      (q) =>
        `\t${q.id} = { title = "${q.title}", goal = ${q.goal}, rewardCurrency = "${q.rewardCurrency}", rewardAmount = ${q.rewardAmount} },`,
    )
    .join('\n');
  const shop = t.shop
    .map(
      (s) =>
        `\t${s.id} = { displayName = "${s.displayName}", currency = "${s.currency}", price = ${s.price}, maxOwned = ${s.maxOwned === null ? 'nil' : s.maxOwned} },`,
    )
    .join('\n');
  const tuning = Object.entries(t.tuning)
    .map(([k, v]) => `\t${k} = ${luauNumber(v)},`)
    .join('\n');

  const hasRobuxMonetization =
    input.monetization.includes('game_passes') || input.monetization.includes('developer_products');
  const monetizationBlock = hasRobuxMonetization
    ? `-- IDs aus dem Creator Dashboard eintragen (Monetarisierung -> Pässe/Produkte).
Config.GamePasses = {
	-- ["123456789"] = { effect = "vip_area" },
}
Config.DeveloperProducts = {
	-- ["987654321"] = { currency = "${t.currencies[0]?.name ?? 'Coins'}", amount = 500 },
}`
    : `-- Für dieses Projekt ist keine Robux-Monetarisierung geplant.
-- Stubs bleiben leer, damit ShopService kompiliert:
Config.GamePasses = {}
Config.DeveloperProducts = {}`;

  return `--!strict
-- Zentrale Spielkonfiguration für "${input.projectName}".
-- Alle Preise/Werte leben HIER (Server-autoritativ) - nie im Client duplizieren.

local Config = {}

Config.GameName = "${input.projectName}"
Config.Genre = "${input.genre}"

Config.StartingCurrencies = {
${currencies}
}

Config.LeaderstatCurrencies = {
${leaderstats}
}

-- Tagesquests: id = { title, goal, rewardCurrency, rewardAmount }
Config.DailyQuests = {
${quests}
}

-- Shop-Katalog (Ingame-Währung). maxOwned = nil bedeutet unbegrenzt.
Config.ShopCatalog = {
${shop}
}

-- Genre-Tuning (Startwerte - über Playtests kalibrieren!)
Config.Tuning = {
${tuning}
}

${monetizationBlock}

return Config
`;
}

function buildRojoProject(input: RobloxScaffoldInput): string {
  return JSON.stringify(
    {
      name: input.slug,
      tree: {
        $className: 'DataModel',
        ReplicatedStorage: {
          Shared: { $path: 'src/shared' },
        },
        ServerScriptService: {
          Server: { $path: 'src/server' },
        },
        StarterPlayer: {
          StarterPlayerScripts: {
            Client: { $path: 'src/client' },
          },
        },
        Workspace: {
          $properties: { StreamingEnabled: true },
        },
      },
    },
    null,
    2,
  );
}

function buildReadme(input: RobloxScaffoldInput): string {
  return `# ${input.projectName} — Roblox-Projekt

Rojo-kompatibles Luau-Projekt, generiert von Empire Game Forge AI.

## Struktur

\`\`\`
default.project.json   Rojo-Baum (ReplicatedStorage/ServerScriptService/StarterPlayer)
src/shared/            Config, Net (Remote-Registry), Types  → ReplicatedStorage.Shared
src/server/            Main.server.luau + Services            → ServerScriptService.Server
src/client/            Main.client.luau + Controllers         → StarterPlayerScripts.Client
\`\`\`

**Grundprinzip: Der Client fordert an, der Server entscheidet.** Währungen,
Käufe und Quests werden ausschließlich serverseitig verändert; alle Remotes
sind typvalidiert und rate-limitiert (AntiExploitService).

## Workflow

1. Werkzeuge installieren (einmalig): [Aftman](https://github.com/LPGhatguy/aftman), dann \`aftman install\` in diesem Ordner (installiert Rojo).
2. Live-Sync in Roblox Studio: \`rojo serve\`, dann im Studio das Rojo-Plugin verbinden.
3. Place-Datei bauen: \`rojo build -o build/${input.slug}.rbxlx\`
4. Veröffentlichen: ausschließlich über Empire Game Forge (Roblox-Tab → Validieren → Dry-Run → Bestätigen). Kein Cookie-Login, nur die offizielle Open-Cloud-API.

## Monetarisierung konfigurieren

Game-Pass-/Developer-Product-IDs im Creator Dashboard anlegen und in
\`src/shared/Config.luau\` unter \`Config.GamePasses\` / \`Config.DeveloperProducts\`
eintragen. \`ProcessReceipt\` in \`ShopService.luau\` ist vorbereitet und idempotent.

## Sicherheit

- Keine API-Keys oder Secrets in diesem Ordner ablegen — niemals.
- Neue Remotes nur über \`src/shared/Net.luau\` registrieren und im Handler
  validieren (Muster: \`AntiExploitService.allowRemote\` + \`expectString\`).
`;
}

export function buildRobloxScaffold(input: RobloxScaffoldInput): ScaffoldFile[] {
  const t = genreTuning(input.genre);
  const files: ScaffoldFile[] = [
    { path: 'default.project.json', content: buildRojoProject(input) },
    {
      path: 'aftman.toml',
      content: `# Werkzeuge für dieses Projekt - installieren mit: aftman install
[tools]
rojo = "rojo-rbx/rojo@7.4.4"
`,
    },
    { path: 'README.md', content: buildReadme(input) },
    { path: '.gitignore', content: 'build/\n*.rbxl\n*.rbxlx\n*.rbxlx.lock\n' },
    { path: 'src/shared/Config.luau', content: buildConfigLuau(input, t) },
    { path: 'src/shared/Net.luau', content: NET_LUAU },
    { path: 'src/shared/Types.luau', content: TYPES_LUAU },
    {
      path: 'src/server/Main.server.luau',
      content: input.multiplayer ? MAIN_SERVER_WITH_MATCH_LUAU : MAIN_SERVER_LUAU,
    },
    { path: 'src/server/Services/DataService.luau', content: DATA_SERVICE_LUAU },
    { path: 'src/server/Services/EconomyService.luau', content: ECONOMY_SERVICE_LUAU },
    { path: 'src/server/Services/AntiExploitService.luau', content: ANTI_EXPLOIT_LUAU },
    { path: 'src/server/Services/LeaderstatsService.luau', content: LEADERSTATS_LUAU },
    { path: 'src/server/Services/ShopService.luau', content: SHOP_SERVICE_LUAU },
    { path: 'src/server/Services/QuestService.luau', content: QUEST_SERVICE_LUAU },
    { path: 'src/client/Main.client.luau', content: MAIN_CLIENT_LUAU },
    { path: 'src/client/Controllers/UIController.luau', content: UI_CONTROLLER_LUAU },
    { path: 'src/client/Controllers/InputController.luau', content: INPUT_CONTROLLER_LUAU },
  ];
  if (input.multiplayer) {
    files.push({ path: 'src/server/Services/MatchService.luau', content: MATCH_SERVICE_LUAU });
  }
  return files;
}
