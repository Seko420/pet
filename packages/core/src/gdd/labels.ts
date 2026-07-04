import type { ArtStyle, Audience, QualityTarget, RiskLevel, TargetPlatform } from '../types/common';

/**
 * German display labels that are needed by the GDD generator but do not
 * exist in the shared type module. Kept local to the gdd module on purpose -
 * the shared label maps in types/common stay the single source of truth for
 * everything they already cover.
 */

export const PLATFORM_LABELS_DE: Record<TargetPlatform, string> = {
  roblox: 'Roblox',
  mobile: 'Mobile (Android zuerst)',
  both: 'Roblox + Mobile',
};

export const ART_STYLE_LABELS_DE: Record<ArtStyle, string> = {
  low_poly: 'Low Poly',
  stylized_cartoon: 'Stilisierter Cartoon',
  voxel: 'Voxel',
  flat_2d: 'Flat 2D',
  pixel_art: 'Pixel Art',
  semi_realistic: 'Semi-realistisch',
  minimalist: 'Minimalistisch',
  hand_drawn: 'Handgezeichnet',
};

export const QUALITY_TARGET_LABELS_DE: Record<QualityTarget, string> = {
  prototype: 'Prototyp (schnell validieren)',
  polished: 'Poliert (veröffentlichungsreif)',
  premium: 'Premium (Genre-Spitze)',
};

export const RISK_LEVEL_LABELS_DE: Record<RiskLevel, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

/** How the art style translates into UI / readability guidance. */
export const ART_STYLE_UI_NOTES: Record<ArtStyle, string> = {
  low_poly:
    'Klare Flächenfarben und harte Kanten: UI nimmt die Facetten-Optik auf, Icons als flache Silhouetten mit einem Akzentwinkel.',
  stylized_cartoon:
    'Runde Formen, dicke Outlines, satte Farben: UI-Elemente dürfen bouncen (Squash & Stretch), Buttons wirken "drückbar".',
  voxel:
    'Würfel-Raster als Gestaltungsprinzip: UI-Rahmen und Icons aus Pixel-/Voxel-Bausteinen, keine weichen Verläufe.',
  flat_2d:
    'Flaches, plakatives Design: wenige Ebenen, starke Kontraste, Typografie trägt die Hierarchie.',
  pixel_art:
    'Konsistente Pixeldichte auch in der UI: Bitmap-Schrift oder pixel-freundliche Fonts, kein Mischmasch aus Auflösungen.',
  semi_realistic:
    'Zurückhaltende, hochwertige UI: dünne Linien, dezente Transparenzen, Material-Anmutung statt Comic-Knallfarben.',
  minimalist:
    'Reduktion als Feature: maximal zwei Akzentfarben, viel Weißraum, jede Anzeige muss ihre Existenz rechtfertigen.',
  hand_drawn:
    'Skizzenhafte Linien und Papiertexturen: UI wie aus dem Notizbuch, leichte Unregelmäßigkeit macht den Charme aus.',
};

/** Tone-of-voice and safety guidance per audience. */
export const AUDIENCE_TONE_NOTES: Record<Audience, string> = {
  kids_8_12:
    'Hell, freundlich, humorvoll; keine expliziten Gewaltdarstellungen, klare Symbole statt Textwände, alle Texte einfach lesbar.',
  teens_13_17:
    'Energiegeladen und selbstironisch; Wettbewerb und Selbstausdruck stehen im Vordergrund, Memes ja, Zynismus nein.',
  young_adults_18_24:
    'Stilbewusst und direkt; darf fordern und überraschen, Referenzen an Netzkultur funktionieren, Grind ohne Sinn nicht.',
  adults_25_plus:
    'Respektiert die Zeit der Spielenden: klare Ziele, kurze Sessions möglich, Tiefe optional statt verpflichtend.',
  family:
    'Gemeinsam spielbar von 6 bis 60: intuitive Steuerung, keine Angst-Momente, Fortschritt auch für ungeduldige Mitspieler.',
  core_gamers:
    'Systemtiefe und Meisterbarkeit zählen: ehrliche Schwierigkeit, transparente Werte, Theorycrafting ausdrücklich erwünscht.',
  casual_broad:
    'Sofort verständlich ohne Anleitung: eine Kernaktion, großzügiges Feedback, Fehler kosten nie mehr als eine Minute.',
};
