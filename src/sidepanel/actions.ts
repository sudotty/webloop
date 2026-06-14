import { useCallback } from 'react';
import type { Draft, Settings, Step } from '../types';
import { api, getCurrentTab, type OkResponse } from './api';
import { useStore } from './store';
import { uid } from './lib/format';
import { ensurePagePermission } from './lib/permissions';
import { polishSteps as polishStepsFn } from './lib/variables';

function ok(res: OkResponse, fallback: string): void {
  if (!res.ok) throw new Error(res.error || fallback);
}

// Picker modes map directly to content_script picker behaviour.
const PICK_PROMPTS: Record<string, string> = {
  click: '请在网页中点击目标元素',
  input: '请在网页中点击要自动填写的输入框/日期框',
  select: '请在网页中点击要自动选择的下拉框',
  clear_field: '请在网页中点击要清空的输入框/日期框',
  check: '请在网页中点击要确保勾选的选项',
  uncheck: '请在网页中点击要确保取消勾选的选项',
  double_click: '请在网页中点击要双击的表格单元格/按钮',
  hover: '请在网页中点击“悬浮后展开菜单”的触发元素',
  wait_element: '请在网页中点击“出现后才继续”的元素，例如结果表格或导出按钮'
};

export function useActions() {
  const store = useStore();
  const { state, showToast, refresh, setView, saveDraft } = store;

  const requireDraft = useCallback((): Draft => {
    if (!state.draft) throw new Error('请先创建草稿');
    return structuredClone(state.draft);
  }, [state.draft]);

  const withTab = useCallback(async () => {
    const tab = await getCurrentTab();
    await ensurePagePermission(tab);
    return tab!;
  }, []);

  const appendStep = useCallback(
    async (step: Step, toast: string) => {
      const d = requireDraft();
      d.steps = [...(d.steps || []), step];
      await saveDraft(d, { refresh: true });
      showToast(toast);
    },
    [requireDraft, saveDraft, showToast]
  );

  const createDraft = useCallback(async () => {
    const tab = await withTab();
    const res = (await api.createDraft({ id: tab.id, url: tab.url, title: tab.title })) as OkResponse;
    ok(res, '创建失败');
    setView('builder');
    await refresh(true);
    showToast('草稿已创建，可以开始录制');
  }, [withTab, setView, refresh, showToast]);

  const startRecording = useCallback(async () => {
    const tab = await withTab();
    const res = (await api.startRecording(tab.id!)) as OkResponse;
    ok(res, '录制启动失败');
    await refresh(true);
    showToast('自动录制已开启：可悬浮菜单后点击导出');
  }, [withTab, refresh, showToast]);

  const stopRecording = useCallback(async () => {
    ok((await api.stopRecording()) as OkResponse, '停止失败');
    await refresh(true);
    showToast('录制已停止');
  }, [refresh, showToast]);

  const pick = useCallback(
    async (mode: keyof typeof PICK_PROMPTS) => {
      requireDraft();
      const tab = await withTab();
      const res = (await api.startPicker(tab.id!, mode)) as OkResponse;
      ok(res, '点选失败');
      showToast(PICK_PROMPTS[mode]);
    },
    [requireDraft, withTab, showToast]
  );

  const addWaitDownload = useCallback(
    () =>
      appendStep(
        {
          id: uid('step'),
          action: 'wait_download',
          label: '等待下载完成',
          timeoutMs: state.draft?.downloadRule?.timeoutMs || 600000
        },
        '已添加等待下载'
      ),
    [appendStep, state.draft]
  );

  const addWaitText = useCallback(async () => {
    const text = window.prompt('输入要等待出现的文字，例如：查询完成 / 导出完成 / 保存成功', '查询完成');
    if (!text) return;
    await appendStep(
      { id: uid('step'), action: 'wait_text', label: `等待文字「${text.slice(0, 20)}」`, text, timeoutMs: 30000 },
      '已添加等待文字'
    );
  }, [appendStep]);

  const addWaitTextGone = useCallback(async () => {
    const text = window.prompt('输入要等待消失的文字，例如：加载中 / 查询中 / 导出中', '加载中');
    if (!text) return;
    await appendStep(
      {
        id: uid('step'),
        action: 'wait_text_gone',
        label: `等待文字消失「${text.slice(0, 20)}」`,
        text,
        timeoutMs: 30000
      },
      '已添加等待文字消失'
    );
  }, [appendStep]);

  const addManualCheck = useCallback(async () => {
    const text = window.prompt(
      '人工接管提示，例如：请完成短信验证码/审批确认后重新运行',
      '需要人工接管：请完成验证或确认后重新运行任务'
    );
    if (!text) return;
    await appendStep(
      { id: uid('step'), action: 'manual_check', label: '人工接管点', text, timeoutMs: 1000 },
      '已添加人工接管点'
    );
  }, [appendStep]);

  const addWaitStable = useCallback(async () => {
    const raw = window.prompt('等待页面稳定多少毫秒？适合查询后表格刷新、按钮变可点。', '900');
    if (!raw) return;
    const quietMs = Math.max(300, Number(raw || 900));
    await appendStep(
      {
        id: uid('step'),
        action: 'wait_stable',
        label: '等待页面稳定',
        quietMs,
        timeoutMs: Math.max(5000, quietMs + 4000),
        source: 'manual'
      },
      '已添加等待页面稳定'
    );
  }, [appendStep]);

  const addPressKey = useCallback(async () => {
    const key = window.prompt('输入按键：Enter / Tab / Escape / Space', 'Enter');
    if (!key) return;
    await appendStep(
      { id: uid('step'), action: 'press_key', label: `按键 ${key}`, key, timeoutMs: 3000, source: 'manual' },
      `已添加按键：${key}`
    );
  }, [appendStep]);

  const addScroll = useCallback(async () => {
    const raw = window.prompt('页面向下滚动多少像素？也可输入负数向上滚动。', '600');
    if (raw === null) return;
    const y = Number(raw || 600);
    await appendStep(
      { id: uid('step'), action: 'scroll', label: `滚动页面 ${y}px`, y, x: 0, timeoutMs: 3000, source: 'manual' },
      '已添加滚动页面'
    );
  }, [appendStep]);

  const addScreenshot = useCallback(async () => {
    const label = window.prompt('截图步骤名称，例如：查询结果截图 / 失败前截图', '保存页面截图');
    if (label === null) return;
    await appendStep(
      { id: uid('step'), action: 'screenshot', label: label || '保存页面截图', timeoutMs: 8000, source: 'manual' },
      '已添加截图步骤'
    );
  }, [appendStep]);

  const captureScreenshotNow = useCallback(async () => {
    const tab = await withTab();
    const res = (await api.captureScreenshot(tab.id!, '手动截图')) as OkResponse;
    ok(res, '截图失败');
    showToast('截图已保存到下载目录');
  }, [withTab, showToast]);

  const clearSteps = useCallback(async () => {
    const d = requireDraft();
    d.steps = [];
    await saveDraft(d, { refresh: true });
  }, [requireDraft, saveDraft]);

  const polishSteps = useCallback(async () => {
    const d = requireDraft();
    const { steps, inserted, variableChanged } = polishStepsFn(d);
    d.steps = steps;
    await saveDraft(d, { refresh: true });
    const parts: string[] = [];
    if (inserted) parts.push(`增加 ${inserted} 个稳定等待`);
    if (variableChanged) parts.push(`变量化 ${variableChanged} 个日期值`);
    showToast(parts.length ? `流程已整理：${parts.join('，')}` : '流程已检查：没有明显可整理项');
  }, [requireDraft, saveDraft, showToast]);

  const deleteStep = useCallback(
    async (id: string) => {
      const d = requireDraft();
      d.steps = (d.steps || []).filter((s) => s.id !== id);
      await saveDraft(d, { refresh: true });
      showToast('步骤已删除');
    },
    [requireDraft, saveDraft, showToast]
  );

  const moveStep = useCallback(
    async (id: string, delta: number) => {
      const d = requireDraft();
      const steps = d.steps || [];
      const i = steps.findIndex((s) => s.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= steps.length) return;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      d.steps = steps;
      await saveDraft(d, { refresh: true });
    },
    [requireDraft, saveDraft]
  );

  const setStepField = useCallback(
    async (id: string, patch: Partial<Step>) => {
      const d = requireDraft();
      const step = (d.steps || []).find((s) => s.id === id);
      if (!step) return;
      Object.assign(step, patch);
      await saveDraft(d);
    },
    [requireDraft, saveDraft]
  );

  const insertVariable = useCallback(
    async (id: string, value: string) => {
      const d = requireDraft();
      const step = (d.steps || []).find((s) => s.id === id);
      if (!step) return;
      step.value = value;
      await saveDraft(d, { refresh: true });
      showToast(`已设置变量：${value}`);
    },
    [requireDraft, saveDraft, showToast]
  );

  const highlightStep = useCallback(
    async (id: string) => {
      const d = requireDraft();
      const step = (d.steps || []).find((s) => s.id === id);
      if (!step) return;
      const tab = await withTab();
      const res = (await api.highlightStep(tab.id!, step)) as OkResponse;
      ok(res, '定位失败');
      showToast('已在页面高亮目标元素');
    },
    [requireDraft, withTab, showToast]
  );

  const saveTask = useCallback(
    async (runAfterSave: boolean) => {
      const d = requireDraft();
      await api.saveDraft(d);
      const res = await api.saveDraftAsTask();
      ok(res, '保存失败');
      showToast(runAfterSave ? '任务已保存，开始测试' : '任务已保存');
      setView(runAfterSave ? 'logs' : 'today');
      await refresh(true);
      if (runAfterSave && res.taskId) {
        ok((await api.runTask(res.taskId)) as OkResponse, '运行失败');
      }
    },
    [requireDraft, showToast, setView, refresh]
  );

  const runFromStep = useCallback(
    async (id: string) => {
      const d = requireDraft();
      const idx = (d.steps || []).findIndex((s) => s.id === id);
      if (idx < 0) return;
      await api.saveDraft(d);
      const saved = await api.saveDraftAsTask();
      ok(saved, '保存失败');
      const taskId = saved.taskId || d.id;
      const res = (await api.runTaskFromStep(taskId, idx)) as OkResponse;
      ok(res, '运行失败');
      setView('logs');
      await refresh(true);
      showToast(`已从第 ${idx + 1} 步开始测试`);
    },
    [requireDraft, setView, refresh, showToast]
  );

  const discardDraft = useCallback(async () => {
    await api.discardDraft();
    setView('today');
    await refresh(true);
    showToast('已放弃草稿');
  }, [setView, refresh, showToast]);

  const runTask = useCallback(
    async (id: string) => {
      ok((await api.runTask(id)) as OkResponse, '运行失败');
      setView('logs');
      await refresh(true);
      showToast('已开始运行');
    },
    [setView, refresh, showToast]
  );

  const editTask = useCallback(
    async (id: string) => {
      ok((await api.editTaskAsDraft(id)) as OkResponse, '打开编辑失败');
      setView('builder');
      await refresh(true);
    },
    [setView, refresh]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      ok((await api.toggleTask(id)) as OkResponse, '切换失败');
      await refresh(true);
    },
    [refresh]
  );

  const clearLogs = useCallback(async () => {
    await api.clearLogs();
    await refresh(true);
    showToast('日志已清空');
  }, [refresh, showToast]);

  const testNotification = useCallback(async () => {
    ok((await api.testNotification()) as OkResponse, '通知测试失败');
    showToast('测试通知已发送');
  }, [showToast]);

  const testLlm = useCallback(
    async (llm: Settings['llm']) => {
      if (!llm.apiKey) throw new Error('请输入 API Key');
      if (!llm.endpoint) throw new Error('请输入 Endpoint');
      showToast('正在测试模型连接…');
      const res = await api.testLlm(llm);
      ok(res, '连接测试失败');
      showToast(`✅ 连接成功：${(res.text || '').trim()}`);
    },
    [showToast]
  );

  const exportBackup = useCallback(async () => {
    const data = {
      version: '0.9.0',
      exportedAt: new Date().toISOString(),
      tasks: state.tasks,
      settings: state.settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webloop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('任务备份已导出');
  }, [state.tasks, state.settings, showToast]);

  const importBackup = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data.tasks)) throw new Error('备份文件不包含 tasks');
        if (!window.confirm(`将导入 ${data.tasks.length} 个任务。是否覆盖当前任务？`)) return;
        ok((await api.importBackup(data.tasks, data.settings || null)) as OkResponse, '导入失败');
        await refresh(true);
        showToast('任务备份已导入');
      } catch (err) {
        showToast((err as Error).message || String(err));
      }
    };
    input.click();
  }, [refresh, showToast]);

  return {
    createDraft,
    startRecording,
    stopRecording,
    pick,
    addWaitDownload,
    addWaitText,
    addWaitTextGone,
    addManualCheck,
    addWaitStable,
    addPressKey,
    addScroll,
    addScreenshot,
    captureScreenshotNow,
    clearSteps,
    polishSteps,
    deleteStep,
    moveStep,
    setStepField,
    insertVariable,
    highlightStep,
    saveTask,
    runFromStep,
    discardDraft,
    runTask,
    editTask,
    toggleTask,
    clearLogs,
    testNotification,
    testLlm,
    exportBackup,
    importBackup
  };
}

export type Actions = ReturnType<typeof useActions>;
