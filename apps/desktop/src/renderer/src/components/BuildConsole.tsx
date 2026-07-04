import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

interface ConsoleLine {
  stream: 'stdout' | 'stderr' | 'info' | 'exit';
  text: string;
}

/**
 * Live build console: subscribes to build events for one project and
 * renders a terminal-style log with autoscroll.
 */
export function BuildConsole({ projectId }: { projectId: string }): React.JSX.Element {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const offOutput = api.on('event:buildOutput', (event) => {
      if (event.projectId !== projectId) return;
      setLines((prev) => [...prev.slice(-500), { stream: event.stream, text: event.line }]);
    });
    const offExit = api.on('event:buildExit', (event) => {
      if (event.projectId !== projectId) return;
      setLines((prev) => [
        ...prev.slice(-500),
        { stream: 'exit', text: `${event.ok ? '✔' : '✖'} ${event.summary} (Exit-Code: ${event.exitCode ?? '-'})` },
      ]);
    });
    return () => {
      offOutput();
      offExit();
    };
  }, [projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <pre className="max-h-64 min-h-24 overflow-y-auto rounded-lg bg-ink-950 p-3 font-mono text-xs leading-relaxed">
      {lines.length === 0 ? <span className="text-mist-500">Noch keine Ausgabe - starte einen Build oder eine Validierung.</span> : null}
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.stream === 'stderr' ? 'text-bad' : line.stream === 'info' ? 'text-forge-300' : line.stream === 'exit' ? 'font-semibold text-mist-100' : 'text-mist-300'
          }
        >
          {line.text}
        </div>
      ))}
      <div ref={endRef} />
    </pre>
  );
}
