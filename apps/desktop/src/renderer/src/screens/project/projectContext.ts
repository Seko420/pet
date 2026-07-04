import React from 'react';
import type { GameProject } from '@egf/core';

export interface ProjectContextValue {
  project: GameProject;
  refresh: () => Promise<void>;
}

export const ProjectContext = React.createContext<ProjectContextValue | null>(null);

export function useProject(): ProjectContextValue {
  const value = React.useContext(ProjectContext);
  if (!value) throw new Error('useProject() muss innerhalb von ProjectLayout verwendet werden.');
  return value;
}
