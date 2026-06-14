import { useStore } from '../../store';
import { useActions } from '../../actions';
import { useGuard } from '../../hooks';
import { TaskCard } from '../TaskCard';

export function TasksView() {
  const { state } = useStore();
  const { createDraft } = useActions();
  const guard = useGuard();

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>全部任务</h2>
          <p>{state.tasks.length} 个任务</p>
        </div>
        <button className="primary" onClick={guard(createDraft)}>
          + 新任务
        </button>
      </div>
      {state.tasks.length ? (
        state.tasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <div className="notice">暂无任务。先打开目标网页录制一个。</div>
      )}
    </section>
  );
}
