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
    provider: 'none',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    apiKey: '',
    shareMode: 'minimal'
  }
};

const state = {
  view: 'today',
  tasks: [],
  logs: [],
  settings: structuredClone(DEFAULT_SETTINGS),
  draft: null,
  recording: null,
  currentTab: null
};

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload });
}

async function refreshState(quiet = false) {
  try {
    const res = await send('RR_GET_STATE');
    state.tasks = res.tasks || [];
    state.logs = res.logs || [];
    state.settings = mergeSettings(res.settings || {});
    state.draft = res.draft || null;
    state.recording = res.recording || null;
    state.currentTab = await getCurrentTabSafe();
    render();
  } catch (err) {
    if (!quiet) showToast(`刷新失败：${err.message || err}`);
  }
}

function mergeSettings(input) {
  return {
    ...structuredClone(DEFAULT_SETTINGS),
    ...input,
    llm: { ...DEFAULT_SETTINGS.llm, ...(input.llm || {}) }
  };
}

async function getCurrentTabSafe() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  } catch (_) { return null; }
}

function showToast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function hostFromUrl(url) {
  try { return new URL(url).host; } catch { return '当前页面'; }
}

function originPatternFromUrl(url) {
  const u = new URL(url);
  return `${u.protocol}//${u.host}/*`;
}

function shortUrl(url) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch { return url || '—'; }
}

function formatTime(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return v; }
}

function scheduleLabel(s = {}) {
  if (s.type === 'daily') return `每天 ${s.time || '08:30'}`;
  if (s.type === 'workdays') return `工作日 ${s.time || '08:30'}`;
  if (s.type === 'interval') return `每 ${s.intervalMinutes || 60} 分钟`;
  return '手动执行';
}

function badge(status) {
  const map = {
    success: ['success', '已完成'],
    failed: ['failed', '失败'],
    running: ['running', '运行中'],
    blocked: ['blocked', '需人工'],
    idle: ['idle', '待执行'],
    paused: ['paused', '已暂停'],
    enabled: ['success', '启用']
  };
  const [cls, text] = map[status] || map.idle;
  return `<span class="badge ${cls}">${text}</span>`;
}

function latestLog(taskId) {
  return state.logs.find(l => l.taskId === taskId) || null;
}

function render() {
  renderHero();
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#view${state.view[0].toUpperCase()}${state.view.slice(1)}`).classList.add('active');
  if (state.view === 'today') renderToday();
  if (state.view === 'builder') renderBuilder();
  if (state.view === 'tasks') renderTasks();
  if (state.view === 'logs') renderLogs();
  if (state.view === 'settings') renderSettings();
}

function renderHero() {
  const dot = $('.pulse-dot');
  const running = state.logs.find(l => l.status === 'running');
  const failed = state.logs.find(l => l.status === 'failed' || l.status === 'blocked');
  dot.className = 'pulse-dot';
  if (state.recording?.active) {
    dot.classList.add('running');
    $('#heroTitle').textContent = '正在自动录制';
    $('#heroSub').textContent = `已记录 ${state.draft?.steps?.length || 0} 步。真实操作页面即可。`;
  } else if (running) {
    dot.classList.add('running');
    $('#heroTitle').textContent = '任务正在执行';
    $('#heroSub').textContent = `${running.taskName || '下载任务'}：${running.currentStepLabel || '准备中'}`;
  } else if (failed) {
    dot.classList.add(failed.status === 'blocked' ? 'blocked' : 'failed');
    $('#heroTitle').textContent = '最近任务需要处理';
    $('#heroSub').textContent = `${failed.taskName || '下载任务'}：${failed.error || '执行失败'}`;
  } else if (state.tasks.length) {
    $('#heroTitle').textContent = '任务已就绪';
    $('#heroSub').textContent = `${state.tasks.filter(t => t.enabled !== false).length} 个启用任务。`;
  } else {
    $('#heroTitle').textContent = '准备就绪';
    $('#heroSub').textContent = 'Open the target web app page后开始录制。可自动填表、筛选、下载。';
  }
}

function renderToday() {
  const root = $('#viewToday');
  if (!state.tasks.length) {
    root.innerHTML = $('#emptyTodayTemplate').innerHTML;
    bindActions(root);
    return;
  }
  const enabled = state.tasks.filter(t => t.enabled !== false);
  const todayKey = new Date().toDateString();
  const todaySuccess = state.logs.filter(l => l.status === 'success' && new Date(l.startedAt).toDateString() === todayKey).length;
  root.innerHTML = `
    <div class="section-head">
      <div><h2>今日任务</h2><p>${todaySuccess}/${enabled.length} 个启用任务今日完成</p></div>
      <button class="primary" data-action="create-draft">+ 录制</button>
    </div>
    ${state.tasks.map(renderTaskCard).join('')}
  `;
  bindActions(root);
}

function renderTaskCard(task) {
  const log = latestLog(task.id);
  const status = log?.status || (task.enabled === false ? 'paused' : 'idle');
  const file = log?.downloadedFiles?.[0]?.filename?.split(/[\\/]/).pop() || '—';
  return `
    <article class="task-card" data-id="${escapeHtml(task.id)}">
      <div class="task-card-head">
        <div><h3 class="task-name">${escapeHtml(task.name)}</h3><div class="task-url">${escapeHtml(shortUrl(task.startUrl))}</div></div>
        ${badge(status)}
      </div>
      <div class="task-meta">
        <div class="meta"><span>触发方式</span><strong>${escapeHtml(scheduleLabel(task.schedule))}</strong></div>
        <div class="meta"><span>步骤</span><strong>${task.steps?.length || 0} 步</strong></div>
        <div class="meta"><span>最近执行</span><strong>${formatTime(log?.startedAt)}</strong></div>
        <div class="meta"><span>最近文件</span><strong>${escapeHtml(file)}</strong></div>
      </div>
      <div class="task-actions">
        <button class="soft" data-action="run-task" data-id="${escapeHtml(task.id)}">立即运行</button>
        <button class="secondary" data-action="edit-task" data-id="${escapeHtml(task.id)}">编辑</button>
        <button class="ghost" data-action="toggle-task" data-id="${escapeHtml(task.id)}">${task.enabled === false ? '启用' : '暂停'}</button>
      </div>
    </article>`;
}

