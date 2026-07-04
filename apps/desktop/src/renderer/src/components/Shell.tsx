import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Gamepad2, Hammer, Lightbulb, LayoutDashboard, Plus, Settings } from 'lucide-react';
import { api } from '../lib/api';
import type { AiStatusInfo } from '@shared/ipc';

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}): React.JSX.Element {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-forge-500/15 text-forge-300'
            : 'text-mist-300 hover:bg-ink-700 hover:text-mist-100'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * App shell: fixed sidebar + scrollable content area.
 * Project-specific navigation lives in ProjectLayout, not here.
 */
export function Shell(): React.JSX.Element {
  const [ai, setAi] = useState<AiStatusInfo | null>(null);

  useEffect(() => {
    api.invoke('ai:status', undefined).then(setAi).catch(() => setAi(null));
  }, []);

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-600 bg-ink-850">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forge-500 shadow-glow">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-mist-50">Empire Game Forge</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-forge-300">
              AI Studio
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <NavItem to="/" end icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <NavItem to="/ideas" icon={<Lightbulb className="h-4 w-4" />} label="Idea Lab" />
          <NavItem
            to="/projects/new"
            icon={<Plus className="h-4 w-4" />}
            label="Neues Projekt"
          />
          <div className="flex-1" />
          <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Einstellungen" />
        </nav>

        <div className="border-t border-ink-600 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-mist-400">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>
              KI:{' '}
              {ai
                ? ai.configured
                  ? `${ai.model}`
                  : 'Mock-Modus (offline)'
                : 'lädt…'}
            </span>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
