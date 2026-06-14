import { useStore, type ViewId } from '../store';

const TABS: Array<{ id: ViewId; label: string }> = [
  { id: 'today', label: '今日' },
  { id: 'builder', label: '录制' },
  { id: 'tasks', label: '任务' },
  { id: 'logs', label: '日志' },
  { id: 'permissions', label: '权限' },
  { id: 'settings', label: '设置' }
];

export function Tabs() {
  const { view, setView } = useStore();
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab${view === t.id ? ' active' : ''}`}
          onClick={() => setView(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
