import type { RunStatus, Task } from '../../types';
import { useStore } from '../store';
import { useActions } from '../actions';
import { useGuard } from '../hooks';
import { fileName, formatTime, scheduleLabel, shortUrl } from '../lib/format';
import { Badge } from './Badge';

export function TaskCard({ task }: { task: Task }) {
  const { state } = useStore();
  const { runTask, editTask, toggleTask } = useActions();
  const guard = useGuard();

  const log = state.logs.find((l) => l.taskId === task.id) || null;
  const status: RunStatus = log?.status || (task.enabled === false ? 'paused' : 'idle');
  const file = fileName(log?.downloadedFiles?.[0]?.filename) || '—';

  return (
    <article className="task-card">
      <div className="task-card-head">
        <div>
          <h3 className="task-name">{task.name}</h3>
          <div className="task-url">{shortUrl(task.startUrl)}</div>
        </div>
        <Badge status={status} />
      </div>
      <div className="task-meta">
        <div className="meta">
          <span>触发方式</span>
          <strong>{scheduleLabel(task.schedule)}</strong>
        </div>
        <div className="meta">
          <span>步骤</span>
          <strong>{task.steps?.length || 0} 步</strong>
        </div>
        <div className="meta">
          <span>最近执行</span>
          <strong>{formatTime(log?.startedAt)}</strong>
        </div>
        <div className="meta">
          <span>最近文件</span>
          <strong>{file}</strong>
        </div>
      </div>
      <div className="task-actions">
        <button className="soft" onClick={guard(() => runTask(task.id))}>
          立即运行
        </button>
        <button className="secondary" onClick={guard(() => editTask(task.id))}>
          编辑
        </button>
        <button className="ghost" onClick={guard(() => toggleTask(task.id))}>
          {task.enabled === false ? '启用' : '暂停'}
        </button>
      </div>
    </article>
  );
}
