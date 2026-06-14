import type { Draft } from '../../types';

// Static analysis of a draft flow. Surfaces the most common reasons a recorded
// workflow on a legacy enterprise page silently fails, so the user can fix it
// before scheduling. Ported 1:1 from the original recorder.
export function auditDraft(d: Draft): string[] {
  const steps = d.steps || [];
  const warnings: string[] = [];
  if (!steps.length) return ['还没有步骤。先开始录制，或用精确点选添加关键步骤。'];

  const hasDownload = steps.some((s) => s.action === 'wait_download');
  const hasWait = steps.some((s) =>
    ['wait_download', 'wait_text', 'wait_text_gone', 'wait_element', 'wait'].includes(s.action)
  );
  if (!hasWait) warnings.push('没有等待步骤。老系统查询/导出通常需要“等待文字、等待元素或等待下载”。');

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const text = `${s.label || ''} ${s.element?.text || ''} ${s.element?.stableText || ''}`;
    if (/导出中|下载中|加载中|查询中|处理中|loading/i.test(text)) {
      warnings.push(`第 ${i + 1} 步可能录到了临时状态文案，建议重新点选稳定按钮。`);
    }
    if (s.action === 'click' && /导出|下载|export|download/i.test(text)) {
      const prev = steps[i - 1];
      if (!prev || prev.action !== 'hover') {
        warnings.push(`第 ${i + 1} 步是导出/下载点击；如果按钮需鼠标悬浮才出现，请在前面增加“悬浮触发”。`);
      }
    }
    if (
      s.action === 'input' &&
      /日期|date|时间|开始|结束|from|to/i.test(`${s.label || ''} ${s.element?.nearText || ''}`) &&
      !/\{\{/.test(String(s.value || ''))
    ) {
      warnings.push(`第 ${i + 1} 步像日期字段，建议改成 {{yesterday}}、{{today}} 或 {{month_start}} 这类动态变量。`);
    }
  }
  if (!hasDownload) {
    warnings.push('当前流程不等待下载；如果这是填报/查询任务可以忽略，如果是报表下载请添加“等待下载”。');
  }
  return [...new Set(warnings)].slice(0, 5);
}