function renderBuilder() {
  const root = $('#viewBuilder');
  if (!state.draft) {
    root.innerHTML = `
      <div class="empty-card simple-empty">
        <div class="empty-icon">●</div>
        <h2>录一次，以后自动做</h2>
        <p>适合企业老系统：自动填日期、筛选条件、点击查询、悬浮导出、下载文件，完成后通知。</p>
        <button class="primary wide" data-action="create-draft">Start from current page</button>
      </div>
      <div class="card quick-guide-card">
        <div class="guide-title">推荐用法</div>
        <div class="guide-steps">
          <div><b>1</b><span>Open the target web app page</span></div>
          <div><b>2</b><span>开始录制，然后正常操作一遍</span></div>
          <div><b>3</b><span>Stop recording，保存并测试</span></div>
        </div>
      </div>
      <div class="card">
        <div class="section-head"><div><h2>它可以做什么</h2><p>默认不用理解工作流。</p></div></div>
        <div class="scenario-grid">
          <div class="scenario"><strong>报表下载</strong><span>填日期 → 查询 → 导出 → 通知</span></div>
          <div class="scenario"><strong>表单填报</strong><span>填写字段 → 提交 → 等成功提示</span></div>
          <div class="scenario"><strong>筛选查询</strong><span>选择条件 → 查询 → 停在结果页</span></div>
        </div>
      </div>`;
    bindActions(root);
    return;
  }

  const d = state.draft;
  const rec = state.recording?.active;
  root.innerHTML = `
    <div class="card builder-hero ${rec ? 'is-recording' : ''}">
      <div class="builder-hero-top">
        <div>
          <h2>${rec ? '正在录制' : '录制一个老系统任务'}</h2>
          <p>${rec ? '现在回到网页，像平时一样操作。插件会自动记录关键动作。' : '默认只需要三个动作：开始录制、Stop recording、保存并测试。'}</p>
        </div>
        ${rec ? '<span class="recording-pill"><span></span>录制中</span>' : badge(d.enabled === false ? 'paused' : 'enabled')}
      </div>
      <div class="big-actions">
        ${rec ? `<button class="danger wide" data-action="stop-recording">Stop recording</button>` : `<button class="primary wide" data-action="start-recording">Start recording</button>`}
        <button class="soft wide" data-action="test-draft" ${!d.steps?.length ? 'disabled' : ''}>Save and test now</button>
      </div>
      <button class="ghost wide screenshot-now" data-action="capture-screenshot">保存当前页面截图</button>
      <p class="help">只录关键业务动作。误录的步骤可以删除。日期字段可以改成 {{yesterday}}、{{today}}、{{month_start}}。</p>
    </div>

    <div class="card">
      <div class="section-head">
        <div><h2>任务名称和运行方式</h2><p>${escapeHtml(shortUrl(d.startUrl))}</p></div>
      </div>
      <div class="stack compact-form">
        <label class="field">任务名称<input id="draftName" value="${escapeHtml(d.name || '')}" placeholder="例如：销售日报下载" /></label>
        <div class="schedule-switch">
          <label><input type="radio" name="scheduleQuick" value="manual" ${d.schedule?.type === 'manual' ? 'checked' : ''}/><span>手动</span></label>
          <label><input type="radio" name="scheduleQuick" value="daily" ${d.schedule?.type === 'daily' ? 'checked' : ''}/><span>每天</span></label>
          <label><input type="radio" name="scheduleQuick" value="workdays" ${d.schedule?.type === 'workdays' ? 'checked' : ''}/><span>工作日</span></label>
          <label><input type="radio" name="scheduleQuick" value="interval" ${d.schedule?.type === 'interval' ? 'checked' : ''}/><span>周期</span></label>
        </div>
        <div class="grid2 schedule-extra">
          ${scheduleInputs(d.schedule)}
          <label class="checkbox-row"><input id="draftEnabled" type="checkbox" ${d.enabled !== false ? 'checked' : ''}/>启用自动运行</label>
        </div>
        <details class="advanced-block">
          <summary>高级：起始地址</summary>
          <div class="divider"></div>
          <label class="field">起始地址<input id="draftUrl" value="${escapeHtml(d.startUrl || '')}" /></label>
        </details>
      </div>
    </div>

    <div class="card">
      <div class="section-head">
        <div><h2>流程步骤</h2><p>${d.steps?.length || 0} 步。先看懂流程，再测试。</p></div>
        <button class="secondary" data-action="polish-steps" ${!d.steps?.length ? 'disabled' : ''}>Clean up flow</button>
      </div>
      ${renderFlowSummary(d.steps || [])}
      ${renderAudit(d)}
      ${renderSteps(d.steps || [])}
      <details class="advanced-block action-drawer">
        <summary>需要补步骤时再打开</summary>
        <div class="divider"></div>
        <div class="tool-grid">
          <button class="secondary" data-action="pick-click">点击元素</button>
          <button class="secondary" data-action="pick-input">填写字段</button>
          <button class="secondary" data-action="pick-select">选择下拉</button>
          <button class="secondary" data-action="pick-clear">清空字段</button>
          <button class="secondary" data-action="pick-check">勾选选项</button>
          <button class="secondary" data-action="pick-uncheck">取消勾选</button>
          <button class="secondary" data-action="pick-double-click">双击元素</button>
          <button class="secondary" data-action="pick-hover">悬浮触发</button>
          <button class="secondary" data-action="pick-wait-element">等待元素</button>
          <button class="secondary" data-action="add-wait-text">等待文字</button>
          <button class="secondary" data-action="add-wait-text-gone">等待消失</button>
          <button class="secondary" data-action="add-wait-stable">页面稳定</button>
          <button class="secondary" data-action="add-press-key">按键</button>
          <button class="secondary" data-action="add-scroll">滚动页面</button>
          <button class="secondary" data-action="add-screenshot">保存截图</button>
          <button class="secondary" data-action="add-wait-download">等待下载</button>
          <button class="secondary" data-action="add-manual-check">人工接管</button>
          <button class="danger" data-action="clear-steps">清空步骤</button>
        </div>
      </details>
    </div>

    <div class="card">
      <details class="advanced-block">
        <summary>高级：下载校验和超时，默认不用改</summary>
        <div class="divider"></div>
        <div class="stack">
          <label class="field">校验模式
            <select id="validationMode">
              <option value="loose" ${d.downloadRule?.validationMode !== 'strict' ? 'selected' : ''}>宽松：检测到下载完成即可</option>
              <option value="strict" ${d.downloadRule?.validationMode === 'strict' ? 'selected' : ''}>严格：检查文件类型和大小</option>
            </select>
          </label>
          <div class="grid2">
            <label class="field">文件类型<input id="extensions" value="${escapeHtml((d.downloadRule?.extensions || ['xlsx','xls','csv','pdf','zip']).join(','))}" /></label>
            <label class="field">最小大小 KB<input id="minSizeKb" type="number" min="0" value="${Math.round((d.downloadRule?.minSizeBytes || 0) / 1024)}" /></label>
          </div>
          <label class="field">下载超时秒<input id="downloadTimeout" type="number" min="10" value="${Math.round((d.downloadRule?.timeoutMs || 600000) / 1000)}" /></label>
        </div>
      </details>
    </div>

    <div class="card sticky-save">
      <div class="grid2">
        <button class="primary" data-action="save-task">保存任务</button>
        <button class="soft" data-action="test-draft" ${!d.steps?.length ? 'disabled' : ''}>保存并测试</button>
      </div>
      <button class="ghost wide" data-action="discard-draft">放弃草稿</button>
    </div>
  `;
  bindDraftInputs(root);
  bindActions(root);
}

