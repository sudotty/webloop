import { useStore } from '../../store';
import { useActions } from '../../actions';
import { useGuard } from '../../hooks';
import { TaskCard } from '../TaskCard';

export function TodayView() {
  const { state } = useStore();
  const { createDraft } = useActions();
  const guard = useGuard();

  if (!state.tasks.length) {
    return (
      <section className="view active">
        <div className="empty-card">
          <div className="empty-icon">⬇</div>
          <h2>创建第一个自动任务</h2>
          <p>打开目标网页，录制一次真实操作。以后可以自动填条件、查询、下载或提交，并在完成后通知。</p>
          <button className="primary wide" onClick={guard(createDraft)}>
            开始录制当前页面
          </button>
        </div>
      </section>
    );
  }

  const enabled = state.tasks.filter((t) => t.enabled !== false);
  const todayKey = new Date().toDateString();
  const todaySuccess = state.logs.filter(
    (l) => l.status === 'success' && l.startedAt && new Date(l.startedAt).toDateString() === todayKey
  ).length;

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>今日任务</h2>
          <p>
            {todaySuccess}/{enabled.length} 个启用任务今日完成
          </p>
        </div>
        <button className="primary" onClick={guard(createDraft)}>
          + 录制
        </button>
      </div>
      {state.tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </section>
  );
}
