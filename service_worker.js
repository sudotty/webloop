const KEYS = ['tasks', 'logs', 'settings', 'draft'];
const MAX_LOGS = 80;
const ALARM_PREFIX = 'rr-task:';
const recentDownloads = [];
const running = new Map();
let activeRecording = null;

const DEFAULT_SETTINGS = {
  closeTabAfterRun: false,
  activateTabWhenRunning: true,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  notifyOnNeedHuman: true,
  notifyOnTaskStart: false,
  smartHoverRecording: true,
  showPageHints: true,
  iframeSupport: true,
  dynamicVariables: true,
  stepRetryCount: 2,
  runTimeoutMinutes: 15,
  screenshotOnFailure: true,
  screenshotOnSuccess: false,
  screenshotDirectory: 'WebLoop Screenshots',
  followNewTabsAfterClick: true,
  llm: {
    enabled: false,
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    apiKey: '',
    shareMode: 'minimal',
    temperature: 0.1
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  try { await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }); } catch (_) {}
  await rescheduleAll();
});
chrome.runtime.onStartup.addListener(rescheduleAll);

chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const taskId = alarm.name.slice(ALARM_PREFIX.length);
  try {
    const { tasks = [] } = await chrome.storage.local.get(['tasks']);
    const task = tasks.find(t => t.id === taskId);
    if (task?.schedule?.type === 'workdays') {
      const day = new Date().getDay();
      if (day === 0 || day === 6) return;
    }
    await runTaskById(taskId, { manual: false });
  } catch (err) { console.error(err); }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error(err);
    sendResponse({ ok: false, error: err.message || String(err) });
  });
  return true;
});

chrome.downloads.onCreated.addListener(async item => {
  recentDownloads.unshift({ id: item.id, startedAt: Date.now(), filename: item.filename || '', url: item.url || '' });
  recentDownloads.splice(50);
  if (activeRecording?.active) {
    try {
      const { draft } = await chrome.storage.local.get(['draft']);
      if (draft && draft.id === activeRecording.draftId) {
        const steps = draft.steps || [];
        if (!steps.length || steps[steps.length - 1].action !== 'wait_download') {
          steps.push({
            id: uid('step'),
            action: 'wait_download',
            label: '等待下载完成',
            timeoutMs: draft.downloadRule?.timeoutMs || 600000,
            createdAt: new Date().toISOString(),
            source: 'auto-download'
          });
          draft.steps = steps;
          await chrome.storage.local.set({ draft });
          await notifyPanel();
        }
      }
    } catch (err) { console.warn('auto append wait_download failed', err); }
  }
});