function renderFlowSummary(steps = []) {
  if (!steps.length) return '';
  const fill = steps.filter(s => ['input','select','multi_select','clear_field','check','uncheck'].includes(s.action)).length;
  const click = steps.filter(s => ['click','double_click','hover','press_key','scroll'].includes(s.action)).length;
  const wait = steps.filter(s => ['wait_download','wait_text','wait_text_gone','wait_element','wait_stable','wait','screenshot'].includes(s.action)).length;
  const manual = steps.filter(s => s.action === 'manual_check').length;
  return `<div class="flow-summary">
    <span>填写/筛选 <b>${fill}</b></span>
    <span>点击/悬浮 <b>${click}</b></span>
    <span>等待/下载 <b>${wait}</b></span>
    ${manual ? `<span>人工接管 <b>${manual}</b></span>` : ''}
  </div>`;
}

function scheduleInputs(s = {}) {
  if (s.type === 'interval') {
    return `<label class="field">间隔分钟<input id="intervalMinutes" type="number" min="1" value="${escapeHtml(s.intervalMinutes || 60)}" /></label>`;
  }
  if (s.type === 'daily' || s.type === 'workdays') {
    return `<label class="field">执行时间<input id="dailyTime" type="time" value="${escapeHtml(s.time || '08:30')}" /></label>`;
  }
  return `<label class="field">运行方式<input value="手动点击立即运行" disabled /></label>`;
}

