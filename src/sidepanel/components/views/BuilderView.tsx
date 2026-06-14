import { useEffect, useRef, useState } from 'react';
import type { Draft, ScheduleType, Step } from '../../../types';
import { useStore } from '../../store';
import { useActions } from '../../actions';
import { useGuard } from '../../hooks';
import { shortUrl } from '../../lib/format';
import { flowSummary } from '../../lib/steps';
import { auditDraft } from '../../lib/audit';
import { Badge } from '../Badge';
import { StepList } from '../StepList';

function BuilderEmpty() {
  const { createDraft } = useActions();
  const guard = useGuard();
  return (
    <section className="view active">
      <div className="empty-card simple-empty">
        <div className="empty-icon">●</div>
        <h2>录一次，以后自动做</h2>
        <p>适合企业老系统：自动填日期、筛选条件、点击查询、悬浮导出、下载文件，完成后通知。</p>
        <button className="primary wide" onClick={guard(createDraft)}>
          从当前页面开始
        </button>
      </div>
      <div className="card quick-guide-card">
        <div className="guide-title">推荐用法</div>
        <div className="guide-steps">
          <div>
            <b>1</b>
            <span>打开目标网页</span>
          </div>
          <div>
            <b>2</b>
            <span>开始录制，然后正常操作一遍</span>
          </div>
          <div>
            <b>3</b>
            <span>停止录制，保存并测试</span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h2>它可以做什么</h2>
            <p>默认不用理解工作流。</p>
          </div>
        </div>
        <div className="scenario-grid">
          <div className="scenario">
            <strong>报表下载</strong>
            <span>填日期 → 查询 → 导出 → 通知</span>
          </div>
          <div className="scenario">
            <strong>表单填报</strong>
            <span>填写字段 → 提交 → 等成功提示</span>
          </div>
          <div className="scenario">
            <strong>筛选查询</strong>
            <span>选择条件 → 查询 → 停在结果页</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const ACTION_DRAWER: Array<{ label: string; cls?: string; run: (a: ReturnType<typeof useActions>) => void }> = [
  { label: '点击元素', run: (a) => a.pick('click') },
  { label: '填写字段', run: (a) => a.pick('input') },
  { label: '选择下拉', run: (a) => a.pick('select') },
  { label: '清空字段', run: (a) => a.pick('clear_field') },
  { label: '勾选选项', run: (a) => a.pick('check') },
  { label: '取消勾选', run: (a) => a.pick('uncheck') },
  { label: '双击元素', run: (a) => a.pick('double_click') },
  { label: '悬浮触发', run: (a) => a.pick('hover') },
  { label: '等待元素', run: (a) => a.pick('wait_element') },
  { label: '等待文字', run: (a) => a.addWaitText() },
  { label: '等待消失', run: (a) => a.addWaitTextGone() },
  { label: '页面稳定', run: (a) => a.addWaitStable() },
  { label: '按键', run: (a) => a.addPressKey() },
  { label: '滚动页面', run: (a) => a.addScroll() },
  { label: '保存截图', run: (a) => a.addScreenshot() },
  { label: '等待下载', run: (a) => a.addWaitDownload() },
  { label: '人工接管', run: (a) => a.addManualCheck() },
  { label: '清空步骤', cls: 'danger', run: (a) => a.clearSteps() }
];

export function BuilderView() {
  const { state, saveDraft } = useStore();
  const actions = useActions();
  const guard = useGuard();

  const [d, setD] = useState<Draft | null>(state.draft);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setD(state.draft);
  }, [state.draft]);

  if (!d) return <BuilderEmpty />;

  const rec = state.recording?.active;
  const steps = d.steps || [];
  const summary = flowSummary(steps);
  const warnings = auditDraft(d);

  const patch = (p: Partial<Draft>) =>
    setD((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...p };
      void saveDraft(next);
      return next;
    });

  const patchStep = (id: string, sp: Partial<Step>) =>
    setD((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const st = (next.steps || []).find((x) => x.id === id);
      if (st) Object.assign(st, sp);
      void saveDraft(next);
      return next;
    });

  const setScheduleType = (type: ScheduleType) => {
    const schedule: Draft['schedule'] = { type };
    if (type === 'daily' || type === 'workdays') schedule.time = d.schedule?.time || '08:30';
    if (type === 'interval') schedule.intervalMinutes = d.schedule?.intervalMinutes || 60;
    patch({ schedule });
  };

  const rule = d.downloadRule || {};

  return (
    <section className="view active">
      <div className={`card builder-hero${rec ? ' is-recording' : ''}`}>
        <div className="builder-hero-top">
          <div>
            <h2>{rec ? '正在录制' : '录制一个老系统任务'}</h2>
            <p>
              {rec
                ? '现在回到网页，像平时一样操作。插件会自动记录关键动作。'
                : '默认只需要三个动作：开始录制、停止录制、保存并测试。'}
            </p>
          </div>
          {rec ? (
            <span className="recording-pill">
              <span />录制中
            </span>
          ) : (
            <Badge status={d.enabled === false ? 'paused' : 'enabled'} />
          )}
        </div>
        <div className="big-actions">
          {rec ? (
            <button className="danger wide" onClick={guard(actions.stopRecording)}>
              停止录制
            </button>
          ) : (
            <button className="primary wide" onClick={guard(actions.startRecording)}>
              开始录制
            </button>
          )}
          <button className="soft wide" disabled={!steps.length} onClick={guard(() => actions.saveTask(true))}>
            保存并测试
          </button>
        </div>
        <button className="ghost wide screenshot-now" onClick={guard(actions.captureScreenshotNow)}>
          保存当前页面截图
        </button>
        <p className="help">
          只录关键业务动作。误录的步骤可以删除。日期字段可以改成 {'{{yesterday}}'}、{'{{today}}'}、{'{{month_start}}'}。
        </p>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>任务名称和运行方式</h2>
            <p>{shortUrl(d.startUrl)}</p>
          </div>
        </div>
        <div className="stack compact-form">
          <label className="field">
            任务名称
            <input
              value={d.name || ''}
              placeholder="例如：销售日报下载"
              onFocus={() => (editing.current = true)}
              onBlur={() => (editing.current = false)}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <div className="schedule-switch">
            {(['manual', 'daily', 'workdays', 'interval'] as ScheduleType[]).map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="scheduleQuick"
                  checked={(d.schedule?.type || 'manual') === type}
                  onChange={() => setScheduleType(type)}
                />
                <span>{{ manual: '手动', daily: '每天', workdays: '工作日', interval: '周期' }[type]}</span>
              </label>
            ))}
          </div>
          <div className="grid2 schedule-extra">
            {d.schedule?.type === 'interval' ? (
              <label className="field">
                间隔分钟
                <input
                  type="number"
                  min={1}
                  value={d.schedule?.intervalMinutes || 60}
                  onFocus={() => (editing.current = true)}
                  onBlur={() => (editing.current = false)}
                  onChange={(e) =>
                    patch({
                      schedule: { type: 'interval', intervalMinutes: Math.max(1, Number(e.target.value || 60)) }
                    })
                  }
                />
              </label>
            ) : d.schedule?.type === 'daily' || d.schedule?.type === 'workdays' ? (
              <label className="field">
                执行时间
                <input
                  type="time"
                  value={d.schedule?.time || '08:30'}
                  onChange={(e) => patch({ schedule: { type: d.schedule!.type, time: e.target.value } })}
                />
              </label>
            ) : (
              <label className="field">
                运行方式
                <input value="手动点击立即运行" disabled />
              </label>
            )}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={d.enabled !== false}
                onChange={(e) => patch({ enabled: e.target.checked })}
              />
              启用自动运行
            </label>
          </div>
          <details className="advanced-block">
            <summary>高级：起始地址</summary>
            <div className="divider" />
            <label className="field">
              起始地址
              <input
                value={d.startUrl || ''}
                onFocus={() => (editing.current = true)}
                onBlur={() => (editing.current = false)}
                onChange={(e) => patch({ startUrl: e.target.value })}
              />
            </label>
          </details>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>流程步骤</h2>
            <p>{steps.length} 步。先看懂流程，再测试。</p>
          </div>
          <button className="secondary" disabled={!steps.length} onClick={guard(actions.polishSteps)}>
            整理流程
          </button>
        </div>

        {steps.length > 0 && (
          <div className="flow-summary">
            <span>
              填写/筛选 <b>{summary.fill}</b>
            </span>
            <span>
              点击/悬浮 <b>{summary.click}</b>
            </span>
            <span>
              等待/下载 <b>{summary.wait}</b>
            </span>
            {summary.manual > 0 && (
              <span>
                人工接管 <b>{summary.manual}</b>
              </span>
            )}
          </div>
        )}

        {warnings.length ? (
          <div className="audit-box">
            {warnings.map((w, i) => (
              <div className="audit-item" key={i}>
                {w}
              </div>
            ))}
          </div>
        ) : (
          <div className="notice ok">流程检查：没有明显问题。建议保存后先“立即测试”一次。</div>
        )}

        <StepList steps={steps} patchStep={patchStep} setEditing={(v) => (editing.current = v)} />

        <details className="advanced-block action-drawer">
          <summary>需要补步骤时再打开</summary>
          <div className="divider" />
          <div className="tool-grid">
            {ACTION_DRAWER.map((b) => (
              <button
                key={b.label}
                className={b.cls || 'secondary'}
                onClick={guard(() => b.run(actions))}
              >
                {b.label}
              </button>
            ))}
          </div>
        </details>
      </div>

      <div className="card">
        <details className="advanced-block">
          <summary>高级：下载校验和超时，默认不用改</summary>
          <div className="divider" />
          <div className="stack">
            <label className="field">
              校验模式
              <select
                value={rule.validationMode === 'strict' ? 'strict' : 'loose'}
                onChange={(e) =>
                  patch({ downloadRule: { ...rule, validationMode: e.target.value as 'loose' | 'strict' } })
                }
              >
                <option value="loose">宽松：检测到下载完成即可</option>
                <option value="strict">严格：检查文件类型和大小</option>
              </select>
            </label>
            <div className="grid2">
              <label className="field">
                文件类型
                <input
                  value={(rule.extensions || ['xlsx', 'xls', 'csv', 'pdf', 'zip']).join(',')}
                  onFocus={() => (editing.current = true)}
                  onBlur={() => (editing.current = false)}
                  onChange={(e) =>
                    patch({
                      downloadRule: {
                        ...rule,
                        extensions: e.target.value
                          .split(',')
                          .map((x) => x.trim().replace(/^\./, '').toLowerCase())
                          .filter(Boolean)
                      }
                    })
                  }
                />
              </label>
              <label className="field">
                最小大小 KB
                <input
                  type="number"
                  min={0}
                  value={Math.round((rule.minSizeBytes || 0) / 1024)}
                  onFocus={() => (editing.current = true)}
                  onBlur={() => (editing.current = false)}
                  onChange={(e) =>
                    patch({ downloadRule: { ...rule, minSizeBytes: Math.max(0, Number(e.target.value || 0)) * 1024 } })
                  }
                />
              </label>
            </div>
            <label className="field">
              下载超时秒
              <input
                type="number"
                min={10}
                value={Math.round((rule.timeoutMs || 600000) / 1000)}
                onFocus={() => (editing.current = true)}
                onBlur={() => (editing.current = false)}
                onChange={(e) =>
                  patch({ downloadRule: { ...rule, timeoutMs: Math.max(10, Number(e.target.value || 600)) * 1000 } })
                }
              />
            </label>
          </div>
        </details>
      </div>

      <div className="card sticky-save">
        <div className="grid2">
          <button className="primary" onClick={guard(() => actions.saveTask(false))}>
            保存任务
          </button>
          <button className="soft" disabled={!steps.length} onClick={guard(() => actions.saveTask(true))}>
            保存并测试
          </button>
        </div>
        <button className="ghost wide" onClick={guard(actions.discardDraft)}>
          放弃草稿
        </button>
      </div>
    </section>
  );
}