async function handleMessage(message, sender) {
  const { type, payload = {} } = message || {};
  if (type === 'RR_GET_STATE') return await getState();
  if (type === 'RR_CAPTURE_SCREENSHOT') return await captureCurrentTabScreenshot(payload.tabId, payload.label || '手动截图');
  if (type === 'RR_TEST_NOTIFICATION') {
    await showNotification('WebLoop：通知测试', '通知通道正常。任务完成、失败、需要人工接管时会在这里提示。表单填报、筛选和下载任务都会通知。');
    return { ok: true };
  }
  if (type === 'RR_SAVE_SETTINGS') {
    const settings = mergeSettings(payload.settings || {});
    await chrome.storage.local.set({ settings });
    await notifyPanel();
    return { ok: true };
  }
  if (type === 'RR_TEST_LLM') {
    const s = payload.settings;
    try {
      const isAnthropic = s.provider === 'anthropic';
      const body = isAnthropic ? {
        model: s.model,
        messages: [{ role: 'user', content: 'Say "Connection Success" concisely.' }],
        max_tokens: 20
      } : {
        model: s.model,
        messages: [{ role: 'user', content: 'Say "Connection Success" concisely.' }],
        max_tokens: 20,
        temperature: 0.1
      };
      const headers = { 'Content-Type': 'application/json' };
      if (isAnthropic) {
        headers['x-api-key'] = s.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${s.apiKey}`;
      }
      const res = await fetch(s.endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Status ${res.status}: ${errText.slice(0, 50)}`);
      }
      const data = await res.json();
      const text = isAnthropic ? data.content[0].text : data.choices[0].message.content;
      return { ok: true, text };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  if (type === 'RR_CREATE_DRAFT') {
    const tab = payload.tab || {};
    const draft = defaultDraft(tab.url, tab.title);
    await chrome.storage.local.set({ draft });
    await notifyPanel();
    return { ok: true, draft };
  }
  if (type === 'RR_SAVE_DRAFT') {
    const draft = normalizeTask(payload.draft || {}, { asDraft: true });
    await chrome.storage.local.set({ draft });
    await notifyPanel();
    return { ok: true, draft };
  }
  if (type === 'RR_DISCARD_DRAFT') {
    await stopRecordingInternal();
    await chrome.storage.local.remove('draft');
    await notifyPanel();
    return { ok: true };
  }
  if (type === 'RR_SAVE_DRAFT_AS_TASK') return await saveDraftAsTask();
  if (type === 'RR_EDIT_TASK_AS_DRAFT') return await editTaskAsDraft(payload.taskId);
  if (type === 'RR_TOGGLE_TASK') return await toggleTask(payload.taskId);
  if (type === 'RR_RUN_TASK') {
    runTaskById(payload.taskId, { manual: true }).catch(err => console.error(err));
    return { ok: true };
  }
  if (type === 'RR_RUN_TASK_FROM_STEP') {
    runTaskById(payload.taskId, { manual: true, startIndex: Number(payload.startIndex || 0) }).catch(err => console.error(err));
    return { ok: true };
  }
  if (type === 'RR_HIGHLIGHT_STEP') return await highlightStep(payload.tabId, payload.step);
  if (type === 'RR_IMPORT_BACKUP') return await importBackup(payload.tasks || [], payload.settings || null);
  if (type === 'RR_CLEAR_LOGS') {
    await chrome.storage.local.set({ logs: [] });
    await notifyPanel();
    return { ok: true };
  }
  if (type === 'RR_START_RECORDING') return await startRecording(payload.tabId);
  if (type === 'RR_STOP_RECORDING') {
    await stopRecordingInternal();
    await notifyPanel();
    return { ok: true };
  }
  if (type === 'RR_START_PICKER') return await startPicker(payload.tabId, payload.mode || 'click');
  if (type === 'RR_RECORDED_STEP') {
    await appendRecordedStep(payload.step, sender.tab?.id, sender.frameId, sender.url);
    return { ok: true };
  }
  if (type === 'RR_PICKER_CANCELLED') return { ok: true };
  return { ok: false, error: 'Unknown message type' };
}

async function getState() {
  const data = await chrome.storage.local.get(KEYS);
  return {
    tasks: data.tasks || [],
    logs: data.logs || [],
    settings: mergeSettings(data.settings || {}),
    draft: data.draft || null,
    recording: activeRecording ? { ...activeRecording } : null
  };
}

function mergeSettings(input) {
  return { ...DEFAULT_SETTINGS, ...input, llm: { ...DEFAULT_SETTINGS.llm, ...(input.llm || {}) } };
}

function defaultDraft(url, title) {
  const host = hostFromUrl(url);
  return normalizeTask({
    id: uid('task'),
    name: title && title.length < 38 ? `${title} 下载` : `${host} 自动任务`,
    startUrl: url,
    origin: originFromUrl(url),
    enabled: true,
    schedule: { type: 'manual', time: '08:30', intervalMinutes: 60 },
    steps: [],
    downloadRule: {
      validationMode: 'loose',
      extensions: ['xlsx', 'xls', 'csv', 'pdf', 'zip'],
      minSizeBytes: 0,
      timeoutMs: 600000
    }
  }, { asDraft: true });
}

function normalizeTask(task, options = {}) {
  const url = task.startUrl || '';
  const schedule = task.schedule || { type: 'manual' };
  const rule = task.downloadRule || {};
  return {
    id: task.id || uid(options.asDraft ? 'draft' : 'task'),
    name: String(task.name || `${hostFromUrl(url)} 自动任务`).trim(),
    startUrl: url,
    origin: task.origin || originFromUrl(url),
    enabled: task.enabled !== false,
    schedule: {
      type: ['manual', 'daily', 'workdays', 'interval'].includes(schedule.type) ? schedule.type : 'manual',
      time: schedule.time || '08:30',
      intervalMinutes: Math.max(1, Number(schedule.intervalMinutes || 60))
    },
    steps: Array.isArray(task.steps) ? task.steps.map(normalizeStep).filter(Boolean) : [],
    downloadRule: {
      validationMode: rule.validationMode === 'strict' ? 'strict' : 'loose',
      extensions: Array.isArray(rule.extensions) && rule.extensions.length ? rule.extensions.map(x => String(x).replace(/^\./, '').toLowerCase()) : ['xlsx', 'xls', 'csv', 'pdf', 'zip'],
      minSizeBytes: Math.max(0, Number(rule.minSizeBytes ?? 0)),
      timeoutMs: Math.max(10000, Number(rule.timeoutMs || 600000))
    },
    updatedAt: new Date().toISOString(),
    createdAt: task.createdAt || new Date().toISOString()
  };
}

function normalizeStep(step) {
  if (!step || !step.action) return null;
  const allowed = ['hover', 'click', 'double_click', 'input', 'clear_field', 'select', 'multi_select', 'check', 'uncheck', 'scroll', 'wait_download', 'wait_text', 'wait_text_gone', 'wait_element', 'wait_stable', 'press_key', 'wait', 'manual_check', 'screenshot'];
  if (!allowed.includes(step.action)) return null;
  return {
    id: step.id || uid('step'),
    action: step.action,
    label: step.label || labelForStep(step),
    element: step.element || null,
    value: normalizeRecordedValue(step.value ?? '', step),
    text: step.text || '',
    durationMs: Number(step.durationMs || 1000),
    pauseAfterMs: Number(step.pauseAfterMs || 700),
    quietMs: Math.max(300, Number(step.quietMs || 900)),
    key: step.key || '',
    timeoutMs: Math.max(1000, Number(step.timeoutMs || 12000)),
    frameId: Number.isFinite(Number(step.frameId)) ? Number(step.frameId) : undefined,
    frameUrl: step.frameUrl || step.element?.frame?.href || '',
    createdAt: step.createdAt || new Date().toISOString(),
    source: step.source || 'manual'
  };
}

function labelForStep(step) {
  if (step.action === 'hover') return step.element?.text ? `悬浮「${step.element.text.slice(0, 28)}」` : '悬浮触发展开';
  if (step.action === 'click') return step.element?.text ? `点击「${step.element.text.slice(0, 28)}」` : '点击元素';
  if (step.action === 'input') return '填写字段';
  if (step.action === 'select') return '选择筛选项';
  if (step.action === 'wait_download') return '等待下载完成';
  if (step.action === 'wait_element') return step.element?.text ? `等待元素「${step.element.text.slice(0, 20)}」出现` : '等待元素出现';
  if (step.action === 'wait_text') return `等待文字「${step.text || ''}」`;
  if (step.action === 'wait_text_gone') return `等待文字消失「${step.text || ''}」`;
  if (step.action === 'wait_stable') return '等待页面稳定';
  if (step.action === 'press_key') return `按键：${step.key || 'Enter'}`;
  if (step.action === 'manual_check') return `人工接管：${step.text || '请处理当前页面'}`;
  if (step.action === 'screenshot') return step.label || '保存页面截图';
  if (step.action === 'double_click') return step.label || '双击元素';
  if (step.action === 'clear_field') return step.label || '清空字段';
  if (step.action === 'multi_select') return step.label || '多选筛选';
  if (step.action === 'check') return step.label || '勾选选项';
  if (step.action === 'uncheck') return step.label || '取消勾选';
  if (step.action === 'scroll') return step.label || '滚动页面';
  return '等待';
}

async function saveDraftAsTask() {
  const { draft, tasks = [] } = await chrome.storage.local.get(['draft', 'tasks']);
  if (!draft) return { ok: false, error: '没有可保存的草稿' };
  const task = normalizeTask(draft);
  if (!task.startUrl || !/^https?:/.test(task.startUrl)) return { ok: false, error: '起始地址无效' };
  if (!task.steps.length) return { ok: false, error: '请至少录制一个步骤' };
  const idx = tasks.findIndex(t => t.id === task.id);
  const next = idx >= 0 ? tasks.map(t => t.id === task.id ? task : t) : [task, ...tasks];
  await chrome.storage.local.set({ tasks: next, draft: null });
  await stopRecordingInternal();
  await scheduleTask(task);
  await notifyPanel();
  return { ok: true, taskId: task.id, task };
}

async function editTaskAsDraft(taskId) {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { ok: false, error: '任务不存在' };
  await chrome.storage.local.set({ draft: normalizeTask(task, { asDraft: true }) });
  await notifyPanel();
  return { ok: true };
}

async function toggleTask(taskId) {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { ok: false, error: '任务不存在' };
  task.enabled = task.enabled === false;
  task.updatedAt = new Date().toISOString();
  await chrome.storage.local.set({ tasks });
  await scheduleTask(task);
  await notifyPanel();
  return { ok: true };
}

async function startRecording(tabId) {
  const { draft } = await chrome.storage.local.get(['draft']);
  if (!draft) return { ok: false, error: '请先创建草稿' };
  await injectContent(tabId);
  const settings = mergeSettings((await chrome.storage.local.get(['settings'])).settings || {});
  await sendToFrames(tabId, {
    type: 'RR_RECORDER_START',
    payload: { options: { smartHoverRecording: settings.smartHoverRecording, showPageHints: settings.showPageHints } }
  });
  activeRecording = { active: true, tabId, draftId: draft.id, startedAt: new Date().toISOString() };
  await notifyPanel();
  return { ok: true };
}

async function stopRecordingInternal() {
  if (!activeRecording?.active) { activeRecording = null; return; }
  try { await sendToFrames(activeRecording.tabId, { type: 'RR_RECORDER_STOP' }); } catch (_) {}
  activeRecording = null;
}

async function startPicker(tabId, mode) {
  const { draft } = await chrome.storage.local.get(['draft']);
  if (!draft) return { ok: false, error: '请先创建草稿' };
  await injectContent(tabId);
  await sendToFrames(tabId, { type: 'RR_PICKER_START', payload: { mode } });
  return { ok: true };
}

async function appendRecordedStep(step, senderTabId, senderFrameId, senderUrl) {
  const { draft } = await chrome.storage.local.get(['draft']);
  if (!draft) return;
  if (activeRecording?.active && senderTabId && activeRecording.tabId !== senderTabId) return;
  const next = normalizeStep({
    ...step,
    frameId: Number.isFinite(Number(senderFrameId)) ? Number(senderFrameId) : step.frameId,
    frameUrl: senderUrl || step.frameUrl || step.element?.frame?.href || ''
  });
  if (!next) return;
  const steps = draft.steps || [];
  const last = steps[steps.length - 1];
  if (last && shouldReplaceRecordedStep(last, next)) steps[steps.length - 1] = next;
  else steps.push(next);
  draft.steps = compactSteps(steps);
  await chrome.storage.local.set({ draft });
  await notifyPanel();
}

function shouldReplaceRecordedStep(a, b) {
  if (!['input', 'select'].includes(b.action)) return false;
  if (a.action !== b.action) return false;
  const as = a.element?.selector || a.element?.xpath || a.element?.text;
  const bs = b.element?.selector || b.element?.xpath || b.element?.text;
  return !!as && as === bs;
}

function compactSteps(steps) {
  const result = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const prev = result[result.length - 1];
    if (prev && prev.action === 'wait_download' && s.action === 'wait_download') continue;
    if (prev && prev.action === 'hover' && s.action === 'hover' && sameElement(prev.element, s.element)) continue;
    if (prev && prev.action === 'hover' && s.action === 'click' && sameElement(prev.element, s.element)) {
      result[result.length - 1] = s;
    } else {
      result.push(s);
    }

    const latest = result[result.length - 1];
    const next = steps[i + 1];
    const text = `${latest.label || ''} ${latest.element?.text || ''} ${latest.element?.stableText || ''} ${latest.element?.nearText || ''}`;
    const isQueryLikeClick = latest.action === 'click' && /查询|搜索|刷新|提交|保存|生成|检索|计算|query|search|refresh|submit|save/i.test(text);
    const nextIsWait = next && ['wait_stable','wait_element','wait_text','wait_text_gone','wait','wait_download'].includes(next.action);
    const prevIsAutoWait = result[result.length - 2]?.source === 'auto-polish' && result[result.length - 2]?.action === 'wait_stable';
    if (isQueryLikeClick && !nextIsWait && !prevIsAutoWait) {
      result.push({
        id: uid('step'),
        action: 'wait_stable',
        label: '等待页面稳定',
        quietMs: 900,
        timeoutMs: 6000,
        source: 'auto-polish',
        createdAt: new Date().toISOString()
      });
    }
  }
  return result.slice(0, 120);
}