function renderSteps(steps) {
  if (!steps.length) return `<div class="notice empty-steps">还没有步骤。点击“Start recording”，然后在网页里真实操作一遍：填条件 → 查询 → 导出/提交。</div>`;
  return `<div class="steps simple-steps">${steps.map((s, i) => {
    const c = elementConfidence(s);
    const showConfidence = ['click','double_click','input','select','multi_select','clear_field','check','uncheck','hover','wait_element'].includes(s.action);
    return `<div class="step" data-step-id="${escapeHtml(s.id)}">
      <div class="step-index">${i + 1}</div>
      <div class="step-main">
        <div class="step-title">${escapeHtml(stepTitle(s))}${showConfidence ? ` <span class="confidence ${confidenceClass(c)}">${c.label}</span>` : ''}</div>
        <div class="step-sub">${escapeHtml(stepSub(s))}</div>
        ${renderStepEditor(s)}
      </div>
      <div class="step-actions compact-step-actions">
        <button title="定位高亮" data-action="highlight-step" data-id="${escapeHtml(s.id)}">◎</button>
        <button title="从本步测试" data-action="run-from-step" data-id="${escapeHtml(s.id)}">▶</button>
        <button title="删除" data-action="delete-step" data-id="${escapeHtml(s.id)}">×</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function renderAudit(d) {
  const warnings = auditDraft(d);
  if (!warnings.length) return `<div class="notice ok">流程检查：没有明显问题。建议保存后先“立即测试”一次。</div>`;
  return `<div class="audit-box">${warnings.map(w => `<div class="audit-item">${escapeHtml(w)}</div>`).join('')}</div>`;
}

function auditDraft(d) {
  const steps = d.steps || [];
  const warnings = [];
  if (!steps.length) return ['还没有步骤。先Start recording，或用精确点选添加关键步骤。'];
  const hasDownload = steps.some(s => s.action === 'wait_download');
  const hasWait = steps.some(s => ['wait_download','wait_text','wait_text_gone','wait_element','wait'].includes(s.action));
  if (!hasWait) warnings.push('没有等待步骤。老系统查询/导出通常需要“等待文字、等待元素或等待下载”。');
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const text = `${s.label || ''} ${s.element?.text || ''} ${s.element?.stableText || ''}`;
    if (/导出中|下载中|加载中|查询中|处理中|loading/i.test(text)) warnings.push(`第 ${i + 1} 步可能录到了临时状态文案，建议重新点选稳定按钮。`);
    if (s.action === 'click' && /导出|下载|export|download/i.test(text)) {
      const prev = steps[i - 1];
      if (!prev || prev.action !== 'hover') warnings.push(`第 ${i + 1} 步是导出/下载点击；如果按钮需鼠标悬浮才出现，请在前面增加“悬浮触发”。`);
    }
    if (s.action === 'input' && /日期|date|时间|开始|结束|from|to/i.test(`${s.label || ''} ${s.element?.nearText || ''}`) && !/\{\{/.test(String(s.value || ''))) {
      warnings.push(`第 ${i + 1} 步像日期字段，建议改成 {{yesterday}}、{{today}} 或 {{month_start}} 这类动态变量。`);
    }
  }
  if (!hasDownload) warnings.push('当前流程不等待下载；如果这是填报/查询任务可以忽略，如果是报表下载请添加“等待下载”。');
  return [...new Set(warnings)].slice(0, 5);
}

function renderStepEditor(s) {
  if (['input','select','multi_select'].includes(s.action)) {
    const label = s.action === 'input' ? '填充值' : (s.action === 'multi_select' ? '多选值，逗号分隔' : '选择值');
    return `<div class="step-editor">
      <label>${label}<input class="step-value-input" data-step-edit="value" data-step-id="${escapeHtml(s.id)}" value="${escapeHtml(s.value || '')}" placeholder="固定值或 {{yesterday}}" /></label>
      <div class="var-chips">
        ${variableChips(s.id)}
      </div>
    </div>`;
  }
  if (s.action === 'wait_text') {
    return `<div class="step-editor"><label>等待文字<input data-step-edit="text" data-step-id="${escapeHtml(s.id)}" value="${escapeHtml(s.text || '')}" placeholder="例如：查询完成 / 导出完成" /></label></div>`;
  }
  if (s.action === 'wait_text_gone') {
    return `<div class="step-editor"><label>等待消失的文字<input data-step-edit="text" data-step-id="${escapeHtml(s.id)}" value="${escapeHtml(s.text || '')}" placeholder="例如：加载中 / 导出中 / 查询中" /></label></div>`;
  }
  if (s.action === 'manual_check') {
    return `<div class="step-editor"><label>人工提示<input data-step-edit="text" data-step-id="${escapeHtml(s.id)}" value="${escapeHtml(s.text || '')}" placeholder="例如：请完成短信验证码后重新运行" /></label></div>`;
  }
  if (s.action === 'wait') {
    return `<div class="step-editor"><label>等待秒数<input type="number" min="1" data-step-edit="durationSeconds" data-step-id="${escapeHtml(s.id)}" value="${Math.round((s.durationMs || 1000) / 1000)}" /></label></div>`;
  }
  if (s.action === 'wait_stable') {
    return `<div class="step-editor"><label>稳定等待毫秒<input type="number" min="300" data-step-edit="quietMs" data-step-id="${escapeHtml(s.id)}" value="${Number(s.quietMs || 900)}" /></label></div>`;
  }
  if (s.action === 'press_key') {
    return `<div class="step-editor"><label>按键<input data-step-edit="key" data-step-id="${escapeHtml(s.id)}" value="${escapeHtml(s.key || 'Enter')}" placeholder="Enter / Tab / Escape" /></label></div>`;
  }
  if (s.action === 'scroll') {
    return `<div class="step-editor"><label>滚动像素<input type="number" data-step-edit="y" data-step-id="${escapeHtml(s.id)}" value="${Number(s.y || 600)}" /></label></div>`;
  }
  return '';
}

function variableChips(stepId) {
  const vars = [
    ['{{today}}', '今天'],
    ['{{yesterday}}', '昨天'],
    ['{{tomorrow}}', '明天'],
    ['{{month_start}}', '本月初'],
    ['{{month_end}}', '本月末'],
    ['{{last_month_start}}', '上月初'],
    ['{{last_month_end}}', '上月末'],
    ['{{date:-7}}', '近7天']
  ];
  return vars.map(([value, label]) => `<button type="button" class="chip" data-action="insert-variable" data-id="${escapeHtml(stepId)}" data-value="${escapeHtml(value)}">${escapeHtml(label)}</button>`).join('');
}

function stepTitle(s) {
  const map = { hover: '悬浮触发', click: '点击元素', double_click: '双击元素', input: '填写字段', clear_field: '清空字段', select: '选择筛选项', multi_select: '多选筛选', check: '勾选选项', uncheck: '取消勾选', scroll: '滚动页面', wait_download: '等待下载', wait_element: '等待元素', wait_text: '等待文字', wait_text_gone: '等待文字消失', wait_stable: '等待页面稳定', press_key: '按键', screenshot: '保存截图', manual_check: '人工接管点', wait: '等待' };
  return s.label || map[s.action] || s.action;
}

function stepSub(s) {
  if (s.action === 'hover') return `鼠标悬浮后等待 ${Math.round((s.pauseAfterMs || 700) / 1000)} 秒，展开隐藏菜单`;
  if (s.action === 'double_click') return `双击：${s.element?.text || s.element?.selector || ''}`;
  if (s.action === 'clear_field') return `清空：${s.element?.text || s.element?.nearText || s.element?.selector || ''}`;
  if (s.action === 'check') return `确保已勾选：${s.element?.text || s.element?.nearText || ''}`;
  if (s.action === 'uncheck') return `确保未勾选：${s.element?.text || s.element?.nearText || ''}`;
  if (s.action === 'multi_select') return `多选：${Array.isArray(s.value) ? s.value.join('，') : (s.value || '')}`;
  if (s.action === 'scroll') return s.element ? '滚动到目标元素' : `页面滚动 ${s.y || 600}px`;
  if (s.action === 'wait_download') return `等待文件下载完成，超时 ${Math.round((s.timeoutMs || 600000) / 1000)} 秒`;
  if (s.action === 'wait') return `等待 ${Math.round((s.durationMs || 1000) / 1000)} 秒`;
  if (s.action === 'wait_element') return `等待元素出现：${s.element?.text || s.element?.nearText || s.element?.selector || ''}`;
  if (s.action === 'wait_text') return `等待页面出现文字：${s.text || ''}`;
  if (s.action === 'wait_text_gone') return `等待页面文字消失：${s.text || ''}`;
  if (s.action === 'wait_stable') return `等待 DOM ${Math.round((s.quietMs || 900) / 1000)} 秒内无明显变化`;
  if (s.action === 'press_key') return `按键：${s.key || 'Enter'}`;
  if (s.action === 'manual_check') return s.text || '到这里停止并通知用户人工处理';
  if (s.value && s.action !== 'click') return `${s.element?.text || s.element?.selector || ''} = ${s.value}`;
  return s.element?.text || s.element?.nearText || s.element?.selector || '页面元素';
}


function elementConfidence(s) {
  if (!['click','double_click','input','select','multi_select','clear_field','check','uncheck','hover','wait_element'].includes(s.action)) return { score: 100, label: '规则' };
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
function confidenceClass(c) { return c.score >= 75 ? 'good' : c.score >= 50 ? 'mid' : 'low'; }

function bindDraftInputs(root) {
  const save = debounce(async () => {
    const d = readDraftFromDom();
    await send('RR_SAVE_DRAFT', { draft: d });
    state.draft = d;
  }, 250);
  ['draftName','draftUrl','scheduleType','dailyTime','intervalMinutes','draftEnabled','validationMode','extensions','minSizeKb','downloadTimeout'].forEach(id => {
    const el = $(`#${id}`, root);
    if (el) el.addEventListener('input', save);
    if (el) el.addEventListener('change', async () => {
      if (id === 'scheduleType') {
        await save.flush?.();
        await refreshState(true);
      } else save();
    });
  });
  root.querySelectorAll('input[name="scheduleQuick"]').forEach(el => {
    el.addEventListener('change', async () => {
      await save.flush?.();
      await refreshState(true);
    });
  });
  root.querySelectorAll('[data-step-edit]').forEach(el => {
    el.addEventListener('input', debounce(() => updateStepFieldFromInput(el), 250));
    el.addEventListener('change', () => updateStepFieldFromInput(el));
  });
}

function readDraftFromDom() {
  const d = structuredClone(state.draft);
  d.name = $('#draftName')?.value?.trim() || d.name;
  d.startUrl = $('#draftUrl')?.value?.trim() || d.startUrl;
  d.enabled = $('#draftEnabled')?.checked !== false;
  const type = document.querySelector('input[name="scheduleQuick"]:checked')?.value || $('#scheduleType')?.value || 'manual';
  d.schedule = { type };
  if (type === 'daily' || type === 'workdays') d.schedule.time = $('#dailyTime')?.value || '08:30';
  if (type === 'interval') d.schedule.intervalMinutes = Math.max(1, Number($('#intervalMinutes')?.value || 60));
  d.downloadRule = d.downloadRule || {};
  d.downloadRule.validationMode = $('#validationMode')?.value || 'loose';
  d.downloadRule.extensions = ($('#extensions')?.value || 'xlsx,xls,csv,pdf,zip').split(',').map(x => x.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);
  d.downloadRule.minSizeBytes = Math.max(0, Number($('#minSizeKb')?.value || 0)) * 1024;
  d.downloadRule.timeoutMs = Math.max(10, Number($('#downloadTimeout')?.value || 600)) * 1000;
  return d;
}

async function updateStepFieldFromInput(el) {
  const stepId = el.dataset.stepId;
  const field = el.dataset.stepEdit;
  const d = readDraftMaybe();
  const step = (d.steps || []).find(x => x.id === stepId);
  if (!step) return;
  if (field === 'durationSeconds') step.durationMs = Math.max(1, Number(el.value || 1)) * 1000;
  else if (field === 'quietMs') step.quietMs = Math.max(300, Number(el.value || 900));
  else step[field] = el.value;
  await send('RR_SAVE_DRAFT', { draft: d });
  state.draft = d;
}

async function setStepValue(stepId, value) {
  const d = readDraftMaybe();
  const step = (d.steps || []).find(x => x.id === stepId);
  if (!step) return;
  step.value = value;
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast(`已设置变量：${value}`);
}

function renderTasks() {
  const root = $('#viewTasks');
  root.innerHTML = `
    <div class="section-head"><div><h2>全部任务</h2><p>${state.tasks.length} 个任务</p></div><button class="primary" data-action="create-draft">+ 新任务</button></div>
    ${state.tasks.length ? state.tasks.map(renderTaskCard).join('') : `<div class="notice">暂无任务。先Open the target web app page录制一个。</div>`}
  `;
  bindActions(root);
}

function renderLogs() {
  const root = $('#viewLogs');
  root.innerHTML = `
    <div class="section-head"><div><h2>执行日志</h2><p>最近 ${state.logs.length} 条。失败时看这里最有用。</p></div><button class="ghost" data-action="clear-logs">清空</button></div>
    ${state.logs.length ? state.logs.map(renderLog).join('') : `<div class="notice">还没有执行记录。</div>`}
  `;
  bindActions(root);
}

function renderLog(l) {
  const file = l.downloadedFiles?.[0]?.filename?.split(/[\\/]/).pop();
  return `<div class="log">
    <div class="log-head"><div><div class="log-title">${escapeHtml(l.taskName || '下载任务')}</div><div class="log-sub">${formatTime(l.startedAt)} · ${escapeHtml(l.currentStepLabel || '')}</div></div>${badge(l.status)}</div>
    ${file ? `<div class="log-sub">文件：${escapeHtml(file)}</div>` : ''}
    ${l.screenshots?.length ? `<div class="log-sub">截图：${escapeHtml(l.screenshots.map(x => x.filename?.split(/[\\/]/).pop()).filter(Boolean).join('，'))}</div>` : ''}
    ${l.error ? `<div class="log-error">${escapeHtml(l.error)}</div>` : ''}
    ${l.advice ? `<div class="notice warn">建议：${escapeHtml(l.advice)}</div>` : ''}
    ${l.stepLogs?.length ? `<details class="collapsible"><summary>查看步骤明细</summary><div class="divider"></div>${l.stepLogs.map((s, i) => `<div class="small">${i+1}. ${escapeHtml(s.label || s.action)}：${escapeHtml(s.status)} ${s.error ? ' · ' + escapeHtml(s.error) : ''}</div>`).join('')}</details>` : ''}
  </div>`;
}

function renderSettings() {
  const s = state.settings;
  const root = $('#viewSettings');
  root.innerHTML = `
    <div class="card">
      <div class="section-head"><div><h2>基础设置</h2><p>保持默认即可。先保证任务能跑通。</p></div></div>
      <div class="stack">
        <label class="checkbox-row"><input id="activateTabWhenRunning" type="checkbox" ${s.activateTabWhenRunning ? 'checked' : ''}/>执行任务时自动切到运行页面</label>
        <label class="checkbox-row"><input id="notifyOnSuccess" type="checkbox" ${s.notifyOnSuccess ? 'checked' : ''}/>任务完成后通知我</label>
        <label class="checkbox-row"><input id="notifyOnFailure" type="checkbox" ${s.notifyOnFailure ? 'checked' : ''}/>任务失败后通知我</label>
        <label class="checkbox-row"><input id="showPageHints" type="checkbox" ${s.showPageHints !== false ? 'checked' : ''}/>录制时在网页上显示提示</label>
        <label class="checkbox-row"><input id="screenshotOnFailure" type="checkbox" ${s.screenshotOnFailure !== false ? 'checked' : ''}/>任务失败时自动保存截图</label>
        <button class="secondary wide" data-action="test-notification">发送测试通知</button>
      </div>
    </div>

    <div class="card">
      <details class="advanced-block">
        <summary>高级运行设置</summary>
        <div class="divider"></div>
        <div class="stack">
          <label class="checkbox-row"><input id="closeTabAfterRun" type="checkbox" ${s.closeTabAfterRun ? 'checked' : ''}/>运行结束后关闭自动打开的标签页</label>
          <label class="checkbox-row"><input id="notifyOnTaskStart" type="checkbox" ${s.notifyOnTaskStart ? 'checked' : ''}/>任务开始时也通知</label>
          <label class="checkbox-row"><input id="notifyOnNeedHuman" type="checkbox" ${s.notifyOnNeedHuman ? 'checked' : ''}/>需要人工接管时通知</label>
          <label class="checkbox-row"><input id="screenshotOnSuccess" type="checkbox" ${s.screenshotOnSuccess ? 'checked' : ''}/>任务成功时也保存截图</label>
          <label class="checkbox-row"><input id="followNewTabsAfterClick" type="checkbox" ${s.followNewTabsAfterClick !== false ? 'checked' : ''}/>点击后如果打开同站点新标签页，自动跟随执行</label>
          <label class="field">截图保存目录<input id="screenshotDirectory" value="${escapeHtml(s.screenshotDirectory || 'WebLoop Screenshots')}" /></label>
          <label class="checkbox-row"><input id="smartHoverRecording" type="checkbox" ${s.smartHoverRecording !== false ? 'checked' : ''}/>自动识别悬浮菜单</label>
          <label class="checkbox-row"><input id="iframeSupport" type="checkbox" ${s.iframeSupport !== false ? 'checked' : ''}/>兼容 iframe 内嵌报表页</label>
          <label class="checkbox-row"><input id="dynamicVariables" type="checkbox" ${s.dynamicVariables !== false ? 'checked' : ''}/>启用动态日期变量</label>
          <div class="grid2">
            <label class="field">步骤失败重试次数<input id="stepRetryCount" type="number" min="0" max="5" value="${Number(s.stepRetryCount ?? 1)}" /></label>
            <label class="field">单次运行最长分钟<input id="runTimeoutMinutes" type="number" min="1" max="120" value="${Number(s.runTimeoutMinutes ?? 10)}" /></label>
          </div>
          <div class="grid2">
            <button class="secondary" data-action="export-backup">导出任务备份</button>
            <button class="secondary" data-action="import-backup">导入任务备份</button>
          </div>
        </div>
      </details>
    </div>

    <div class="card">
      <details class="advanced-block">
        <summary>LLM 预留，当前不用也能完整使用</summary>
        <div class="divider"></div>
        <div class="stack">
          <label class="checkbox-row"><input id="llmEnabled" type="checkbox" ${s.llm.enabled ? 'checked' : ''}/>启用 LLM 辅助，暂不自动执行修改</label>
          <label class="field">Provider<select id="llmProvider"><option value="none" ${s.llm.provider === 'none' ? 'selected' : ''}>none</option><option value="deepseek" ${s.llm.provider === 'deepseek' ? 'selected' : ''}>DeepSeek</option><option value="openai-compatible" ${s.llm.provider === 'openai-compatible' ? 'selected' : ''}>OpenAI Compatible</option></select></label>
          <label class="field">Endpoint<input id="llmEndpoint" value="${escapeHtml(s.llm.endpoint)}" /></label>
          <label class="field">Model<input id="llmModel" value="${escapeHtml(s.llm.model)}" /></label>
          <label class="field">API Key<input id="llmApiKey" type="password" value="${escapeHtml(s.llm.apiKey)}" placeholder="保存在本地 storage" /></label>
          <div class="notice warn">后续只建议上传脱敏 DOM 摘要和失败日志，不上传完整业务页面。</div>
        </div>
      </details>
    </div>`;
  ['activateTabWhenRunning','closeTabAfterRun','notifyOnTaskStart','notifyOnSuccess','notifyOnFailure','notifyOnNeedHuman','smartHoverRecording','showPageHints','iframeSupport','dynamicVariables','screenshotOnFailure','screenshotOnSuccess','followNewTabsAfterClick','screenshotDirectory','stepRetryCount','runTimeoutMinutes','llmEnabled','llmProvider','llmEndpoint','llmModel','llmApiKey'].forEach(id => {
    const el = $(`#${id}`, root);
    if (el) el.addEventListener('change', saveSettingsFromDom);
    if (el && ['llmEndpoint','llmModel','llmApiKey','screenshotDirectory'].includes(id)) el.addEventListener('input', debounce(saveSettingsFromDom, 300));
  });
  bindActions(root);
}

async function saveSettingsFromDom() {
  const s = structuredClone(state.settings);
  s.activateTabWhenRunning = $('#activateTabWhenRunning')?.checked ?? s.activateTabWhenRunning;
  s.closeTabAfterRun = $('#closeTabAfterRun')?.checked ?? s.closeTabAfterRun;
  s.notifyOnTaskStart = $('#notifyOnTaskStart')?.checked ?? s.notifyOnTaskStart;
  s.notifyOnSuccess = $('#notifyOnSuccess')?.checked ?? s.notifyOnSuccess;
  s.notifyOnFailure = $('#notifyOnFailure')?.checked ?? s.notifyOnFailure;
  s.notifyOnNeedHuman = $('#notifyOnNeedHuman')?.checked ?? s.notifyOnNeedHuman;
  s.smartHoverRecording = $('#smartHoverRecording')?.checked ?? s.smartHoverRecording;
  s.showPageHints = $('#showPageHints')?.checked ?? s.showPageHints;
  s.iframeSupport = $('#iframeSupport')?.checked ?? s.iframeSupport;
  s.dynamicVariables = $('#dynamicVariables')?.checked ?? s.dynamicVariables;
  s.screenshotOnFailure = $('#screenshotOnFailure')?.checked ?? s.screenshotOnFailure;
  s.screenshotOnSuccess = $('#screenshotOnSuccess')?.checked ?? s.screenshotOnSuccess;
  s.followNewTabsAfterClick = $('#followNewTabsAfterClick')?.checked ?? s.followNewTabsAfterClick;
  s.screenshotDirectory = $('#screenshotDirectory')?.value || s.screenshotDirectory || 'WebLoop Screenshots';
  s.stepRetryCount = Math.max(0, Math.min(5, Number($('#stepRetryCount')?.value ?? s.stepRetryCount ?? 1)));
  s.runTimeoutMinutes = Math.max(1, Math.min(120, Number($('#runTimeoutMinutes')?.value ?? s.runTimeoutMinutes ?? 10)));
  s.llm.enabled = $('#llmEnabled')?.checked ?? false;
  s.llm.provider = $('#llmProvider')?.value || 'none';
  s.llm.endpoint = $('#llmEndpoint')?.value || DEFAULT_SETTINGS.llm.endpoint;
  s.llm.model = $('#llmModel')?.value || DEFAULT_SETTINGS.llm.model;
  s.llm.apiKey = $('#llmApiKey')?.value || '';
  await send('RR_SAVE_SETTINGS', { settings: s });
  state.settings = s;
  showToast('设置已保存');
}

function bindActions(root = document) {
  root.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      try {
        if (action === 'create-draft') await createDraft();
        if (action === 'start-recording') await startRecording();
        if (action === 'stop-recording') await stopRecording();
        if (action === 'pick-click') await pickClick();
        if (action === 'pick-input') await pickInput();
        if (action === 'pick-select') await pickSelect();
        if (action === 'pick-clear') await pickAsAction('input', 'clear_field', '请在网页中点击要清空的输入框/日期框');
        if (action === 'pick-check') await pickAsAction('click', 'check', '请在网页中点击要确保勾选的选项');
        if (action === 'pick-uncheck') await pickAsAction('click', 'uncheck', '请在网页中点击要确保取消勾选的选项');
        if (action === 'pick-double-click') await pickAsAction('click', 'double_click', '请在网页中点击要双击的表格单元格/按钮');
        if (action === 'pick-hover') await pickHover();
        if (action === 'pick-wait-element') await pickWaitElement();
        if (action === 'add-wait-text') await addWaitText();
        if (action === 'add-wait-text-gone') await addWaitTextGone();
        if (action === 'add-manual-check') await addManualCheck();
        if (action === 'add-wait') await addWait();
        if (action === 'add-wait-stable') await addWaitStable();
        if (action === 'add-press-key') await addPressKey();
        if (action === 'add-scroll') await addScroll();
        if (action === 'add-screenshot') await addScreenshotStep();
        if (action === 'capture-screenshot') await captureScreenshotNow();
        if (action === 'add-wait-download') await addWaitDownload();
        if (action === 'clear-steps') await updateDraftSteps([]);
        if (action === 'polish-steps') await polishSteps();
        if (action === 'delete-step') await deleteStep(id);
        if (action === 'move-step-up') await moveStep(id, -1);
        if (action === 'move-step-down') await moveStep(id, 1);
        if (action === 'save-task') await saveTask(false);
        if (action === 'test-draft') await saveTask(true);
        if (action === 'discard-draft') await discardDraft();
        if (action === 'run-task') await runTask(id);
        if (action === 'edit-task') await editTask(id);
        if (action === 'toggle-task') await toggleTask(id);
        if (action === 'clear-logs') await clearLogs();
        if (action === 'insert-variable') await setStepValue(id, btn.dataset.value);
        if (action === 'test-notification') await testNotification();
        if (action === 'export-backup') await exportBackup();
        if (action === 'import-backup') await importBackup();
      } catch (err) {
        showToast(err.message || String(err));
      }
    });
  });
}

