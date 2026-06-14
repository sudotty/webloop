import { useStore } from '../store';

export function Hero() {
  const { state } = useStore();
  const { recording, logs, tasks, draft } = state;

  const running = logs.find((l) => l.status === 'running');
  const failed = logs.find((l) => l.status === 'failed' || l.status === 'blocked');

  let dotClass = 'pulse-dot';
  let title = '准备就绪';
  let sub = '打开目标网页后开始录制，即可自动填表、筛选、下载。';

  if (recording?.active) {
    dotClass = 'pulse-dot running';
    title = '正在自动录制';
    sub = `已记录 ${draft?.steps?.length || 0} 步。回到网页真实操作即可。`;
  } else if (running) {
    dotClass = 'pulse-dot running';
    title = '任务正在执行';
    sub = `${running.taskName || '下载任务'}：${running.currentStepLabel || '准备中'}`;
  } else if (failed) {
    dotClass = `pulse-dot ${failed.status === 'blocked' ? 'blocked' : 'failed'}`;
    title = '最近任务需要处理';
    sub = `${failed.taskName || '下载任务'}：${failed.error || '执行失败'}`;
  } else if (tasks.length) {
    title = '任务已就绪';
    sub = `${tasks.filter((t) => t.enabled !== false).length} 个启用任务。`;
  }

  return (
    <section className="status-hero">
      <div className={dotClass} />
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
    </section>
  );
}