function normalizeRecordedValue(value, step = {}) {
  if (Array.isArray(value)) return value.map(v => normalizeRecordedValue(v, { ...step, action: 'select' })).filter(v => v !== '');
  const v = String(value ?? '');
  if (!v || /\{\{/.test(v)) return v;
  if (!['input','select','multi_select'].includes(step.action)) return v;
  const suggested = suggestDateVariable(v);
  return suggested || v;
}

function suggestDateVariable(value) {
  const parsed = parseSimpleDate(value);
  if (!parsed) return '';
  const today = stripTime(new Date());
  const delta = Math.round((parsed.getTime() - today.getTime()) / 86400000);
  if (delta === 0) return '{{today}}';
  if (delta === -1) return '{{yesterday}}';
  if (delta === 1) return '{{tomorrow}}';
  return '';
}

function parseSimpleDate(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(\d{4})[-/.年]?(\d{1,2})[-/.月]?(\d{1,2})日?$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return stripTime(d);
}
function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function sameElement(a = {}, b = {}) {
  const ak = a.selector || a.xpath || a.stableText || a.text || '';
  const bk = b.selector || b.xpath || b.stableText || b.text || '';
  return !!ak && ak === bk;
}

async function runTaskById(taskId, opts = {}) {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  const task = tasks.find(t => t.id === taskId);
  if (!task) throw new Error('任务不存在');
  if (task.enabled === false && !opts.manual) return;
  return await runTask(task, opts);
}

async function runTask(task, opts = {}) {
  if (running.has(task.id)) return;
  running.set(task.id, true);
  const settings = mergeSettings((await chrome.storage.local.get(['settings'])).settings || {});
  const run = {
    id: uid('run'),
    taskId: task.id,
    taskName: task.name,
    status: 'running',
    startedAt: new Date().toISOString(),
    currentStepLabel: '准备打开页面',
    stepLogs: [],
    downloadedFiles: [],
    screenshots: [],
    manual: !!opts.manual
  };

  let tabId = null;
  try {
    await upsertLog(run);
    if (settings.notifyOnTaskStart) await showNotification('WebLoop：任务开始', `${task.name} 已开始执行`);
    const tab = await chrome.tabs.create({ url: task.startUrl, active: !!settings.activateTabWhenRunning });
    tabId = tab.id;
    await waitForTabComplete(tabId, 45000).catch(() => null);
    await injectContent(tabId);
    const runStart = Date.now();
    const runDeadline = Date.now() + Math.max(60000, Number(settings.runTimeoutMinutes || 10) * 60000);
    const startIndex = Math.max(0, Number(opts.startIndex || 0));

    for (let i = startIndex; i < task.steps.length; i++) {
      if (Date.now() > runDeadline) throw new Error('运行超时：超过单次任务最长执行时间');
      const step = task.steps[i];
      run.currentStepLabel = `第 ${i + 1}/${task.steps.length} 步：${step.label || step.action}`;
      run.stepLogs.push({ stepId: step.id, action: step.action, label: step.label, status: 'running', startedAt: new Date().toISOString() });
      await upsertLog(run);

      try {
        const stepResult = await executeStepWithRetry(tabId, task, step, settings, runStart);
        if (step.action === 'wait_download' && stepResult?.file) run.downloadedFiles.push(stepResult.file);
        if (step.action === 'screenshot' && stepResult?.screenshot) {
          run.screenshots.push(stepResult.screenshot);
          run.stepLogs[run.stepLogs.length - 1].screenshot = stepResult.screenshot;
        }
        run.stepLogs[run.stepLogs.length - 1].status = 'success';
        run.stepLogs[run.stepLogs.length - 1].endedAt = new Date().toISOString();
        if (settings.followNewTabsAfterClick && ['click','double_click','check','uncheck'].includes(step.action)) {
          const maybe = await maybeSwitchToNewestRelatedTab(tabId, task.startUrl, runStart).catch(() => null);
          if (maybe && maybe !== tabId) {
            tabId = maybe;
            await injectContent(tabId).catch(() => null);
          }
        }
      } catch (err) {
        run.stepLogs[run.stepLogs.length - 1].status = 'failed';
        run.stepLogs[run.stepLogs.length - 1].error = err.message || String(err);
        run.stepLogs[run.stepLogs.length - 1].endedAt = new Date().toISOString();
        throw err;
      }
    }

    if (settings.screenshotOnSuccess && tabId) {
      const shot = await captureAndDownloadScreenshot(tabId, task, '成功现场').catch(() => null);
      if (shot) run.screenshots.push(shot);
    }
    run.status = 'success';
    run.endedAt = new Date().toISOString();
    run.currentStepLabel = '执行完成';
    await upsertLog(run);
    if (settings.notifyOnSuccess) await showNotification(run.downloadedFiles[0] ? 'WebLoop：下载完成' : 'WebLoop：任务完成', `${task.name} 已执行完成${run.downloadedFiles[0] ? '：' + basename(run.downloadedFiles[0].filename) : ''}`);
  } catch (err) {
    run.status = looksBlocked(err) ? 'blocked' : 'failed';
    run.error = err.message || String(err);
    run.advice = classifyFailure(run.error);
    if (settings.screenshotOnFailure && tabId) {
      const shot = await captureAndDownloadScreenshot(tabId, task, '失败现场').catch(() => null);
      if (shot) run.screenshots.push(shot);
    }
    run.endedAt = new Date().toISOString();
    run.currentStepLabel = '执行未完成';
    await upsertLog(run);
    if ((run.status === 'blocked' && settings.notifyOnNeedHuman) || (run.status === 'failed' && settings.notifyOnFailure)) {
      await showNotification(run.status === 'blocked' ? 'WebLoop：需要人工接管' : 'WebLoop：任务失败', `${task.name}：${run.error}${run.advice ? '｜建议：' + run.advice : ''}${run.screenshots?.length ? '｜已保存截图' : ''}`);
    }
  } finally {
    running.delete(task.id);
    if (settings.closeTabAfterRun && tabId) {
      try { await chrome.tabs.remove(tabId); } catch (_) {}
    }
    await notifyPanel();
  }
}


async function executeStepWithRetry(tabId, task, step, settings, runStart) {
  const retryable = !['manual_check', 'wait_download', 'screenshot'].includes(step.action);
  const maxAttempts = retryable ? Math.max(1, Number(settings.stepRetryCount || 0) + 1) : 1;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (step.action === 'manual_check') {
        throw new Error(step.text || '需要人工接管：请在页面完成登录、验证码或人工确认后重新运行任务');
      }
      if (step.action === 'screenshot') {
        const screenshot = await captureAndDownloadScreenshot(tabId, task, step.label || '流程截图');
        return { screenshot };
      }
      if (step.action === 'wait_download') {
        const file = await waitForDownload(task.downloadRule, step.timeoutMs || task.downloadRule.timeoutMs || 600000, runStart);
        return { file };
      }
      await ensureTabReady(tabId);
      await injectContent(tabId);
      const executableStep = resolveStepVariables(step, settings);
      if (['input', 'select', 'multi_select', 'clear_field'].includes(executableStep.action)) {
        const mainWorldResult = await runValueStepInMainWorld(tabId, executableStep).catch(() => null);
        if (mainWorldResult?.ok) {
          await sleep(400);
          await ensureTabReady(tabId);
          return mainWorldResult;
        }
      }
      const res = await runStepInBestFrame(tabId, executableStep);
      if (!res?.ok) throw new Error(res?.error || '页面步骤执行失败');
      await sleep(400);
      await ensureTabReady(tabId);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) await sleep(600 + attempt * 500);
    }
  }
  throw lastErr || new Error('步骤执行失败');
}