async function ensurePagePermission(tab) {
  if (!tab?.url || !/^https?:/.test(tab.url)) throw new Error('请先打开一个 http/https 老系统页面');
  const origin = originPatternFromUrl(tab.url);
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (!has) {
    const ok = await chrome.permissions.request({ origins: [origin] });
    if (!ok) throw new Error('未授权当前站点，无法录制或执行');
  }
}

async function createDraft() {
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  const res = await send('RR_CREATE_DRAFT', { tab: { id: tab.id, url: tab.url, title: tab.title } });
  if (!res.ok) throw new Error(res.error || '创建失败');
  state.view = 'builder';
  await refreshState(true);
  showToast('草稿已创建，可以开始录制');
}

async function startRecording() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_RECORDING', { tabId: tab.id });
  if (!res.ok) throw new Error(res.error || '录制启动失败');
  await refreshState(true);
  showToast('自动录制已开启：可悬浮菜单后点击导出');
}

async function stopRecording() {
  const res = await send('RR_STOP_RECORDING');
  if (!res.ok) throw new Error(res.error || '停止失败');
  await refreshState(true);
  showToast('录制已停止');
}

async function pickClick() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: 'click' });
  if (!res.ok) throw new Error(res.error || '点选失败');
  showToast('请在网页中点击目标元素');
}

