import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Dashboard } from './screens/Dashboard';
import { IdeaLab } from './screens/IdeaLab';
import { NewProjectWizard } from './screens/NewProjectWizard';
import { Settings } from './screens/Settings';
import { ProjectLayout } from './screens/project/ProjectLayout';
import { ProjectOverview } from './screens/project/ProjectOverview';
import { GddView } from './screens/project/GddView';
import { TaskBoard } from './screens/project/TaskBoard';
import { CodeAgentView } from './screens/project/CodeAgentView';
import { FilesView } from './screens/project/FilesView';
import { RobloxView } from './screens/project/RobloxView';
import { MobileView } from './screens/project/MobileView';
import { ContentView } from './screens/project/ContentView';
import { AnalyticsView } from './screens/project/AnalyticsView';
import { ChecklistsView } from './screens/project/ChecklistsView';
import { ScoresView } from './screens/project/ScoresView';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="ideas" element={<IdeaLab />} />
        <Route path="projects/new" element={<NewProjectWizard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectOverview />} />
          <Route path="gdd" element={<GddView />} />
          <Route path="tasks" element={<TaskBoard />} />
          <Route path="agent" element={<CodeAgentView />} />
          <Route path="files" element={<FilesView />} />
          <Route path="roblox" element={<RobloxView />} />
          <Route path="mobile" element={<MobileView />} />
          <Route path="content" element={<ContentView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="checklists" element={<ChecklistsView />} />
          <Route path="scores" element={<ScoresView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