async function sendToFrames(tabId, message) {
  const frames = await getFrames(tabId);
  let sent = 0;
  for (const frame of frames) {
    try {
      await chrome.tabs.sendMessage(tabId, message, { frameId: frame.frameId });
      sent++;
    } catch (_) {}
  }
  if (!sent) await chrome.tabs.sendMessage(tabId, message);
  return sent;
}

async function runStepInBestFrame(tabId, step) {
  const errors = [];
  const frames = await getFrames(tabId);
  const candidates = rankFramesForStep(frames, step);
  for (const frame of candidates) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: 'RR_RUN_STEP', payload: { step } }, { frameId: frame.frameId });
      if (res?.ok) return res;
      if (res?.error) errors.push(`[frame ${frame.frameId}] ${res.error}`);
    } catch (err) {
      errors.push(`[frame ${frame.frameId}] ${err.message || String(err)}`);
    }
  }
  // Fallback for environments where frame addressing behaves differently.
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'RR_RUN_STEP', payload: { step } });
    if (res?.ok) return res;
    if (res?.error) errors.push(res.error);
  } catch (err) {
    errors.push(err.message || String(err));
  }
  return { ok: false, error: errors.slice(0, 4).join(' | ') || '没有可执行的页面帧' };
}


async function runValueStepInMainWorld(tabId, step) {
  const frames = await getFrames(tabId);
  const candidates = rankFramesForStep(frames, step);
  const errors = [];
  for (const frame of candidates) {
    try {
      const injected = await chrome.scripting.executeScript({
        target: { tabId, frameIds: [frame.frameId] },
        world: 'MAIN',
        func: mainWorldValueRunner,
        args: [step]
      });
      const res = injected?.[0]?.result;
      if (res?.ok) return res;
      if (res?.error) errors.push(`[frame ${frame.frameId}] ${res.error}`);
    } catch (err) {
      errors.push(`[frame ${frame.frameId}] ${err.message || String(err)}`);
    }
  }
  return { ok: false, error: errors.slice(0, 4).join(' | ') || '主上下文输入失败' };
}

