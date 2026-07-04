import type { Checklist, ChecklistItem } from '../types/checklists';
import type { GameProject } from '../types/project';

/**
 * Curated, opinionated checklists. Content is the product here: every item
 * is a real gate teams forget in practice. `required: true` items block the
 * release readiness indicator in the UI.
 */

function item(
  id: string,
  title: string,
  detail: string,
  required: boolean,
  docsUrl?: string,
): ChecklistItem {
  return { id, title, detail, required, docsUrl };
}

export function getChecklistsForProject(project: GameProject): Checklist[] {
  const wantsRoblox = project.platform === 'roblox' || project.platform === 'both';
  const wantsMobile = project.platform === 'mobile' || project.platform === 'both';
  const kids = project.audience === 'kids_8_12' || project.audience === 'family';
  const hasAds =
    project.monetization.includes('rewarded_ads') ||
    project.monetization.includes('interstitial_ads');
  const lists: Checklist[] = [];

  // ---------------------------------------------------------------- release
  lists.push({
    kind: 'release',
    title: 'Release-Checkliste',
    description: 'Muss vollständig grün sein, bevor irgendetwas veröffentlicht wird.',
    platforms: ['roblox', 'mobile', 'both'],
    items: [
      item('rel_core_loop', 'Core Loop 30 Minuten am Stück getestet', 'Eine ununterbrochene Session ohne Crash, Softlock oder Sackgasse.', true),
      item('rel_first_minute', 'Erste Minute geprüft', 'Neuer Spieler erlebt die Kernbelohnung in unter 60 Sekunden.', true),
      item('rel_save', 'Save/Load robust', 'Fortschritt übersteht Neustart, Abbruch mitten in der Session und (bei Online-Speicher) Doppel-Login.', true),
      item('rel_balancing', 'Balancing-Pass gegen echte Daten', 'Mindestens ein Playtest-Durchgang; größte Frustrations- und Langeweile-Spitze behoben.', false),
      item('rel_performance', 'Performance auf Ziel-Hardware', 'FPS-Ziel auf dem schwächsten unterstützten Gerät gehalten.', true),
      item('rel_backup', 'Projekt-Backup erstellt', 'Vollständige Kopie des Projektstands außerhalb des Arbeitsrechners (Git-Remote zählt).', true),
      item('rel_version', 'Version + Changelog gepflegt', 'Versionsnummer erhöht, Änderungen im Changelog festgehalten, Git-Tag gesetzt.', false),
      item('rel_analytics', 'Analytics-Events verifiziert', 'Kern-Events (Tutorial, Session, Käufe) feuern nachweislich in einer Testsession.', false),
    ],
  });

  // ------------------------------------------------------ roblox publishing
  if (wantsRoblox) {
    lists.push({
      kind: 'roblox_publishing',
      title: 'Roblox-Publishing-Checkliste',
      description: 'Offizieller Open-Cloud-Workflow - kein Cookie-Login, keine Abkürzungen.',
      platforms: ['roblox', 'both'],
      items: [
        item('rbx_ids', 'Universe ID + Place ID konfiguriert', 'Im Roblox-Tab hinterlegt und per Verbindungstest geprüft.', true, 'https://create.roblox.com/docs/cloud/open-cloud'),
        item('rbx_api_key_scoped', 'API-Key mit minimalem Scope', 'Open-Cloud-Key nur mit universe-places:write, beschränkt auf dieses Universe; verschlüsselt in der App gespeichert.', true, 'https://create.roblox.com/docs/cloud/auth/api-keys'),
        item('rbx_build', 'Rojo-Build erfolgreich', 'rojo build erzeugt eine aktuelle Place-Datei ohne Fehler.', true, 'https://rojo.space/docs/'),
        item('rbx_validation', 'Projektvalidierung ohne Errors', 'Validierung im Roblox-Tab: keine Errors (Warnings bewusst abgewogen).', true),
        item('rbx_dry_run', 'Dry-Run erfolgreich', 'Simulierte Veröffentlichung über die App ohne Beanstandung.', true),
        item('rbx_icon', 'Icon 512x512 + Thumbnails', 'Eigenes Icon und mindestens 2 Thumbnails im Creator Dashboard hochgeladen.', true, 'https://create.roblox.com/docs/production/publishing/publish-experiences-and-places'),
        item('rbx_questionnaire', 'Experience-Fragebogen ausgefüllt', 'Altersempfehlungs-Fragebogen wahrheitsgemäß beantwortet.', true, 'https://create.roblox.com/docs/production/promotion/experience-guidelines'),
        item('rbx_community', 'Community-Standards geprüft', 'Keine fremde IP, kein Glücksspiel für Minderjährige, keine irreführenden Inhalte.', true, 'https://en.help.roblox.com/hc/en-us/articles/203313410'),
        item('rbx_monetization_setup', 'Monetarisierung konfiguriert', 'Game Passes / Developer Products angelegt, IDs in der Shop-Konfiguration eingetragen, Testkauf durchgeführt.', false),
        item('rbx_datastore_limits', 'DataStore-Limits bedacht', 'Request-Budgets und Fehlerpfade geprüft; Autosave-Intervall respektiert Limits.', false, 'https://create.roblox.com/docs/cloud-services/data-stores'),
        item('rbx_streaming', 'Private Testrunde absolviert', 'Mit Freunden/Testern im privaten Server gespielt, bevor die Experience öffentlich wird.', false),
      ],
    });
  }

  // ------------------------------------------------------------- app store
  if (wantsMobile) {
    lists.push({
      kind: 'app_store',
      title: 'App-Store-Checkliste (Android zuerst)',
      description: 'Für den Google-Play-Release; iOS folgt in einer späteren Version.',
      platforms: ['mobile', 'both'],
      items: [
        item('store_package_id', 'Package-ID final', 'Reverse-Domain-ID (z.B. com.studio.spiel) - nach dem ersten Upload nicht mehr änderbar.', true),
        item('store_signing', 'Signing-Key sicher verwahrt', 'Keystore erzeugt, Passwörter im Passwortmanager, KEINE Kopie im Repo.', true, 'https://developer.android.com/studio/publish/app-signing'),
        item('store_target_audience', 'Zielgruppen-Deklaration korrekt', 'Zielgruppe im Play-Console-Fragebogen; bei Kindern: Families-Policy-Anforderungen erfüllt.', true, 'https://support.google.com/googleplay/android-developer/answer/9893335'),
        item('store_listing', 'Store-Listing vollständig', 'Titel, Kurz-/Langbeschreibung, Screenshots (Telefon + 7"/10"-Tablet), Feature-Grafik.', true),
        item('store_content_rating', 'Content-Rating-Fragebogen', 'IARC-Fragebogen wahrheitsgemäß ausgefüllt.', true, 'https://support.google.com/googleplay/android-developer/answer/9859655'),
        item('store_ads_declared', 'Werbung deklariert', hasAds ? 'App enthält Ads - in der Play Console deklarieren und Ads-Kennzeichnung prüfen.' : 'Keine Ads eingeplant - Deklaration entsprechend auf "keine Werbung" setzen.', hasAds),
        item('store_iap_declared', 'In-App-Käufe deklariert', 'Alle IAPs mit korrekten Preisen angelegt; Testkäufe über Lizenztester durchgeführt.', project.monetization.some((m) => m.startsWith('iap') || m === 'battle_pass' || m === 'cosmetics')),
        item('store_devices', 'Test auf 3 Geräteklassen', 'Low-End, Mittelklasse und aktuelles Gerät; Kaltstart und erste Session je geprüft.', true),
        item('store_size', 'Download-Größe geprüft', 'AAB-Größe gegen das Performance-Budget; Assets komprimiert.', false),
        item('store_prelaunch', 'Pre-Launch-Report ausgewertet', 'Play-Console-Prelaunch-Report auf Crashes und Zugänglichkeitsprobleme geprüft.', false),
      ],
    });
  }

  // ---------------------------------------------------------------- privacy
  lists.push({
    kind: 'privacy',
    title: 'Datenschutz-Checkliste',
    description: 'Datenminimierung ist der Standard - alles andere braucht einen Grund.',
    platforms: ['roblox', 'mobile', 'both'],
    items: [
      item('priv_minimize', 'Datenminimierung geprüft', 'Nur Daten erheben, die eine konkrete Design-Entscheidung informieren; Analytics-Plan dahingehend geprüft.', true),
      item('priv_policy', 'Datenschutzerklärung erreichbar', wantsMobile ? 'URL erstellt und im Store-Eintrag + in den Spieleinstellungen verlinkt.' : 'Beschreibungstext/Verlinkung gemäß Plattformanforderungen.', wantsMobile),
      item('priv_anonymous', 'Analytics anonymisiert', 'Keine Klarnamen, keine genauen Standorte; IDs pseudonymisiert.', true),
      ...(kids
        ? [
            item('priv_coppa', 'COPPA/GDPR-K beachtet', 'Kinder-Zielgruppe: keine personalisierte Werbung, keine Werbe-IDs, kein Tracking über Apps hinweg, ggf. Einwilligungs-Konzept.', true, 'https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy'),
            item('priv_no_ad_ids', 'Keine Werbe-IDs bei Kinder-App', 'AD_ID-Permission entfernt bzw. nie angefragt; SDKs auf Kinderkonformität geprüft.', true),
          ]
        : []),
      item('priv_deletion', 'Löschkonzept vorhanden', 'Spieler können ihre gespeicherten Daten löschen lassen (Support-Weg dokumentiert).', false),
    ],
  });

  // ----------------------------------------------------- monetization ethics
  lists.push({
    kind: 'monetization_ethics',
    title: 'Faire Monetarisierung',
    description: 'Bindung durch Qualität statt Ausbeutung - schützt Spieler UND Bewertungen.',
    platforms: ['roblox', 'mobile', 'both'],
    items: [
      item('fair_no_p2w_kids', 'Kein Pay-to-Win' + (kids ? ' (Kinder-Zielgruppe: Pflicht)' : ''), 'Käufe sind Selbstausdruck, Komfort oder Tempo - nie exklusive Macht im Wettbewerb.', kids),
      item('fair_prices', 'Preise transparent', 'Jeder Kauf zeigt vor Bestätigung klar, was man erhält; keine verschleierten Zwischenwährungs-Tricks.', true),
      item('fair_no_fomo', 'Keine manipulativen Timer', 'Keine irreführenden Countdown-Angebote; Events mit Nachhol-Möglichkeit statt Verlustangst.', true),
      item('fair_random', 'Zufallskäufe fair geregelt', kids ? 'Kinder-Zielgruppe: keinerlei zufällige Käufe für Echtgeld.' : 'Wahrscheinlichkeiten einsehbar; Pity-System vorhanden; nie ausschließlich über Echtgeld.', true),
      item('fair_energy', 'Energy-System fair (falls vorhanden)', 'Kein harter Paywall-Block: es gibt immer etwas Sinnvolles gratis zu tun.', false),
      item('fair_spend_limits', 'Ausgaben-Bewusstsein', 'Kaufhistorie einsehbar; bei Kinder-Zielgruppe Hinweis auf Eltern-Freigaben.', false),
    ],
  });

  return lists;
}