async function pickInput() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: 'input' });
  if (!res.ok) throw new Error(res.error || '字段点选失败');
  showToast('请在网页中点击要自动填写的输入框/日期框');
}

async function pickSelect() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: 'select' });
  if (!res.ok) throw new Error(res.error || '下拉点选失败');
  showToast('请在网页中点击要自动选择的下拉框');
}


async function pickAsAction(_pickerMode, finalAction, message) {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: finalAction });
  if (!res.ok) throw new Error(res.error || '点选失败');
  showToast(message || '请在网页中点击目标元素');
}

async function pickHover() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: 'hover' });
  if (!res.ok) throw new Error(res.error || '悬浮点选失败');
  showToast('请在网页中点击“悬浮后展开菜单”的触发元素');
}

function readDraftMaybe() {
  if (!state.draft) throw new Error('请先创建草稿');
  try { return readDraftFromDom(); } catch { return state.draft; }
}

async function pickWaitElement() {
  const d = readDraftMaybe();
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_START_PICKER', { tabId: tab.id, mode: 'wait_element' });
  if (!res.ok) throw new Error(res.error || '等待元素点选失败');
  showToast('请在网页中点击“出现后才继续”的元素，例如结果表格或导出按钮');
}

async function addWaitDownload() {
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'wait_download', label: '等待下载完成', timeoutMs: d.downloadRule?.timeoutMs || 600000 });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加等待下载');
}

