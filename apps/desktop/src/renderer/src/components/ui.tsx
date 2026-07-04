import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shared UI primitives. Every screen builds on these so the whole app
 * keeps one visual language. Styling lives in styles/index.css (.panel,
 * .btn-*, .input, .badge) + tailwind tokens (ink/mist/forge).
 */

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`panel p-4 ${onClick ? 'cursor-pointer transition-colors hover:border-ink-400' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-mist-50">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-mist-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-ink-600 text-mist-200',
  accent: 'bg-forge-500/15 text-forge-300 ring-1 ring-inset ring-forge-500/30',
  good: 'bg-good/10 text-good ring-1 ring-inset ring-good/30',
  warn: 'bg-warn/10 text-warn ring-1 ring-inset ring-warn/30',
  bad: 'bg-bad/10 text-bad ring-1 ring-inset ring-bad/30',
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}): React.JSX.Element {
  return <span className={`badge ${badgeTones[tone]}`}>{children}</span>;
}

export function Spinner({ label }: { label?: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-mist-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="text-mist-400">{icon}</div> : null}
      <div>
        <p className="font-medium text-mist-100">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-md text-sm text-mist-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function scoreTone(value: number): BadgeTone {
  if (value >= 70) return 'good';
  if (value >= 45) return 'warn';
  return 'bad';
}

export function ScoreBar({
  label,
  value,
  reason,
}: {
  label: string;
  value: number;
  reason?: string;
}): React.JSX.Element {
  const tone = scoreTone(value);
  const barColor = tone === 'good' ? 'bg-good' : tone === 'warn' ? 'bg-warn' : 'bg-bad';
  return (
    <div title={reason}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-mist-300">{label}</span>
        <span className="font-mono text-mist-100">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
      {message}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-mist-400">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-mist-500">{hint}</span> : null}
    </label>
  );
}
