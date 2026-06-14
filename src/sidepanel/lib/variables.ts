import type { Draft, Step } from '../../types';
import { uid } from './format';

export const VARIABLE_CHIPS: Array<[value: string, label: string]> = [
  ['{{today}}', '今天'],
  ['{{yesterday}}', '昨天'],
  ['{{tomorrow}}', '明天'],
  ['{{month_start}}', '本月初'],
  ['{{month_end}}', '本月末'],
  ['{{last_month_start}}', '上月初'],
  ['{{last_month_end}}', '上月末'],
  ['{{date:-7}}', '近7天']
];

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseSimpleDate(s: string): Date | null {
  const m = String(s).match(/^(\d{4})[-/.年]?(\d{1,2})[-/.月]?(\d{1,2})日?$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return stripTime(d);
}

export function suggestDateVariable(value: string): string {
  const s = String(value || '').trim();
  if (!s || /\{\{/.test(s)) return '';
  const parsed = parseSimpleDate(s);
  if (!parsed) return '';
  const today = stripTime(new Date());
  const delta = Math.round((parsed.getTime() - today.getTime()) / 86400000);
  if (delta === 0) return '{{today}}';
  if (delta === -1) return '{{yesterday}}';
  if (delta === 1) return '{{tomorrow}}';
  if (delta >= -30 && delta <= 30) return `{{date:${delta}}}`;
  return '';
}

function sameStepTarget(a: Step, b: Step): boolean {
  const ak = a.element?.selector || a.element?.xpath || a.element?.stableText || a.element?.text || '';
  const bk = b.element?.selector || b.element?.xpath || b.element?.stableText || b.element?.text || '';
  return !!ak && ak === bk;
}

export interface PolishResult {
  steps: Step[];
  inserted: number;
  variableChanged: number;
}

// Clean up a recorded flow: collapse duplicate hovers/downloads, variable-ize
// literal dates, and insert "wait for page to settle" after query/submit clicks.
export function polishSteps(draft: Draft): PolishResult {
  const steps = draft.steps || [];
  const next: Step[] = [];
  let inserted = 0;
  let variableChanged = 0;

  for (let i = 0; i < steps.length; i++) {
    const s = structuredClone(steps[i]);
    if (['input', 'select'].includes(s.action) && typeof s.value === 'string') {
      const v = suggestDateVariable(s.value);
      if (v && v !== s.value) {
        s.value = v;
        variableChanged++;
      }
    }
    const prev = next[next.length - 1];
    if (prev && prev.action === s.action && sameStepTarget(prev, s) && ['hover', 'wait_download'].includes(s.action)) {
      continue;
    }
    next.push(s);

    const text = `${s.label || ''} ${s.element?.text || ''} ${s.element?.stableText || ''} ${s.element?.nearText || ''}`;
    const nextStep = steps[i + 1];
    const needsStableWait =
      s.action === 'click' &&
      /查询|搜索|刷新|提交|保存|计算|生成|检索|query|search|submit|save|refresh/i.test(text);
    const followedByWait =
      nextStep &&
      ['wait_stable', 'wait_element', 'wait_text', 'wait_text_gone', 'wait', 'wait_download'].includes(nextStep.action);
    if (needsStableWait && !followedByWait) {
      next.push({
        id: uid('step'),
        action: 'wait_stable',
        label: '等待页面稳定',
        quietMs: 900,
        timeoutMs: 6000,
        source: 'auto-polish'
      });
      inserted++;
    }
  }

  return { steps: next.slice(0, 120), inserted, variableChanged };
}