function mainWorldValueRunner(step) {
  const fp = step.element || {};
  const value = step.action === 'multi_select' && Array.isArray(step.value) ? step.value : String(step.value ?? '');
  function normalize(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function stableText(s) {
    let t = normalize(s);
    t = t.replace(/\.\.\.|…/g, '');
    t = t.replace(/(加载|查询|导出|下载|提交|保存|处理中|进行中|loading)中$/i, '$1');
    t = t.replace(/^(正在|请稍候|loading\s*)/i, '');
    t = t.replace(/\s*(loading|please wait)$/i, '');
    return normalize(t);
  }
  function visibleText(el) {
    if (!el) return '';
    const aria = el.getAttribute?.('aria-label') || '';
    const title = el.getAttribute?.('title') || '';
    const placeholder = el.getAttribute?.('placeholder') || '';
    const val = el.tagName?.toLowerCase() === 'input' && ['button','submit','reset'].includes((el.type || '').toLowerCase()) ? el.value : '';
    return normalize(aria || title || placeholder || val || el.innerText || el.textContent || '').slice(0, 160);
  }
  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  }
  function queryAllDeep(selector, root = document) {
    const out = [];
    const visit = (node) => {
      if (!node) return;
      try { out.push(...Array.from(node.querySelectorAll?.(selector) || [])); } catch (e) {}
      const all = [];
      try { all.push(...Array.from(node.querySelectorAll?.('*') || [])); } catch (e) {}
      for (const el of all) if (el.shadowRoot) visit(el.shadowRoot);
    };
    visit(root);
    return [...new Set(out)];
  }
  function textQueries() {
    return [...new Set([fp.stableText, fp.text, ...(fp.altTexts || [])]
      .map(stableText).filter(Boolean).map(x => x.slice(0, 80)))];
  }
  function findElement() {
    const candidates = [];
    if (fp.selector) { try { candidates.push(...queryAllDeep(fp.selector)); } catch (e) {} }
    if (fp.xpath) {
      try {
        const res = document.evaluate(fp.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < res.snapshotLength; i++) candidates.push(res.snapshotItem(i));
      } catch (e) {}
    }
    if (fp.attrs) {
      const pool = queryAllDeep(fp.tag || '*');
      for (const el of pool) {
        if (fp.attrs.name && el.getAttribute('name') === fp.attrs.name) candidates.push(el);
        if (fp.attrs.title && el.getAttribute('title') === fp.attrs.title) candidates.push(el);
        if (fp.attrs.ariaLabel && el.getAttribute('aria-label') === fp.attrs.ariaLabel) candidates.push(el);
      }
    }
    const qs = textQueries();
    if (qs.length) {
      const pool = queryAllDeep('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], .ant-select, .ant-select-selector, .ant-picker, .el-select, .el-input, .el-date-editor');
      for (const q of qs) {
        const exact = pool.find(el => stableText(visibleText(el)) === q);
        if (exact) candidates.push(exact);
      }
      for (const q of qs) {
        const partial = pool.find(el => {
          const t = stableText(visibleText(el));
          return t && (t.includes(q) || q.includes(t));
        });
        if (partial) candidates.push(partial);
      }
    }
    const unique = [...new Set(candidates)].filter(Boolean);
    return unique.find(isVisible) || unique[0] || null;
  }
  function dispatchValueEvents(el) {
    try { el.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true })); } catch (e) {}
    try {
      const inputEvent = typeof InputEvent === 'function'
        ? new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: String(el.value ?? el.textContent ?? '') })
        : new Event('input', { bubbles: true, cancelable: true });
      el.dispatchEvent(inputEvent);
    } catch (e) { try { el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); } catch (_) {} }
    try { el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true })); } catch (e) {}
    try { el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: true })); } catch (e) {}
    try { el.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true })); } catch (e) {}
  }
  function setInput(el) {
    el.scrollIntoView?.({ block: 'center', inline: 'center' });
    el.focus?.();
    if (el.isContentEditable || el.getAttribute?.('contenteditable') === 'true' || el.getAttribute?.('role') === 'textbox') {
      el.textContent = value;
      dispatchValueEvents(el);
      el.blur?.();
      return true;
    }
    const inner = !(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)
      ? el.querySelector?.('input, textarea, [contenteditable="true"], [role="textbox"]')
      : null;
    if (inner) return setInput(inner);
    if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return false;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(el, value); else el.value = value;
    if (el._valueTracker) { try { el._valueTracker.setValue(''); } catch (e) {} }
    dispatchValueEvents(el);
    try { el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })); } catch (e) {}
    try { el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })); } catch (e) {}
    el.blur?.();
    return true;
  }
  function setSelect(el) {
    el.scrollIntoView?.({ block: 'center', inline: 'center' });
    if (el instanceof HTMLSelectElement) {
      const options = Array.from(el.options || []);
      const values = Array.isArray(value) ? value.map(normalize) : String(value || '').split(/[,，;；|]/).map(x => normalize(x)).filter(Boolean);
      if (step.action === 'multi_select' || el.multiple) {
        for (const opt of options) {
          opt.selected = values.includes(normalize(opt.value)) || values.includes(normalize(opt.textContent || ''));
        }
        dispatchValueEvents(el);
        return true;
      }
      const byValue = options.find(o => String(o.value) === String(value));
      const byText = options.find(o => normalize(o.textContent || '') === normalize(value));
      const finalValue = (byValue || byText)?.value ?? value;
      const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      if (desc?.set) desc.set.call(el, finalValue); else el.value = finalValue;
      dispatchValueEvents(el);
      return true;
    }
    // Custom dropdown fallback: click trigger, then visible option(s).
    el.click?.();
    const values = Array.isArray(value) ? value : String(value || '').split(/[,，;；|]/).map(x => x.trim()).filter(Boolean);
    const pool = () => queryAllDeep('[role="option"], .ant-select-item-option, .el-select-dropdown__item, li, [class*="option"], [class*="dropdown"] li, [class*="menu"] li');
    let clicked = false;
    for (const v of values.length ? values : [String(value || '')]) {
      const q = normalize(v);
      const opt = pool().find(x => isVisible(x) && normalize(x.innerText || x.textContent || x.getAttribute('title') || '').includes(q));
      if (opt) { opt.click?.(); clicked = true; }
    }
    if (clicked) return true;
    const inner = el.querySelector?.('input, textarea, [role="textbox"]');
    if (inner) return setInput(inner);
    return false;
  }

  const el = findElement();
  if (el && isVisible(el)) {
    const ok = (step.action === 'select' || step.action === 'multi_select') ? setSelect(el) : setInput(el);
    return ok ? { ok: true, via: 'main-world' } : { ok: false, error: '找到元素但无法写入该控件' };
  }
  return { ok: false, error: `未找到可输入/筛选的元素：${fp.stableText || fp.text || fp.selector || fp.xpath || '未知元素'}` };
}

