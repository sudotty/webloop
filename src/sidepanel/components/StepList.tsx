import type { Step } from '../../types';
import { useActions } from '../actions';
import { useGuard } from '../hooks';
import {
  confidenceClass,
  elementConfidence,
  hasConfidence,
  stepSub,
  stepTitle
} from '../lib/steps';
import { VARIABLE_CHIPS } from '../lib/variables';

interface Props {
  steps: Step[];
  patchStep: (id: string, patch: Partial<Step>) => void;
  setEditing: (v: boolean) => void;
}

function StepEditor({ step, patchStep, setEditing }: { step: Step; patchStep: Props['patchStep']; setEditing: (v: boolean) => void }) {
  const { insertVariable } = useActions();
  const guard = useGuard();
  const focusProps = {
    onFocus: () => setEditing(true),
    onBlur: () => setEditing(false)
  };

  if (['input', 'select', 'multi_select'].includes(step.action)) {
    const label = step.action === 'input' ? '填充值' : step.action === 'multi_select' ? '多选值，逗号分隔' : '选择值';
    return (
      <div className="step-editor">
        <label>
          {label}
          <input
            className="step-value-input"
            value={typeof step.value === 'string' ? step.value : (step.value || []).join('，')}
            placeholder="固定值或 {{yesterday}}"
            {...focusProps}
            onChange={(e) => patchStep(step.id, { value: e.target.value })}
          />
        </label>
        <div className="var-chips">
          {VARIABLE_CHIPS.map(([value, text]) => (
            <button
              type="button"
              className="chip"
              key={value}
              onClick={guard(() => insertVariable(step.id, value))}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.action === 'wait_text' || step.action === 'wait_text_gone' || step.action === 'manual_check') {
    const label =
      step.action === 'wait_text' ? '等待文字' : step.action === 'wait_text_gone' ? '等待消失的文字' : '人工提示';
    const placeholder =
      step.action === 'wait_text'
        ? '例如：查询完成 / 导出完成'
        : step.action === 'wait_text_gone'
          ? '例如：加载中 / 导出中 / 查询中'
          : '例如：请完成短信验证码后重新运行';
    return (
      <div className="step-editor">
        <label>
          {label}
          <input
            value={step.text || ''}
            placeholder={placeholder}
            {...focusProps}
            onChange={(e) => patchStep(step.id, { text: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step.action === 'wait') {
    return (
      <div className="step-editor">
        <label>
          等待秒数
          <input
            type="number"
            min={1}
            value={Math.round((step.durationMs || 1000) / 1000)}
            {...focusProps}
            onChange={(e) => patchStep(step.id, { durationMs: Math.max(1, Number(e.target.value || 1)) * 1000 })}
          />
        </label>
      </div>
    );
  }

  if (step.action === 'wait_stable') {
    return (
      <div className="step-editor">
        <label>
          稳定等待毫秒
          <input
            type="number"
            min={300}
            value={Number(step.quietMs || 900)}
            {...focusProps}
            onChange={(e) => patchStep(step.id, { quietMs: Math.max(300, Number(e.target.value || 900)) })}
          />
        </label>
      </div>
    );
  }

  if (step.action === 'press_key') {
    return (
      <div className="step-editor">
        <label>
          按键
          <input
            value={step.key || 'Enter'}
            placeholder="Enter / Tab / Escape"
            {...focusProps}
            onChange={(e) => patchStep(step.id, { key: e.target.value })}
          />
        </label>
      </div>
    );
  }

  if (step.action === 'scroll') {
    return (
      <div className="step-editor">
        <label>
          滚动像素
          <input
            type="number"
            value={Number(step.y || 600)}
            {...focusProps}
            onChange={(e) => patchStep(step.id, { y: Number(e.target.value || 0) })}
          />
        </label>
      </div>
    );
  }

  return null;
}

export function StepList({ steps, patchStep, setEditing }: Props) {
  const { highlightStep, runFromStep, deleteStep } = useActions();
  const guard = useGuard();

  if (!steps.length) {
    return (
      <div className="notice empty-steps">
        还没有步骤。点击“开始录制”，然后在网页里真实操作一遍：填条件 → 查询 → 导出/提交。
      </div>
    );
  }

  return (
    <div className="steps simple-steps">
      {steps.map((s, i) => {
        const c = elementConfidence(s);
        return (
          <div className="step" key={s.id}>
            <div className="step-index">{i + 1}</div>
            <div className="step-main">
              <div className="step-title">
                {stepTitle(s)}
                {hasConfidence(s.action) && (
                  <span className={`confidence ${confidenceClass(c)}`}> {c.label}</span>
                )}
              </div>
              <div className="step-sub">{stepSub(s)}</div>
              <StepEditor step={s} patchStep={patchStep} setEditing={setEditing} />
            </div>
            <div className="step-actions compact-step-actions">
              <button title="定位高亮" onClick={guard(() => highlightStep(s.id))}>
                ◎
              </button>
              <button title="从本步测试" onClick={guard(() => runFromStep(s.id))}>
                ▶
              </button>
              <button title="删除" onClick={guard(() => deleteStep(s.id))}>
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
