import type { Step, StepAction } from '../../types';

const STEP_TITLES: Record<string, string> = {
  hover: '悬浮触发',
  click: '点击元素',
  double_click: '双击元素',
  input: '填写字段',
  clear_field: '清空字段',
  select: '选择筛选项',
  multi_select: '多选筛选',
  check: '勾选选项',
  uncheck: '取消勾选',
  scroll: '滚动页面',
  wait_download: '等待下载',
  wait_element: '等待元素',
  wait_text: '等待文字',
  wait_text_gone: '等待文字消失',
  wait_stable: '等待页面稳定',
  press_key: '按键',
  screenshot: '保存截图',
  manual_check: '人工接管点',
  wait: '等待'
};

export function stepTitle(s: Step): string {
  return s.label || STEP_TITLES[s.action] || s.action;
}

export function stepSub(s: Step): string {
  const el = s.element;
  switch (s.action) {
    case 'hover':
      return `鼠标悬浮后等待 ${Math.round((s.pauseAfterMs || 700) / 1000)} 秒，展开隐藏菜单`;
    case 'double_click':
      return `双击：${el?.text || el?.selector || ''}`;
    case 'clear_field':
      return `清空：${el?.text || el?.nearText || el?.selector || ''}`;
    case 'check':
      return `确保已勾选：${el?.text || el?.nearText || ''}`;
    case 'uncheck':
      return `确保未勾选：${el?.text || el?.nearText || ''}`;
    case 'multi_select':
      return `多选：${Array.isArray(s.value) ? s.value.join('，') : s.value || ''}`;
    case 'scroll':
      return el ? '滚动到目标元素' : `页面滚动 ${s.y || 600}px`;
    case 'wait_download':
      return `等待文件下载完成，超时 ${Math.round((s.timeoutMs || 600000) / 1000)} 秒`;
    case 'wait':
      return `等待 ${Math.round((s.durationMs || 1000) / 1000)} 秒`;
    case 'wait_element':
      return `等待元素出现：${el?.text || el?.nearText || el?.selector || ''}`;
    case 'wait_text':
      return `等待页面出现文字：${s.text || ''}`;
    case 'wait_text_gone':
      return `等待页面文字消失：${s.text || ''}`;
    case 'wait_stable':
      return `等待 DOM ${Math.round((s.quietMs || 900) / 1000)} 秒内无明显变化`;
    case 'press_key':
      return `按键：${s.key || 'Enter'}`;
    case 'manual_check':
      return s.text || '到这里停止并通知用户人工处理';
    default:
      if (s.value && s.action !== 'click') return `${el?.text || el?.selector || ''} = ${s.value}`;
      return el?.text || el?.nearText || el?.selector || '页面元素';
  }
}

const CONFIDENCE_ACTIONS: StepAction[] = [
  'click',
  'double_click',
  'input',
  'select',
  'multi_select',
  'clear_field',
  'check',
  'uncheck',
  'hover',
  'wait_element'
];

export function hasConfidence(action: StepAction): boolean {
  return CONFIDENCE_ACTIONS.includes(action);
}

export interface Confidence {
  score: number;
  label: string;
}

export function elementConfidence(s: Step): Confidence {
  if (!hasConfidence(s.action)) return { score: 100, label: '规则' };
  const e = s.element || {};
  let score = 20;
  if (e.attrs?.id) score += 30;
  if (e.selector && !/:nth-of-type/.test(e.selector)) score += 25;
  if (e.attrs?.name || e.attrs?.ariaLabel || e.attrs?.title) score += 20;
  if (e.stableText || e.text) score += 15;
  if (e.xpath && !/contains\(normalize-space/.test(e.xpath)) score += 10;
  score = Math.max(20, Math.min(100, score));
  if (score >= 75) return { score, label: '稳定' };
  if (score >= 50) return { score, label: '一般' };
  return { score, label: '易变' };
}

export function confidenceClass(c: Confidence): string {
  return c.score >= 75 ? 'good' : c.score >= 50 ? 'mid' : 'low';
}

export interface FlowSummary {
  fill: number;
  click: number;
  wait: number;
  manual: number;
}

export function flowSummary(steps: Step[]): FlowSummary {
  return {
    fill: steps.filter((s) =>
      ['input', 'select', 'multi_select', 'clear_field', 'check', 'uncheck'].includes(s.action)
    ).length,
    click: steps.filter((s) => ['click', 'double_click', 'hover', 'press_key', 'scroll'].includes(s.action))
      .length,
    wait: steps.filter((s) =>
      ['wait_download', 'wait_text', 'wait_text_gone', 'wait_element', 'wait_stable', 'wait', 'screenshot'].includes(
        s.action
      )
    ).length,
    manual: steps.filter((s) => s.action === 'manual_check').length
  };
}