async function highlightStep(tabId, step) {
  if (!tabId) return { ok: false, error: '没有活动页面' };
  await injectContent(tabId);
  const res = await runStepInBestFrame(tabId, { ...step, action: 'highlight' });
  return res?.ok ? { ok: true } : { ok: false, error: res?.error || '定位失败' };
}

async function importBackup(tasks, settings) {
  if (!Array.isArray(tasks)) return { ok: false, error: 'tasks 格式错误' };
  const normalized = tasks.map(t => normalizeTask(t)).filter(t => t.startUrl && t.steps?.length).slice(0, 200);
  const next = { tasks: normalized };
  if (settings) next.settings = mergeSettings(settings);
  await chrome.storage.local.set(next);
  await rescheduleAll();
  await notifyPanel();
  return { ok: true, count: normalized.length };
}


async function maybeSwitchToNewestRelatedTab(currentTabId, startUrl, sinceTs) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const baseOrigin = safeOrigin(startUrl);
  const candidates = tabs
    .filter(t => t.id && t.id !== currentTabId && /^https?:/.test(t.url || '') && (!baseOrigin || safeOrigin(t.url) === baseOrigin))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  const newest = candidates.find(t => !sinceTs || (t.lastAccessed || 0) >= sinceTs - 2000);
  if (!newest) return currentTabId;
  await waitForTabComplete(newest.id, 30000).catch(() => null);
  return newest.id;
}

