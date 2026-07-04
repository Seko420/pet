import type { GddContext } from '../context';
import { primaryCurrencyName } from '../context';
import { blocks, bullets, mdTable } from '../markdown';

/** Section: economy. */
export function buildEconomy(ctx: GddContext): string {
  const { content, rng } = ctx;

  const table = mdTable(
    ['Währung', 'Typ', 'Earn-Quellen', 'Spend-Sinks', 'Sink/Source-Balance'],
    content.currencies.map((c) => [
      c.name,
      c.kind,
      c.earn.join('; '),
      c.spend.join('; '),
      c.balance,
    ]),
  );

  const sinkTarget = rng.int(80, 90);
  const firstSpendSeconds = rng.int(60, 120);

  return blocks(
    '### Währungen im Überblick',
    table,
    '### Grundsätze',
    bullets([
      `Sink/Source-Ziel: rund ${sinkTarget} % der verdienten Soft-Währung sollen mittelfristig in Sinks fließen – sonst droht Inflation und Käufe verlieren ihre Bedeutung.`,
      `Die erste Ausgabe-Entscheidung passiert innerhalb der ersten ${firstSpendSeconds} Sekunden – Ausgeben will genauso gelernt sein wie Verdienen.`,
      'Jede Währung hat einen klaren Zweck; überlappen sich zwei Währungen, wird eine gestrichen.',
      'Preise und Erträge werden in einer zentralen Economy-Tabelle gepflegt und pro Playtest gegen die Balancing-Startwerte geprüft.',
      'Hard Currency kauft niemals direkte Spielstärke – Details regelt die Monetarisierungs-Sektion.',
    ]),
  );
}

/** Section: items. */
export function buildItems(ctx: GddContext): string {
  const { content, rng } = ctx;
  const ordered = rng.shuffle(content.items);

  const table = mdTable(
    ['Item', 'Wirkung', 'Seltenheit'],
    ordered.map((item) => [item.name, item.effect, item.rarity]),
  );

  return blocks(
    'Beispielliste als Ausgangspunkt – alle Einträge sind Originale und dürfen im Produktionsverlauf ersetzt werden, solange Rolle und Seltenheits-Mix erhalten bleiben.',
    table,
    '### Seltenheits-Verteilung (Richtwert)',
    bullets([
      'Gewöhnlich ca. 60 %, Selten ca. 25 %, Episch ca. 12 %, Legendär ca. 3 % der Drops/Angebote.',
      'Legendäre Items definieren Momente, keine Pflicht: Der Kern bleibt ohne sie voll spielbar.',
      `Item-Werte hängen an der Economy: Preise in ${primaryCurrencyName(ctx)} folgen der zentralen Economy-Tabelle.`,
    ]),
  );
}

/** Section: enemies (Gegner & Bosse). */
export function buildEnemies(ctx: GddContext): string {
  const { content } = ctx;

  const intro =
    content.enemyFraming === 'enemies'
      ? 'Gegner sind Rollen im Kampfsystem: Jeder Typ stellt eine andere Frage an die Spielenden.'
      : content.enemyFraming === 'rivals'
        ? 'Dieses Genre kennt keine klassischen Monster – die „Gegner" sind Rivalen bzw. gegnerische Archetypen, gegen die gespielt wird.'
        : 'Dieses Genre kommt ohne klassische Gegner aus – an ihre Stelle treten Hindernisse und Herausforderungen, die dieselbe Design-Rolle erfüllen: Spannung, Rhythmus, Meisterbarkeit.';

  const header =
    content.enemyFraming === 'enemies'
      ? ['Gegner', 'Rolle', 'Verhalten']
      : content.enemyFraming === 'rivals'
        ? ['Rivale/Archetyp', 'Rolle', 'Verhalten']
        : ['Hindernis/Herausforderung', 'Rolle', 'Verhalten'];

  const table = mdTable(
    header,
    content.enemies.map((e) => [e.name, e.role, e.behavior]),
  );

  return blocks(
    intro,
    table,
    '### Design-Regeln',
    bullets([
      'Telegrafie vor Härte: Jede Gefahr kündigt sich sichtbar oder hörbar an, bevor sie zuschlägt.',
      'Bosse/Finals prüfen Gelerntes in neuer Kombination – keine unangekündigten neuen Regeln im Höhepunkt.',
      'Jeder Typ bleibt in Silhouette und Farbschema eindeutig unterscheidbar.',
    ]),
  );
}

/** Section: quests. */
export function buildQuests(ctx: GddContext): string {
  const { content, project, rng } = ctx;
  const ordered = rng.shuffle(content.quests);

  const table = mdTable(
    ['Quest', 'Ziel', 'Belohnung'],
    ordered.map((q) => [q.name, q.goal, q.reward]),
  );

  const kidsNote =
    project.audience === 'kids_8_12' || project.audience === 'family'
      ? 'Für die junge Zielgruppe gilt zusätzlich: Serien-Boni verfallen nicht komplett bei einem verpassten Tag, und kein Quest-Design erzeugt Login-Druck.'
      : null;

  return blocks(
    'Beispiel-Quests als Startset – Namen und Ziele sind Originale und dienen als Vorlage für die Produktions-Pipeline.',
    table,
    '### Quest-Struktur',
    bullets([
      'Tagesziele: 2–3 kleine Aufgaben, in einer Session schaffbar.',
      'Wochenziele: 1–2 größere Aufgaben, die verschiedene Systeme anspielen.',
      'Meilenstein-Quests: einmalige Aufgaben entlang der Progressions-Meilensteine, erzählen nebenbei die Welt.',
      'Jede Quest ist ohne Zeitdruck lösbar; abgelaufene Tagesziele werden ersetzt, nicht bestraft.',
    ]),
    kidsNote,
  );
}
