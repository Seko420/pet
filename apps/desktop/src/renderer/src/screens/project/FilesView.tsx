import React, { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight, FileCode2, FileText, Folder, FolderOpen, RefreshCw, Save } from 'lucide-react';
import type { FileContent, FileNode } from '@shared/ipc';
import { api } from '../../lib/api';
import '../../lib/monaco';
import { monaco } from '../../lib/monaco';
import { Badge, Card, EmptyState, ErrorNote, SectionTitle, Spinner } from '../../components/ui';
import { useConfirm } from '../../components/ConfirmDialog';
import { useProject } from './projectContext';

function FileIcon({ name }: { name: string }): React.JSX.Element {
  if (/\.(luau|lua|gd|ts|tsx|js)$/.test(name)) return <FileCode2 className="h-3.5 w-3.5 text-forge-300" />;
  return <FileText className="h-3.5 w-3.5 text-mist-400" />;
}

function TreeNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(depth < 2);
  const pad = { paddingLeft: `${depth * 14 + 8}px` };

  if (node.kind === 'directory') {
    return (
      <div>
        <button
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm text-mist-300 hover:bg-ink-700"
          style={pad}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-warn" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-warn" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open
          ? node.children?.map((child) => (
              <TreeNode key={child.path} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))
          : null}
      </div>
    );
  }
  return (
    <button
      className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm hover:bg-ink-700 ${
        selected === node.path ? 'bg-forge-500/15 text-forge-300' : 'text-mist-300'
      }`}
      style={{ paddingLeft: `${depth * 14 + 26}px` }}
      onClick={() => onSelect(node.path)}
    >
      <FileIcon name={node.name} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FilesView(): React.JSX.Element {
  const { project } = useProject();
  const confirmDialog = useConfirm();
  const [tree, setTree] = useState<FileNode | null | 'loading'>('loading');
  const [file, setFile] = useState<FileContent | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTree = useCallback((): void => {
    api
      .invoke('files:tree', { projectId: project.id })
      .then((loaded) => setTree(loaded))
      .catch((err: Error) => {
        setError(err.message);
        setTree(null);
      });
  }, [project.id]);
  useEffect(loadTree, [loadTree]);

  const openFile = async (path: string): Promise<void> => {
    if (dirty) {
      const ok = await confirmDialog({
        title: 'Ungespeicherte Änderungen verwerfen?',
        message: 'Deine Änderungen an der aktuellen Datei gehen verloren.',
        confirmLabel: 'Verwerfen',
        danger: true,
      });
      if (!ok) return;
    }
    setError(null);
    try {
      const loaded = await api.invoke('files:read', { projectId: project.id, path });
      setFile(loaded);
      setContent(loaded.content);
      setDirty(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const save = useCallback(async (): Promise<void> => {
    if (!file || file.readOnly) return;
    setSaving(true);
    try {
      await api.invoke('files:write', { projectId: project.id, path: file.path, content });
      setDirty(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [file, content, project.id]);

  // Keep the latest save() reachable from the Monaco Ctrl+S command.
  const saveRef = React.useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  if (tree === 'loading') return <Spinner label="Lade Dateibaum…" />;

  if (!tree) {
    return (
      <div className="space-y-4">
        {error ? <ErrorNote message={error} /> : null}
        <EmptyState
          icon={<Folder className="h-10 w-10" />}
          title="Kein Projektordner"
          description="Erzeuge zuerst den Projektordner in der Übersicht - danach kannst du hier alle Dateien durchsuchen und bearbeiten."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Dateien"
        subtitle={project.workspacePath ?? ''}
        actions={
          <button className="btn-secondary" onClick={loadTree}>
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </button>
        }
      />
      {error ? <ErrorNote message={error} /> : null}

      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-2">
          {tree.children && tree.children.length > 0 ? (
            tree.children.map((child) => <TreeNode key={child.path} node={child} depth={0} selected={file?.path ?? null} onSelect={(p) => void openFile(p)} />)
          ) : (
            <p className="p-3 text-sm text-mist-500">Ordner ist leer. Generiere z.B. das Roblox- oder Godot-Projekt.</p>
          )}
        </Card>

        <Card className="flex min-h-[70vh] flex-col p-0">
          {file ? (
            <>
              <div className="flex items-center gap-2 border-b border-ink-600 px-3 py-2">
                <code className="truncate text-xs text-mist-300">{file.path}</code>
                {dirty ? <span className="h-2 w-2 rounded-full bg-warn" title="Ungespeicherte Änderungen" /> : null}
                {file.readOnly ? <Badge tone="warn">schreibgeschützt</Badge> : null}
                <button className="btn-primary ml-auto px-3 py-1 text-xs" onClick={() => void save()} disabled={!dirty || saving || file.readOnly}>
                  <Save className="h-3.5 w-3.5" /> {saving ? 'Speichere…' : 'Speichern (Strg+S)'}
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  path={file.path}
                  language={file.language}
                  value={content}
                  options={{
                    readOnly: file.readOnly,
                    minimap: { enabled: false },
                    fontSize: 13,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                  onChange={(value) => {
                    setContent(value ?? '');
                    setDirty(true);
                  }}
                  onMount={(editor) => {
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                      void saveRef.current();
                    });
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-mist-500">Datei im Baum auswählen</div>
          )}
        </Card>
      </div>
    </div>
  );
}