function safeOrigin(url) {
  try { return new URL(url).origin; } catch (_) { return ''; }
}

async function getFrames(tabId) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    if (Array.isArray(frames) && frames.length) return frames;
  } catch (_) {}
  return [{ frameId: 0, url: '' }];
}

function rankFramesForStep(frames, step) {
  const preferred = [];
  const rest = [];
  const stepUrl = step.frameUrl || step.element?.frame?.href || '';
  for (const f of frames) {
    let score = 0;
    if (Number.isFinite(Number(step.frameId)) && Number(step.frameId) === f.frameId) score += 100;
    if (stepUrl && f.url === stepUrl) score += 90;
    if (stepUrl && sameOriginPath(f.url, stepUrl)) score += 60;
    if (!stepUrl && f.frameId === 0) score += 20;
    (score ? preferred : rest).push({ ...f, score });
  }
  preferred.sort((a, b) => b.score - a.score);
  rest.sort((a, b) => a.frameId - b.frameId);
  return [...preferred, ...rest];
}

function sameOriginPath(a, b) {
  try {
    const ua = new URL(a), ub = new URL(b);
    return ua.origin === ub.origin && ua.pathname === ub.pathname;
  } catch { return false; }
}

function resolveStepVariables(step, settings = {}) {
  if (settings.dynamicVariables === false) return step;
  const next = structuredClone(step);
  if (typeof next.value === 'string') next.value = resolveVariables(next.value);
  if (Array.isArray(next.value)) next.value = next.value.map(v => typeof v === 'string' ? resolveVariables(v) : v);
  if (typeof next.text === 'string') next.text = resolveVariables(next.text);
  return next;
}

function resolveVariables(input) {
  return String(input ?? '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => evaluateVariable(expr.trim()));
}

function evaluateVariable(expr) {
  const [namePart, fmtPart] = expr.split('|').map(x => x.trim());
  const fmt = fmtPart || 'YYYY-MM-DD';
  const now = new Date();
  const lower = namePart.toLowerCase();
  if (lower === 'now') return formatDate(now, fmtPart || 'YYYY-MM-DD HH:mm:ss');
  if (lower === 'timestamp') return String(now.getTime());
  if (lower === 'today') return formatDate(addDays(now, 0), fmt);
  if (lower === 'yesterday') return formatDate(addDays(now, -1), fmt);
  if (lower === 'tomorrow') return formatDate(addDays(now, 1), fmt);
  if (lower === 'month_start') return formatDate(startOfMonth(now), fmt);
  if (lower === 'month_end') return formatDate(endOfMonth(now), fmt);
  if (lower === 'last_month_start') return formatDate(startOfMonth(addMonths(now, -1)), fmt);
  if (lower === 'last_month_end') return formatDate(endOfMonth(addMonths(now, -1)), fmt);
  if (lower === 'this_month') return formatDate(now, fmtPart || 'YYYY-MM');
  if (lower === 'last_month') return formatDate(addMonths(now, -1), fmtPart || 'YYYY-MM');
  const m = lower.match(/^date\s*:\s*([+-]?\d+)$/);
  if (m) return formatDate(addDays(now, Number(m[1])), fmt);
  return `{{${expr}}}`;
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function pad(n) { return String(n).padStart(2, '0'); }
function formatDate(d, fmt) {
  const map = {
    YYYY: String(d.getFullYear()),
    YY: String(d.getFullYear()).slice(-2),
    MM: pad(d.getMonth() + 1),
    M: String(d.getMonth() + 1),
    DD: pad(d.getDate()),
    D: String(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  };
  return String(fmt || 'YYYY-MM-DD').replace(/YYYY|YY|MM|M|DD|D|HH|mm|ss/g, k => map[k]);
}

async function injectContent(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content_script.js'] });
  } catch (err) {
    // Some cross-origin or restricted frames may reject allFrames injection. Keep the top frame usable.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content_script.js'] });
  }
}

async function ensureTabReady(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'loading') await waitForTabComplete(tabId, 30000);
  } catch (_) {}
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => finish(false), timeoutMs);
    const listener = (id, info) => {
      if (id === tabId && info.status === 'complete') finish(true);
    };
    function finish(ok) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      ok ? resolve() : reject(new Error('页面加载超时'));
    }
    chrome.tabs.get(tabId).then(tab => {
      if (tab.status === 'complete') finish(true);
      else chrome.tabs.onUpdated.addListener(listener);
    }).catch(reject);
  });
}

async function waitForDownload(rule = {}, timeoutMs = 600000, runStartMs = Date.now()) {
  const startedAfter = Math.max(0, runStartMs - 3000);
  const deadline = Date.now() + timeoutMs;
  let lastSeen = null;
  while (Date.now() < deadline) {
    const candidates = await chrome.downloads.search({ startedAfter: new Date(startedAfter).toISOString() });
    candidates.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    for (const item of candidates) {
      if (item.state === 'interrupted') throw new Error(`下载中断：${item.error || 'unknown error'}`);
      if (item.state === 'in_progress') lastSeen = item;
      if (item.state === 'complete') {
        const file = downloadToFile(item);
        if (validateDownload(file, rule)) return file;
        lastSeen = item;
      }
    }
    await sleep(600);
  }
  if (lastSeen?.state === 'complete') throw new Error(`下载完成但校验未通过：${basename(lastSeen.filename || '')}`);
  throw new Error('等待下载超时：没有检测到完成的文件');
}

