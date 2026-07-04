import { describe, expect, it } from 'vitest';
import { generateGddSections, gddToMarkdown } from '../src/gdd/index';
import type { Genre, LabeledScore, TargetPlatform } from '../src/types/common';
import { GDD_SECTION_TITLES } from '../src/types/gdd';
import type { GddSectionId } from '../src/types/gdd';
import type { GameIdea } from '../src/types/idea';
import type { GameProject } from '../src/types/project';
import type { QualityScores } from '../src/types/scores';

function score(value: number): LabeledScore {
  return { value, reason: 'Test-Fixture' };
}

function makeScores(): QualityScores {
  return {
    fun: score(70),
    retention: score(65),
    monetization: score(60),
    viralPotential: score(55),
    productionFeasibility: score(80),
    robloxFit: score(75),
    mobileFit: score(70),
    technicalRisk: score(72),
    contentScalability: score(68),
    multiplayerPotential: score(64),
    liveOpsPotential: score(66),
    overall: 68,
  };
}

function makeProject(overrides: Partial<GameProject> = {}): GameProject {
  return {
    id: 'prj_test_fixture_0001',
    name: 'Wolkenwerk',
    slug: 'wolkenwerk',
    platform: 'roblox',
    genre: 'tycoon',
    audience: 'kids_8_12',
    status: 'concept',
    monetization: ['game_passes', 'developer_products'],
    artStyle: 'stylized_cartoon',
    multiplayer: true,
    qualityTarget: 'polished',
    mvpGoal: 'Spielbarer Tycoon-Kern mit erstem Prestige',
    releaseGoal: 'LiveOps-fähiger Release mit Events',
    description: 'Eine Fabrik in den Wolken, die Limonade für Vögel produziert.',
    workspacePath: null,
    ideaId: null,
    scores: null,
    roblox: null,
    mobile: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeIdea(): GameIdea {
  return {
    id: 'idea_test_fixture_0001',
    createdAt: '2026-01-01T00:00:00.000Z',
    brief: {
      platform: 'roblox',
      genres: ['tycoon'],
      audience: 'kids_8_12',
      monetizationFocus: ['game_passes'],
      maxEffort: 'medium',
      multiplayer: 'preferred',
      count: 1,
    },
    title: 'Wolkenwerk',
    elevatorPitch: 'Baue die verrückteste Limonadenfabrik über den Wolken.',
    coreLoop: ['Limonade brauen', 'An Vögel verkaufen', 'Maschinen aufrüsten', 'Neue Rezepte freischalten'],
    audience: 'kids_8_12',
    audienceNotes: 'Kinderfreundlich, keine Textwände.',
    usp: 'Jede Maschine hat eine sichtbare Persönlichkeit und reagiert auf Pflege.',
    genre: 'tycoon',
    platform: 'roblox',
    theme: 'Limonadenfabrik über den Wolken',
    monetization: [{ model: 'game_passes', description: 'Deko-Pass mit exklusiven Maschinen-Gesichtern.' }],
    risks: [
      { title: 'Genre-Sättigung auf Roblox', level: 'medium', mitigation: 'USP früh im Thumbnail und in der ersten Minute zeigen.' },
    ],
    developmentEffort: 'medium',
    effortBreakdown: '4 Wochen Kern, 2 Wochen Polish.',
    whyItCouldSucceed: ['Klarer Hook'],
    whyItCouldFail: ['Zu wenig Sichtbarkeit'],
    improvedVersion: {
      title: 'Wolkenwerk Deluxe',
      changes: ['Maschinen-Persönlichkeiten mit Quests verknüpfen', 'Koop-Schichtbetrieb für Freunde'],
      pitch: 'Die Fabrik, die zurücklächelt.',
    },
    scores: makeScores(),
  };
}

const ALL_SECTION_IDS = Object.keys(GDD_SECTION_TITLES) as GddSectionId[];

describe('generateGddSections', () => {
  it('erzeugt alle 21 Sektionen in der kanonischen Reihenfolge, jeweils mit Inhalt', () => {
    const sections = generateGddSections(makeProject(), null);

    expect(sections).toHaveLength(21);
    expect(sections.map((s) => s.id)).toEqual(ALL_SECTION_IDS);
    for (const section of sections) {
      expect(section.title).toBe(GDD_SECTION_TITLES[section.id]);
      expect(section.markdown.trim().length).toBeGreaterThan(50);
    }
  });

  it('ist deterministisch: gleicher Input ergibt identische Ausgabe', () => {
    const project = makeProject();
    const idea = makeIdea();
    const a = generateGddSections(project, idea);
    const b = generateGddSections(project, idea);
    expect(a).toEqual(b);
  });

  it('variiert mit der Projekt-Id (Seed)', () => {
    const a = generateGddSections(makeProject({ id: 'prj_seed_a' }), null);
    const b = generateGddSections(makeProject({ id: 'prj_seed_b' }), null);
    const changed = a.some((section, i) => section.markdown !== b[i]?.markdown);
    expect(changed).toBe(true);
  });

  it('Roblox-Projekt: roblox_implementation enthält RemoteEvent und DataStore-Muster', () => {
    const sections = generateGddSections(makeProject({ platform: 'roblox' }), null);
    const roblox = sections.find((s) => s.id === 'roblox_implementation');
    expect(roblox).toBeDefined();
    expect(roblox?.markdown).toContain('RemoteEvent');
    expect(roblox?.markdown).toContain('UpdateAsync');
    expect(roblox?.markdown).toContain('StreamingEnabled');
  });

  it('Mobile-Projekt: mobile_implementation enthält Touch-Hinweise, Roblox-Sektion nur Kurzhinweis', () => {
    const sections = generateGddSections(
      makeProject({ id: 'prj_mobile_fixture', platform: 'mobile', genre: 'roguelite', audience: 'teens_13_17' }),
      null,
    );
    const mobile = sections.find((s) => s.id === 'mobile_implementation');
    expect(mobile?.markdown).toMatch(/Touch/);
    const roblox = sections.find((s) => s.id === 'roblox_implementation');
    expect(roblox?.markdown).toContain('nicht Zielplattform');
    expect(roblox?.markdown).not.toContain('RemoteEvent');
  });

  it('Roblox-only-Projekt: mobile_implementation ist nur ein Kurzhinweis', () => {
    const sections = generateGddSections(makeProject({ platform: 'roblox' }), null);
    const mobile = sections.find((s) => s.id === 'mobile_implementation');
    expect(mobile?.markdown).toContain('nicht Zielplattform');
  });

  it('platform "both": beide Implementierungs-Sektionen sind substanziell', () => {
    const sections = generateGddSections(makeProject({ id: 'prj_both_fixture', platform: 'both' }), null);
    expect(sections.find((s) => s.id === 'roblox_implementation')?.markdown).toContain('RemoteEvent');
    expect(sections.find((s) => s.id === 'mobile_implementation')?.markdown).toMatch(/Touch/);
    const tech = sections.find((s) => s.id === 'technical_architecture');
    expect(tech?.markdown).toContain('Luau');
    expect(tech?.markdown).toContain('Godot');
  });

  it('monetization-Sektion enthält den Abschnitt "Faire Monetarisierung"', () => {
    const sections = generateGddSections(makeProject(), null);
    const monetization = sections.find((s) => s.id === 'monetization');
    expect(monetization?.markdown).toContain('Faire Monetarisierung');
    // Also present when the project has no monetization models at all:
    const noMoney = generateGddSections(makeProject({ id: 'prj_free', monetization: [] }), null);
    expect(noMoney.find((s) => s.id === 'monetization')?.markdown).toContain('Faire Monetarisierung');
  });

  it('nutzt die Idee: coreLoop, USP, Theme, Risiken und verbesserte Variante fließen ein', () => {
    const idea = makeIdea();
    const sections = generateGddSections(makeProject(), idea);
    const byId = new Map(sections.map((s) => [s.id, s.markdown]));

    expect(byId.get('core_loop')).toContain('Limonade brauen');
    expect(byId.get('overview')).toContain(idea.usp);
    expect(byId.get('story_setting')).toContain(idea.theme);
    expect(byId.get('mvp_scope')).toContain('Genre-Sättigung auf Roblox');
    expect(byId.get('full_release_scope')).toContain('Wolkenwerk Deluxe');
  });

  it('deckt jedes Genre ab: 21 nicht-leere Sektionen für alle Genres', () => {
    const genres: Genre[] = [
      'simulator', 'tycoon', 'obby', 'rpg_lite', 'survival', 'roguelite', 'idle',
      'hypercasual', 'hybridcasual', 'puzzle', 'tower_defense', 'battle_arena',
      'racing', 'horror', 'social_hangout', 'sandbox', 'card_battler', 'merge',
      'runner', 'sports',
    ];
    const platforms: TargetPlatform[] = ['roblox', 'mobile', 'both'];
    genres.forEach((genre, i) => {
      const platform = platforms[i % platforms.length] as TargetPlatform;
      const sections = generateGddSections(
        makeProject({ id: `prj_genre_${genre}`, genre, platform, multiplayer: i % 2 === 0 }),
        null,
      );
      expect(sections).toHaveLength(21);
      for (const section of sections) {
        expect(section.markdown.trim().length).toBeGreaterThan(30);
      }
    });
  });
});

describe('gddToMarkdown', () => {
  it('enthält Titelblock, alle Sektions-Titel und Trennlinien', () => {
    const project = makeProject();
    const sections = generateGddSections(project, null);
    const md = gddToMarkdown(sections, project.name);

    expect(md).toContain(`# ${project.name} – Game Design Document`);
    for (const id of ALL_SECTION_IDS) {
      expect(md).toContain(`## ${GDD_SECTION_TITLES[id]}`);
    }
    expect(md).toContain('\n---\n');
    // No date stamp / template placeholder:
    expect(md).not.toContain('{{DATE}}');
  });

  it('ist deterministisch fuer denselben Input', () => {
    const project = makeProject();
    const a = gddToMarkdown(generateGddSections(project, null), project.name);
    const b = gddToMarkdown(generateGddSections(project, null), project.name);
    expect(a).toBe(b);
  });
});
