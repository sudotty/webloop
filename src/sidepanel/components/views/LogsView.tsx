import type { RunLog } from '../../../types';
import { useStore } from '../../store';
import { useActions } from '../../actions';
import { useGuard } from '../../hooks';
import { fileName, formatTime } from '../../lib/format';
import { Badge } from '../Badge';

function LogItem({ log }: { log: RunLog }) {
  const file = fileName(log.downloadedFiles?.[0]?.filename);
  const shots = (log.screenshots || []).map((s) => fileName(s.filename)).filter(Boolean).join('，');
  return (
    <div className="log">
      <div className="log-head">
        <div>
          <div className="log-title">{log.taskName || '下载任务'}</div>
          <div className="log-sub">
            {formatTime(log.startedAt)} · {log.currentStepLabel || ''}
          </div>
        </div>
        <Badge status={log.status} />
      </div>
      {file && <div className="log-sub">文件：{file}</div>}
      {shots && <div className="log-sub">截图：{shots}</div>}
      {log.error && <div className="log-error">{log.error}</div>}
      {log.advice && <div className="notice warn">建议：{log.advice}</div>}
      {log.stepLogs?.length ? (
        <details className="collapsible">
          <summary>查看步骤明细</summary>
          <div className="divider" />
          {log.stepLogs.map((s, i) => (
            <div className="small" key={i}>
              {i + 1}. {s.label || s.action}：{s.status}
              {s.error ? ` · ${s.error}` : ''}
            </div>
          ))}
        </details>
      ) : null}
    </div>
  );
}

export function LogsView() {
  const { state } = useStore();
  const { clearLogs } = useActions();
  const guard = useGuard();

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>执行日志</h2>
          <p>最近 {state.logs.length} 条。失败时看这里最有用。</p>
        </div>
        <button className="ghost" onClick={guard(clearLogs)}>
          清空
        </button>
      </div>
      {state.logs.length ? (
        state.logs.map((log, i) => <LogItem key={i} log={log} />)
      ) : (
        <div className="notice">还没有执行记录。</div>
      )}
    </section>
  );
}