async function addWaitText() {
  const d = readDraftMaybe();
  const text = prompt('输入要等待出现的文字，例如：查询完成 / 导出完成 / 保存成功', '查询完成');
  if (!text) return;
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'wait_text', label: `等待文字「${text.slice(0, 20)}」`, text, timeoutMs: 30000 });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加等待文字');
}

async function addWaitTextGone() {
  const d = readDraftMaybe();
  const text = prompt('输入要等待消失的文字，例如：加载中 / 查询中 / 导出中', '加载中');
  if (!text) return;
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'wait_text_gone', label: `等待文字消失「${text.slice(0, 20)}」`, text, timeoutMs: 30000 });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加等待文字消失');
}

async function addManualCheck() {
  const d = readDraftMaybe();
  const text = prompt('人工接管提示，例如：请完成短信验证码/审批确认后重新运行', '需要人工接管：请完成验证或确认后重新运行任务');
  if (!text) return;
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'manual_check', label: '人工接管点', text, timeoutMs: 1000 });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加人工接管点');
}

async function addWait() {
  const raw = prompt('等待多少秒？', '2');
  if (!raw) return;
  const seconds = Math.max(1, Number(raw || 2));
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'wait', label: `等待 ${seconds} 秒`, durationMs: seconds * 1000, timeoutMs: seconds * 1000 + 1000 });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加等待');
}


async function addWaitStable() {
  const raw = prompt('等待页面稳定多少毫秒？适合查询后表格刷新、按钮变可点。', '900');
  if (!raw) return;
  const quietMs = Math.max(300, Number(raw || 900));
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'wait_stable', label: '等待页面稳定', quietMs, timeoutMs: Math.max(5000, quietMs + 4000), source: 'manual' });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加等待页面稳定');
}

async function addPressKey() {
  const key = prompt('输入按键：Enter / Tab / Escape / Space', 'Enter');
  if (!key) return;
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'press_key', label: `按键 ${key}`, key, timeoutMs: 3000, source: 'manual' });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast(`已添加按键：${key}`);
}


async function addScroll() {
  const raw = prompt('页面向下滚动多少像素？也可输入负数向上滚动。', '600');
  if (raw === null) return;
  const y = Number(raw || 600);
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'scroll', label: `滚动页面 ${y}px`, y, x: 0, timeoutMs: 3000, source: 'manual' });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加滚动页面');
}

async function addScreenshotStep() {
  const label = prompt('截图步骤名称，例如：查询结果截图 / 失败前截图', '保存页面截图');
  if (label === null) return;
  const d = readDraftMaybe();
  d.steps = d.steps || [];
  d.steps.push({ id: uid('step'), action: 'screenshot', label: label || '保存页面截图', timeoutMs: 8000, source: 'manual' });
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('已添加截图步骤');
}

async function captureScreenshotNow() {
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  const res = await send('RR_CAPTURE_SCREENSHOT', { tabId: tab.id, label: '手动截图' });
  if (!res.ok) throw new Error(res.error || '截图失败');
  showToast('截图已保存到下载目录');
}