function downloadToFile(item) {
  return {
    id: item.id,
    filename: item.filename || '',
    url: item.url || '',
    mime: item.mime || '',
    fileSize: item.fileSize || item.totalBytes || item.bytesReceived || 0,
    startedAt: item.startTime,
    endedAt: item.endTime,
    exists: item.exists !== false
  };
}

function validateDownload(file, rule = {}) {
  if ((rule.validationMode || 'loose') !== 'strict') return true;
  const ext = extensionOf(file.filename);
  const allowed = (rule.extensions || []).map(x => String(x).replace(/^\./, '').toLowerCase());
  if (allowed.length && !allowed.includes(ext)) return false;
  if (Number(rule.minSizeBytes || 0) > 0 && Number(file.fileSize || 0) < Number(rule.minSizeBytes)) return false;
  return true;
}


async function captureCurrentTabScreenshot(tabId, label = '手动截图') {
  if (!tabId) return { ok: false, error: '没有活动页面' };
  const { draft } = await chrome.storage.local.get(['draft']);
  const taskLike = draft || { name: '当前页面截图' };
  const screenshot = await captureAndDownloadScreenshot(tabId, taskLike, label);
  await showNotification('WebLoop：截图已保存', basename(screenshot.filename));
  return { ok: true, screenshot };
}

async function captureAndDownloadScreenshot(tabId, task, label = '截图') {
  const tab = await chrome.tabs.get(tabId);
  if (!tab?.windowId) throw new Error('无法获取当前窗口用于截图');
  try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
  try { await chrome.tabs.update(tabId, { active: true }); } catch (_) {}
  await sleep(260);
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const settings = mergeSettings((await chrome.storage.local.get(['settings'])).settings || {});
  const dir = sanitizePathSegment(settings.screenshotDirectory || 'WebLoop Screenshots');
  const taskName = sanitizePathSegment(task?.name || 'task');
  const labelName = sanitizePathSegment(label || 'screenshot');
  const filename = `${dir}/${taskName}_${labelName}_${fileTimestamp(new Date())}.png`;
  const id = await chrome.downloads.download({ url: dataUrl, filename, saveAs: false, conflictAction: 'uniquify' });
  return { id, filename, label, capturedAt: new Date().toISOString() };
}

function sanitizePathSegment(input) {
  return String(input || 'screenshot')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'screenshot';
}

function fileTimestamp(d) {
  const pad2 = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

async function upsertLog(log) {
  const { logs = [] } = await chrome.storage.local.get(['logs']);
  const idx = logs.findIndex(l => l.id === log.id);
  const next = idx >= 0 ? logs.map(l => l.id === log.id ? log : l) : [log, ...logs];
  await chrome.storage.local.set({ logs: next.slice(0, MAX_LOGS) });
  await notifyPanel();
}

async function rescheduleAll() {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  const existing = await chrome.alarms.getAll();
  await Promise.all(existing.filter(a => a.name.startsWith(ALARM_PREFIX)).map(a => chrome.alarms.clear(a.name)));
  for (const task of tasks) await scheduleTask(task);
}

async function scheduleTask(task) {
  const name = ALARM_PREFIX + task.id;
  await chrome.alarms.clear(name);
  if (!task.enabled) return;
  if (task.schedule?.type === 'daily' || task.schedule?.type === 'workdays') {
    await chrome.alarms.create(name, { when: nextDailyTimestamp(task.schedule.time || '08:30'), periodInMinutes: 1440 });
  }
  if (task.schedule?.type === 'interval') {
    const minutes = Math.max(0.5, Number(task.schedule.intervalMinutes || 60));
    await chrome.alarms.create(name, { delayInMinutes: minutes, periodInMinutes: minutes });
  }
}

function nextDailyTimestamp(hhmm) {
  const [h, m] = String(hhmm || '08:30').split(':').map(Number);
  const next = new Date();
  next.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 30, 0, 0);
  if (next.getTime() <= Date.now() + 30000) next.setDate(next.getDate() + 1);
  return next.getTime();
}

async function notifyPanel() {
  try { await chrome.runtime.sendMessage({ type: 'RR_STATE_CHANGED' }); } catch (_) {}
}

async function showNotification(title, message) {
  try {
    await chrome.notifications.create(uid('ntf'), { type: 'basic', iconUrl: 'icons/icon128.png', title, message: String(message || '').slice(0, 240), priority: 1 });
  } catch (err) { console.warn('notification failed', err); }
}

function classifyFailure(message = '') {
  const m = String(message || '');
  if (/未找到元素/.test(m) && /悬浮|hover|菜单/.test(m)) return '先在点击前增加“悬浮触发”，或用“点击元素”重新选择真实按钮。';
  if (/未找到元素/.test(m)) return '优先用“点击元素/等待元素”重新点选目标，避免依赖变化的按钮文案。';
  if (/iframe|frame/i.test(m)) return '检查 iframe 域名是否已授权，必要时在 iframe 内重新录制。';
  if (/下载.*超时|等待下载超时/.test(m)) return '确认导出按钮真的触发浏览器下载；部分系统先生成文件，需要增加“等待文字/等待秒数”。';
  if (/校验未通过/.test(m)) return '改成宽松校验，或放宽文件类型与最小文件大小。';
  if (/登录|captcha|验证码|授权|人工/.test(m)) return '这类步骤不能绕过，建议添加“人工接管点”并手动处理后重跑。';
  return '';
}

function uid(prefix = 'id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function hostFromUrl(url) { try { return new URL(url).host; } catch { return '当前页面'; } }
function originFromUrl(url) { try { const u = new URL(url); return `${u.protocol}//${u.host}`; } catch { return ''; } }
function extensionOf(filename) { const m = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; }
function basename(path) { return String(path || '').split(/[\\/]/).pop(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function looksBlocked(err) { return /login|登录|captcha|验证码|permission|授权|未找到元素|需要人工/i.test(err.message || String(err)); }
