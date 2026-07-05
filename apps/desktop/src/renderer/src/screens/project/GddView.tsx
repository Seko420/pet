import React, { useEffect, useState } from 'react';
import { Download, FileText, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import type { GddDocument, GddSectionId } from '@egf/core';
import { GDD_SECTION_TITLES } from '@egf/core';
import { api } from '../../lib/api';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '../../components/ui';
import { renderMarkdown } from '../../components/Markdown';
import { useProject } from './projectContext';

export function GddView(): React.JSX.Element {
  const { project } = useProject();
  const [doc, setDoc] = useState<GddDocument | null | 'loading'>('loading');
  const [activeId, setActiveId] = useState<GddSectionId>('overview');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .invoke('gdd:getForProject', { projectId: project.id })
      .then((loaded) => setDoc(loaded))
      .catch((err: Error) => {
        setError(err.message);
        setDoc(null);
      });
  }, [project.id]);

  const generate = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const generated = await api.invoke('gdd:generate', { projectId: project.id });
      setDoc(generated);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportMarkdown = async (): Promise<void> => {
    try {
      const { path } = await api.invoke('gdd:exportMarkdown', { projectId: project.id });
      setNote(`GDD exportiert: ${path}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveSection = async (): Promise<void> => {
    if (doc === 'loading' || !doc) return;
    try {
      const updated = await api.invoke('gdd:saveSection', { projectId: project.id, sectionId: activeId, markdown: draft });
      setDoc(updated);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const improveSection = async (): Promise<void> => {
    if (doc === 'loading' || !doc) return;
    if (!window.confirm('Diese Sektion mit KI überarbeiten? Der aktuelle Text der Sektion wird ersetzt (verursacht bei Cloud-Anbietern API-Kosten).')) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.invoke('gdd:improveSection', { projectId: project.id, sectionId: activeId });
      setDoc(updated);
      setNote('Sektion mit KI überarbeitet.');
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (doc === 'loading') return <Spinner label="Lade GDD…" />;

  if (!doc) {
    return (
      <div className="space-y-4">
        {error ? <ErrorNote message={error} /> : null}
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Noch kein Game Design Document"
          description="Generiert alle 21 Sektionen - von Spielübersicht über Economy und Balancing bis zum Full-Release-Scope, zugeschnitten auf Genre und Plattform."
          action={
            <button className="btn-primary" onClick={() => void generate()} disabled={busy}>
              {busy ? 'Generiere…' : 'GDD generieren'}
            </button>
          }
        />
      </div>
    );
  }

  const activeSection = doc.sections.find((s) => s.id === activeId) ?? doc.sections[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Version {doc.version}</Badge>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary" onClick={() => void exportMarkdown()}>
            <Download className="h-4 w-4" /> Als Markdown exportieren
          </button>
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={() => {
              if (window.confirm('GDD neu generieren? Manuelle Änderungen an allen Sektionen werden überschrieben.')) void generate();
            }}
          >
            <RefreshCw className="h-4 w-4" /> Neu generieren
          </button>
        </div>
      </div>
      {error ? <ErrorNote message={error} /> : null}
      {note ? <div className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">{note}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-2">
          <nav className="max-h-[65vh] space-y-0.5 overflow-y-auto">
            {doc.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveId(section.id);
                  setEditing(false);
                }}
                className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  section.id === (activeSection?.id ?? '') ? 'bg-forge-500/15 font-medium text-forge-300' : 'text-mist-300 hover:bg-ink-700'
                }`}
              >
                {GDD_SECTION_TITLES[section.id]}
              </button>
            ))}
          </nav>
        </Card>

        <Card className="min-h-96">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-ink-600 pb-3">
            <h3 className="text-lg font-semibold text-mist-50">{activeSection ? GDD_SECTION_TITLES[activeSection.id] : ''}</h3>
            {!editing ? (
              <div className="flex gap-1">
                <button className="btn-ghost" onClick={() => void improveSection()} disabled={busy} title="Sektion durch die konfigurierte KI verbessern lassen">
                  <Sparkles className="h-4 w-4" /> {busy ? 'KI arbeitet…' : 'Mit KI verbessern'}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setDraft(activeSection?.markdown ?? '');
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Bearbeiten
                </button>
              </div>
            ) : null}
          </div>
          {editing ? (
            <div className="space-y-3">
              <textarea className="input min-h-96 font-mono text-xs leading-relaxed" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => void saveSection()}>
                  Speichern
                </button>
                <button className="btn-ghost" onClick={() => setEditing(false)}>
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div
              className="max-h-[65vh] overflow-y-auto text-sm leading-relaxed text-mist-200"
              // Safe: renderMarkdown escapes all HTML before building its own tags.
              dangerouslySetInnerHTML={{ __html: renderMarkdown(activeSection?.markdown ?? '') }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
