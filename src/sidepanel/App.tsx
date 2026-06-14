import { useStore } from './store';
import { useGuard } from './hooks';
import { Hero } from './components/Hero';
import { Tabs } from './components/Tabs';
import { Toast } from './components/Toast';
import { TodayView } from './components/views/TodayView';
import { BuilderView } from './components/views/BuilderView';
import { TasksView } from './components/views/TasksView';
import { LogsView } from './components/views/LogsView';
import { PermissionsView } from './components/views/PermissionsView';
import { SettingsView } from './components/views/SettingsView';

export function App() {
  const { view, refresh } = useStore();
  const guard = useGuard();

  return (
    <>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            <div className="logo">W</div>
            <div>
              <h1>WebLoop</h1>
              <p>录一次，自动填表、筛选、下载和通知。</p>
            </div>
          </div>
          <button className="icon-btn" title="刷新" onClick={guard(() => refresh())}>
            ↻
          </button>
        </header>

        <Hero />
        <Tabs />

        {view === 'today' && <TodayView />}
        {view === 'builder' && <BuilderView />}
        {view === 'tasks' && <TasksView />}
        {view === 'logs' && <LogsView />}
        {view === 'permissions' && <PermissionsView />}
        {view === 'settings' && <SettingsView />}
      </main>
      <Toast />
    </>
  );
}