async function updateDraftSteps(steps) {
  const d = readDraftMaybe();
  d.steps = steps;
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
}

async function polishSteps() {
  const d = readDraftMaybe();
  const steps = d.steps || [];
  const next = [];
  let inserted = 0;
  let variableChanged = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = structuredClone(steps[i]);
    if (['input','select'].includes(s.action) && typeof s.value === 'string') {
      const v = suggestDateVariable(s.value);
      if (v && v !== s.value) {
        s.value = v;
        variableChanged++;
      }
    }
    const prev = next[next.length - 1];
    if (prev && prev.action === s.action && sameStepTarget(prev, s) && ['hover','wait_download'].includes(s.action)) continue;
    next.push(s);
    const text = `${s.label || ''} ${s.element?.text || ''} ${s.element?.stableText || ''} ${s.element?.nearText || ''}`;
    const nextStep = steps[i + 1];
    const needsStableWait = s.action === 'click' && /查询|搜索|刷新|提交|保存|计算|生成|检索|query|search|submit|save|refresh/i.test(text);
    const followedByWait = nextStep && ['wait_stable','wait_element','wait_text','wait_text_gone','wait','wait_download'].includes(nextStep.action);
    if (needsStableWait && !followedByWait) {
      next.push({ id: uid('step'), action: 'wait_stable', label: '等待页面稳定', quietMs: 900, timeoutMs: 6000, source: 'auto-polish' });
      inserted++;
    }
  }
  d.steps = next.slice(0, 120);
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  const parts = [];
  if (inserted) parts.push(`增加 ${inserted} 个稳定等待`);
  if (variableChanged) parts.push(`变量化 ${variableChanged} 个日期值`);
  showToast(parts.length ? `流程已整理：${parts.join('，')}` : '流程已检查：没有明显可整理项');
}

function sameStepTarget(a = {}, b = {}) {
  const ak = a.element?.selector || a.element?.xpath || a.element?.stableText || a.element?.text || '';
  const bk = b.element?.selector || b.element?.xpath || b.element?.stableText || b.element?.text || '';
  return !!ak && ak === bk;
}

function suggestDateVariable(value) {
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

function parseSimpleDate(s) {
  const m = String(s).match(/^(\d{4})[-/.年]?(\d{1,2})[-/.月]?(\d{1,2})日?$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return stripTime(d);
}
function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }


async function highlightStep(id) {
  const d = readDraftMaybe();
  const step = (d.steps || []).find(s => s.id === id);
  if (!step) return;
  const tab = await getCurrentTabSafe();
  await ensurePagePermission(tab);
  const res = await send('RR_HIGHLIGHT_STEP', { tabId: tab.id, step });
  if (!res.ok) throw new Error(res.error || '定位失败');
  showToast('已在页面高亮目标元素');
}

async function runFromStep(id) {
  const d = readDraftMaybe();
  const idx = (d.steps || []).findIndex(s => s.id === id);
  if (idx < 0) return;
  await saveTask(false);
  const taskId = d.id;
  const res = await send('RR_RUN_TASK_FROM_STEP', { taskId, startIndex: idx });
  if (!res.ok) throw new Error(res.error || '运行失败');
  state.view = 'logs';
  await refreshState(true);
  showToast(`已从第 ${idx + 1} 步开始测试`);
}

async function deleteStep(id) {
  const d = readDraftMaybe();
  d.steps = (d.steps || []).filter(s => s.id !== id);
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
  showToast('步骤已删除');
}

async function moveStep(id, delta) {
  const d = readDraftMaybe();
  const steps = d.steps || [];
  const i = steps.findIndex(s => s.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= steps.length) return;
  [steps[i], steps[j]] = [steps[j], steps[i]];
  d.steps = steps;
  await send('RR_SAVE_DRAFT', { draft: d });
  await refreshState(true);
}

async function saveTask(runAfterSave) {
  const d = readDraftMaybe();
  await send('RR_SAVE_DRAFT', { draft: d });
  const res = await send('RR_SAVE_DRAFT_AS_TASK');
  if (!res.ok) throw new Error(res.error || '保存失败');
  showToast(runAfterSave ? '任务已保存，开始测试' : '任务已保存');
  state.view = runAfterSave ? 'logs' : 'today';
  await refreshState(true);
  if (runAfterSave) await runTask(res.taskId);
}

async function discardDraft() {
  await send('RR_DISCARD_DRAFT');
  state.view = 'today';
  await refreshState(true);
  showToast('已放弃草稿');
}

async function runTask(id) {
  const res = await send('RR_RUN_TASK', { taskId: id });
  if (!res.ok) throw new Error(res.error || '运行失败');
  state.view = 'logs';
  await refreshState(true);
  showToast('已开始运行');
}

async function editTask(id) {
  const res = await send('RR_EDIT_TASK_AS_DRAFT', { taskId: id });
  if (!res.ok) throw new Error(res.error || '打开编辑失败');
  state.view = 'builder';
  await refreshState(true);
}

async function toggleTask(id) {
  const res = await send('RR_TOGGLE_TASK', { taskId: id });
  if (!res.ok) throw new Error(res.error || '切换失败');
  await refreshState(true);
}

async function clearLogs() {
  await send('RR_CLEAR_LOGS');
  await refreshState(true);
  showToast('日志已清空');
}

async function testNotification() {
  const res = await send('RR_TEST_NOTIFICATION');
  if (!res.ok) throw new Error(res.error || '通知测试失败');
  showToast('测试通知已发送');
}


async function exportBackup() {
  const data = { version: '0.9.0', exportedAt: new Date().toISOString(), tasks: state.tasks, settings: state.settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `webloop-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('任务备份已导出');
}

async function importBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.tasks)) throw new Error('备份文件不包含 tasks');
    const ok = confirm(`将导入 ${data.tasks.length} 个任务。是否覆盖当前任务？`);
    if (!ok) return;
    const res = await send('RR_IMPORT_BACKUP', { tasks: data.tasks, settings: data.settings || null });
    if (!res.ok) throw new Error(res.error || '导入失败');
    await refreshState(true);
    showToast('任务备份已导入');
  };
  input.click();
}

function debounce(fn, wait) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.flush = () => {
    clearTimeout(timer);
    return fn();
  };
  return wrapped;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'RR_STATE_CHANGED') refreshState(true);
});

$$('.tab').forEach(btn => btn.addEventListener('click', () => {
  state.view = btn.dataset.view;
  render();
}));
$('#refreshBtn').addEventListener('click', () => refreshState());

refreshState();
setInterval(() => refreshState(true), 1800);
