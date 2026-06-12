(() => {
  if (window.__REPORT_RUNNER_V9__) return;
  window.__REPORT_RUNNER_V9__ = true;

  let recorderActive = false;
  let recorderOptions = { smartHoverRecording: true, showPageHints: true };
  let pickerActive = false;
  let pickerMode = 'click';
  let overlay = null;
  let highlight = null;
  let lastTarget = null;
  let hoverTimer = null;
  let lastHoverKey = '';
  let lastHoverAt = 0;
  let lastClickKey = '';
  let lastClickAt = 0;
  const inputTimers = new WeakMap();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      if (message?.type === 'RR_RECORDER_START') {
        startRecorder(message.payload?.options || {});
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === 'RR_RECORDER_STOP') {
        stopRecorder();
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === 'RR_PICKER_START') {
        startPicker(message.payload?.mode || 'click');
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === 'RR_RUN_STEP') {
        const result = await runStep(message.payload?.step || {});
        sendResponse(result);
        return;
      }
      sendResponse({ ok: false, error: 'Unknown message' });
    })().catch(err => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  });

  function startRecorder(options = {}) {
    if (recorderActive) return;
    recorderOptions = { ...recorderOptions, ...options };
    recorderActive = true;
    if (recorderOptions.showPageHints !== false) {
      showFloating('WebLoop 正在录制：可直接操作网页。悬浮菜单、点击、输入、选择都会被记录；下载会自动追加等待步骤。');
    }
    document.addEventListener('mouseover', onRecordHover, true);
    document.addEventListener('pointerover', onRecordHover, true);
    document.addEventListener('click', onRecordClick, true);
    document.addEventListener('dblclick', onRecordDoubleClick, true);
    document.addEventListener('input', onRecordInput, true);
    document.addEventListener('change', onRecordChange, true);
  }

  function stopRecorder() {
    recorderActive = false;
    clearTimeout(hoverTimer);
    document.removeEventListener('mouseover', onRecordHover, true);
    document.removeEventListener('pointerover', onRecordHover, true);
    document.removeEventListener('click', onRecordClick, true);
    document.removeEventListener('dblclick', onRecordDoubleClick, true);
    document.removeEventListener('input', onRecordInput, true);
    document.removeEventListener('change', onRecordChange, true);
    hideFloating();
  }

  function onRecordHover(event) {
    if (!recorderActive || pickerActive || recorderOptions.smartHoverRecording === false) return;
    if (isOurUi(event.target)) return;
    const target = findHoverTarget(event.target);
    if (!target) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      if (!recorderActive || pickerActive || !target.isConnected) return;
      const element = buildElementFingerprint(target);
      const key = fingerprintKey(element);
      if (!key) return;
      if (key === lastHoverKey && Date.now() - lastHoverAt < 5000) return;
      lastHoverKey = key;
      lastHoverAt = Date.now();
      sendRecordedStep({
        id: makeId('step'),
        action: 'hover',
        label: element.text ? `悬浮「${element.text.slice(0, 28)}」` : '悬浮触发展开',
        element,
        timeoutMs: 12000,
        pauseAfterMs: 500,
        createdAt: new Date().toISOString(),
        source: 'auto-hover'
      });
    }, 420);
  }

  function onRecordClick(event) {
    if (!recorderActive || pickerActive) return;
    if (isOurUi(event.target)) return;
    const choice = findChoiceControl(event.target);
    if (choice) {
      setTimeout(() => recordChoice(choice), 80);
      return;
    }
    if (shouldRecordField(event.target) || event.target?.isContentEditable) return;
    const actionable = findActionable(event.target) || event.target;
    const element = buildElementFingerprint(actionable);
    const key = fingerprintKey(element);
    if (key && key === lastClickKey && Date.now() - lastClickAt < 650) return;
    lastClickKey = key;
    lastClickAt = Date.now();
    const label = element.text ? `点击「${element.text.slice(0, 28)}」` : '点击页面元素';
    sendRecordedStep({
      id: makeId('step'),
      action: 'click',
      label,
      element,
      timeoutMs: 12000,
      createdAt: new Date().toISOString(),
      source: 'auto'
    });
  }

  function onRecordDoubleClick(event) {
    if (!recorderActive || pickerActive) return;
    if (isOurUi(event.target)) return;
    if (shouldRecordField(event.target) || event.target?.isContentEditable) return;
    const actionable = findActionable(event.target) || event.target;
    const element = buildElementFingerprint(actionable);
    sendRecordedStep({
      id: makeId('step'),
      action: 'double_click',
      label: element.text ? `双击「${element.text.slice(0, 28)}」` : '双击页面元素',
      element,
      timeoutMs: 12000,
      createdAt: new Date().toISOString(),
      source: 'auto-dblclick'
    });
  }

  function findChoiceControl(target) {
    if (!target?.closest) return null;
    return target.closest('input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], .ant-checkbox, .el-checkbox, .ant-radio, .el-radio');
  }

  function recordChoice(el) {
    if (!recorderActive || pickerActive || !el?.isConnected) return;
    const real = el.matches?.('input[type="checkbox"], input[type="radio"]') ? el : el.querySelector?.('input[type="checkbox"], input[type="radio"]') || el;
    const checked = real.checked === true || real.getAttribute?.('aria-checked') === 'true' || el.getAttribute?.('aria-checked') === 'true';
    const element = buildElementFingerprint(el);
    sendRecordedStep({
      id: makeId('step'),
      action: checked ? 'check' : 'uncheck',
      label: `${checked ? '勾选' : '取消勾选'}「${(element.text || element.nearText || '选项').slice(0, 28)}」`,
      element,
      value: checked,
      timeoutMs: 12000,
      createdAt: new Date().toISOString(),
      source: 'auto-choice'
    });
  }

  function onRecordInput(event) {
    if (!recorderActive || pickerActive) return;
    const el = event.target;
    if (!shouldRecordField(el)) return;
    clearTimeout(inputTimers.get(el));
    inputTimers.set(el, setTimeout(() => recordField(el), 650));
  }

  function onRecordChange(event) {
    if (!recorderActive || pickerActive) return;
    const el = event.target;
    if (!shouldRecordField(el)) return;
    clearTimeout(inputTimers.get(el));
    recordField(el);
  }

  function sendRecordedStep(step) {
    chrome.runtime.sendMessage({ type: 'RR_RECORDED_STEP', payload: { step } });
  }

  function recordField(el) {
    const element = buildElementFingerprint(el);
    const tag = el.tagName.toLowerCase();
    const value = getElementValue(el);
    if (value === '' && tag !== 'select') return;
    const action = tag === 'select' && el.multiple ? 'multi_select' : (tag === 'select' ? 'select' : 'input');
    const labelBase = element.text || element.nearText || element.selector || (action.includes('select') ? '下拉框' : '输入框');
    sendRecordedStep({
      id: makeId('step'),
      action,
      label: action === 'multi_select' ? `多选「${labelBase.slice(0, 24)}」` : (action === 'select' ? `选择「${labelBase.slice(0, 24)}」` : `输入「${labelBase.slice(0, 24)}」`),
      element,
      value: action === 'multi_select' ? getMultiSelectValue(el) : value,
      timeoutMs: 12000,
      createdAt: new Date().toISOString(),
      source: 'auto'
    });
  }

  function shouldRecordField(el) {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName.toLowerCase();
    if (el.isContentEditable || el.getAttribute('role') === 'textbox') return true;
    if (tag === 'select') return true;
    if (tag === 'textarea') return true;
    if (tag !== 'input') return false;
    const type = String(el.getAttribute('type') || 'text').toLowerCase();
    return !['password', 'hidden', 'file', 'checkbox', 'radio', 'button', 'submit', 'reset'].includes(type);
  }

  function findActionable(target) {
    if (!target?.closest) return null;
    return target.closest('button, a, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], input[type="checkbox"], input[type="radio"], [role="button"], [role="menuitem"], [role="option"], [role="combobox"], [aria-haspopup="listbox"], [onclick], .btn, .button, [class*="btn"], [class*="button"], .ant-select, .ant-select-selector, .ant-picker, .el-select, .el-input, .el-date-editor, [class*="select"], [class*="picker"]');
  }

  function findHoverTarget(target) {
    if (!target?.closest) return null;
    const el = target.closest('[aria-haspopup="true"], [aria-expanded], [data-toggle], [data-bs-toggle], [data-trigger], [class*="dropdown"], [class*="menu"], [class*="more"], [class*="export"], [class*="download"], .ant-dropdown-trigger, .el-dropdown, .dropdown, button, a, [role="button"]');
    if (!el || el === document.body || el === document.documentElement) return null;
    if (shouldRecordField(el)) return null;
    const text = visibleText(el).toLowerCase();
    const cls = String(el.className || '').toLowerCase();
    const hint = `${text} ${cls} ${el.getAttribute('aria-haspopup') || ''} ${el.getAttribute('aria-expanded') || ''}`;
    if (/导出|下载|更多|菜单|操作|export|download|more|menu|dropdown|ellipsis/.test(hint)) return el;
    if (el.matches?.('[aria-haspopup="true"], [aria-expanded], [data-toggle], [data-bs-toggle], [data-trigger], .ant-dropdown-trigger, .el-dropdown')) return el;
    return null;
  }

  function startPicker(mode = 'click') {
    stopPicker(false);
    pickerActive = true;
    pickerMode = mode;
    overlay = document.createElement('div');
    overlay.id = 'rr-picker-overlay';
    overlay.textContent = pickerHint(mode);
    Object.assign(overlay.style, {
      position: 'fixed', left: '14px', top: '14px', zIndex: '2147483647',
      background: 'rgba(17,24,39,.95)', color: '#fff', padding: '10px 12px', borderRadius: '12px',
      font: '13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Microsoft YaHei,sans-serif',
      boxShadow: '0 18px 45px rgba(0,0,0,.24)', pointerEvents: 'none'
    });
    highlight = document.createElement('div');
    highlight.id = 'rr-picker-highlight';
    Object.assign(highlight.style, {
      position: 'fixed', zIndex: '2147483646', border: '2px solid #2563eb', borderRadius: '10px',
      background: 'rgba(37,99,235,.10)', boxShadow: '0 0 0 4px rgba(37,99,235,.16)',
      pointerEvents: 'none', display: 'none'
    });
    document.documentElement.appendChild(overlay);
    document.documentElement.appendChild(highlight);
    document.addEventListener('mouseover', onPickerHover, true);
    document.addEventListener('mousemove', onPickerMove, true);
    document.addEventListener('click', onPickerClick, true);
    document.addEventListener('keydown', onPickerKey, true);
  }

  function stopPicker(cancelled = true) {
    if (!pickerActive && !overlay && !highlight) return;
    pickerActive = false;
    document.removeEventListener('mouseover', onPickerHover, true);
    document.removeEventListener('mousemove', onPickerMove, true);
    document.removeEventListener('click', onPickerClick, true);
    document.removeEventListener('keydown', onPickerKey, true);
    overlay?.remove();
    highlight?.remove();
    overlay = null;
    highlight = null;
    lastTarget = null;
    if (cancelled) chrome.runtime.sendMessage({ type: 'RR_PICKER_CANCELLED' });
  }

  function onPickerHover(event) {
    if (!pickerActive || isOurUi(event.target)) return;
    lastTarget = pickerTarget(event.target);
    drawHighlight(lastTarget);
  }

  function onPickerMove() {
    if (pickerActive && lastTarget) drawHighlight(lastTarget);
  }

  function pickerHint(mode) {
    if (mode === 'hover') return 'WebLoop：点击“需要悬浮”的触发元素，Esc 取消';
    if (mode === 'input') return 'WebLoop：点击要自动填写的输入框/日期框，Esc 取消';
    if (mode === 'clear_field') return 'WebLoop：点击要自动清空的输入框/日期框，Esc 取消';
    if (mode === 'check') return 'WebLoop：点击要确保勾选的选项，Esc 取消';
    if (mode === 'uncheck') return 'WebLoop：点击要确保取消勾选的选项，Esc 取消';
    if (mode === 'double_click') return 'WebLoop：点击要双击的单元格/按钮，Esc 取消';
    if (mode === 'wait_element') return 'WebLoop：点击要等待出现的元素，Esc 取消';
    if (mode === 'select') return 'WebLoop：点击要自动选择的下拉框/多选筛选器，Esc 取消';
    return 'WebLoop：点击要记录的元素，Esc 取消';
  }

  function pickerTarget(target) {
    if (pickerMode === 'hover') return findHoverTarget(target) || findActionable(target) || target;
    if (pickerMode === 'input' || pickerMode === 'clear_field') return target?.closest?.('input, textarea, [contenteditable="true"], [role="textbox"], .ant-input, .el-input, .ant-picker, .el-date-editor') || target;
    if (pickerMode === 'check' || pickerMode === 'uncheck') return findChoiceControl(target) || findActionable(target) || target;
    if (pickerMode === 'double_click') return findActionable(target) || target;
    if (pickerMode === 'wait_element') return findActionable(target) || target;
    if (pickerMode === 'select') return target?.closest?.('select, [role="combobox"], [role="listbox"], .ant-select, .el-select, .ant-cascader, .el-cascader') || target;
    return findActionable(target) || target;
  }

  function labelForPickedStep(action, element) {
    const t = element.text || element.nearText || element.selector || '页面元素';
    if (action === 'hover') return element.text ? `悬浮「${element.text.slice(0, 28)}」` : '悬浮触发展开';
    if (action === 'input') return `填写「${String(t).slice(0, 28)}」`;
    if (action === 'clear_field') return `清空「${String(t).slice(0, 28)}」`;
    if (action === 'check') return `勾选「${String(t).slice(0, 28)}」`;
    if (action === 'uncheck') return `取消勾选「${String(t).slice(0, 28)}」`;
    if (action === 'double_click') return `双击「${String(t).slice(0, 28)}」`;
    if (action === 'multi_select') return `多选「${String(t).slice(0, 28)}」`;
    if (action === 'select') return `选择「${String(t).slice(0, 28)}」`;
    if (action === 'wait_element') return element.text ? `等待「${element.text.slice(0, 28)}」出现` : '等待元素出现';
    return element.text ? `点击「${element.text.slice(0, 28)}」` : '点击页面元素';
  }

  function onPickerClick(event) {
    if (!pickerActive) return;
    event.preventDefault();
    event.stopPropagation();
    const target = pickerTarget(event.target);
    const element = buildElementFingerprint(target);
    const pickedAction = pickerMode === 'select' && target?.tagName?.toLowerCase() === 'select' && target.multiple ? 'multi_select' : (pickerMode === 'select' && target?.tagName?.toLowerCase() !== 'select' ? 'click' : pickerMode);
    sendRecordedStep({
      id: makeId('step'),
      action: pickedAction,
      label: labelForPickedStep(pickedAction, element),
      element,
      value: pickedAction === 'multi_select' ? getMultiSelectValue(target) : (pickedAction === 'clear_field' ? '' : (pickedAction === 'check' ? true : (pickedAction === 'uncheck' ? false : (['input', 'select'].includes(pickedAction) ? getElementValue(target) : undefined)))),
      timeoutMs: 12000,
      pauseAfterMs: pickedAction === 'hover' ? 700 : undefined,
      createdAt: new Date().toISOString(),
      source: 'picker'
    });
    stopPicker(false);
  }

  function onPickerKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      stopPicker(true);
    }
  }

  async function runStep(step) {
    if (step.action === 'highlight') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      flash(el, '#f59e0b');
      return { ok: true };
    }
    if (step.action === 'wait_stable') {
      await waitForDomStable(step.quietMs || 900, step.timeoutMs || 6000);
      return { ok: true };
    }
    if (step.action === 'press_key') {
      pressKey(step.key || 'Enter');
      await sleep(180);
      return { ok: true };
    }
    if (step.action === 'scroll') {
      if (step.element) {
        const el = await waitForElement(step.element, step.timeoutMs || 12000);
        el.scrollIntoView({ block: step.block || 'center', inline: 'center', behavior: 'instant' });
        flash(el, '#2563eb');
      } else {
        window.scrollBy({ top: Number(step.y || 600), left: Number(step.x || 0), behavior: 'instant' });
      }
      await sleep(220);
      return { ok: true };
    }
    if (step.action === 'hover') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      flash(el, '#2563eb');
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      await sleep(120);
      simulateHover(el);
      await sleep(Math.max(250, Number(step.pauseAfterMs || 700)));
      return { ok: true };
    }
    if (step.action === 'click') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      await clickElementLikeUser(el, false);
      return { ok: true };
    }
    if (step.action === 'double_click') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      await clickElementLikeUser(el, true);
      return { ok: true };
    }
    if (step.action === 'check' || step.action === 'uncheck') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      await setCheckedLikeUser(el, step.action === 'check');
      return { ok: true };
    }
    if (step.action === 'clear_field') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      flash(el, '#f59e0b');
      await fillFieldLikeUser(el, '');
      return { ok: true };
    }
    if (step.action === 'input') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      flash(el, '#10b981');
      await fillFieldLikeUser(el, step.value ?? '');
      await sleep(220);
      return { ok: true };
    }
    if (step.action === 'select') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      flash(el, '#10b981');
      await selectLikeUser(el, step.value ?? '');
      await sleep(220);
      return { ok: true };
    }
    if (step.action === 'multi_select') {
      const el = await waitForElement(step.element, step.timeoutMs || 12000);
      flash(el, '#10b981');
      await multiSelectLikeUser(el, step.value ?? '');
      await sleep(220);
      return { ok: true };
    }
    if (step.action === 'wait_element') {
      const el = await waitForElement(step.element, step.timeoutMs || 15000);
      flash(el, '#2563eb');
      return { ok: true };
    }
    if (step.action === 'wait_text') {
      await waitForText(step.text || '', step.timeoutMs || 15000);
      return { ok: true };
    }
    if (step.action === 'wait_text_gone') {
      await waitForTextGone(step.text || '', step.timeoutMs || 15000);
      return { ok: true };
    }
    if (step.action === 'wait') {
      await sleep(step.durationMs || 1000);
      return { ok: true };
    }
    return { ok: false, error: `Unsupported step: ${step.action}` };
  }

  async function waitForElement(fp = {}, timeoutMs = 12000) {
    const started = Date.now();
    let last = null;
    while (Date.now() - started < timeoutMs) {
      last = findElement(fp);
      if (last && isVisible(last)) return last;
      await sleep(250);
    }
    const name = fp.stableText || fp.text || fp.selector || fp.xpath || '未知元素';
    throw new Error(`未找到元素：${name}。如果它在悬浮菜单中，请在点击前增加“悬浮触发”；如果在 iframe 中，请确保 iframe 域名也已授权。`);
  }

  function findElement(fp = {}) {
    const candidates = [];
    if (fp.selector) {
      try { candidates.push(...queryAllDeep(fp.selector)); } catch (_) {}
    }
    if (fp.xpath) {
      try {
        const res = document.evaluate(fp.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < res.snapshotLength; i++) candidates.push(res.snapshotItem(i));
      } catch (_) {}
    }
    const textCandidates = textQueries(fp);
    if (textCandidates.length) {
      const pool = queryAllDeep('button, a, input, select, textarea, [contenteditable="true"], [role="textbox"], [role="button"], [role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], [role="combobox"], [aria-haspopup="listbox"], [onclick], .btn, .button, [class*="btn"], [class*="button"], [class*="menu"], [class*="dropdown"], .ant-select, .ant-select-selector, .ant-picker, .el-select, .el-input, .el-date-editor');
      for (const q of textCandidates) {
        const exact = pool.find(el => normalize(stableVisibleText(el)) === q);
        if (exact) candidates.push(exact);
      }
      for (const q of textCandidates) {
        const partial = pool.find(el => {
          const t = normalize(stableVisibleText(el));
          return t && (t.includes(q) || q.includes(t));
        });
        if (partial) candidates.push(partial);
      }
    }
    if (fp.attrs) {
      const pool = queryAllDeep(fp.tag || '*');
      for (const el of pool) {
        if (fp.attrs.name && el.getAttribute('name') === fp.attrs.name) candidates.push(el);
        if (fp.attrs.title && el.getAttribute('title') === fp.attrs.title) candidates.push(el);
        if (fp.attrs.ariaLabel && el.getAttribute('aria-label') === fp.attrs.ariaLabel) candidates.push(el);
      }
    }
    const unique = [...new Set(candidates)].filter(Boolean);
    const visible = unique.find(isVisible);
    return visible || unique[0] || null;
  }

  function textQueries(fp = {}) {
    return [...new Set([fp.stableText, fp.text, ...(fp.altTexts || [])]
      .map(stableText)
      .filter(Boolean)
      .map(x => x.slice(0, 80))
    )];
  }

  async function waitForText(text, timeoutMs) {
    const target = normalize(text);
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (!target || normalize(document.body?.innerText || document.body?.textContent || '').includes(target)) return;
      await sleep(300);
    }
    throw new Error(`等待文字超时：${text}`);
  }

  async function waitForTextGone(text, timeoutMs) {
    const target = normalize(text);
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const bodyText = normalize(document.body?.innerText || document.body?.textContent || '');
      if (!target || !bodyText.includes(target)) return;
      await sleep(300);
    }
    throw new Error(`等待文字消失超时：${text}`);
  }


  function waitForDomStable(quietMs = 900, timeoutMs = 6000) {
    return new Promise((resolve, reject) => {
      let lastChange = Date.now();
      const doneAt = Date.now() + timeoutMs;
      const observer = new MutationObserver(() => { lastChange = Date.now(); });
      try { observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true }); } catch (_) {}
      const timer = setInterval(() => {
        if (Date.now() - lastChange >= quietMs) finish(true);
        else if (Date.now() > doneAt) finish(false);
      }, 120);
      function finish(ok) {
        clearInterval(timer);
        try { observer.disconnect(); } catch (_) {}
        ok ? resolve() : reject(new Error('等待页面稳定超时'));
      }
    });
  }

  function pressKey(key = 'Enter') {
    const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.body;
    const normalized = String(key || 'Enter');
    const codeMap = { Enter: 'Enter', Tab: 'Tab', Escape: 'Escape', Esc: 'Escape', Space: 'Space', ' ': 'Space' };
    const finalKey = codeMap[normalized] || normalized;
    const init = { key: finalKey === 'Space' ? ' ' : finalKey, code: finalKey, bubbles: true, cancelable: true };
    for (const type of ['keydown', 'keypress', 'keyup']) {
      try { target.dispatchEvent(new KeyboardEvent(type, init)); } catch (_) {}
    }
  }

  function simulateHover(el) {
    const r = el.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    for (const type of ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'mousemove']) {
      try {
        const Ctor = type.startsWith('pointer') && window.PointerEvent ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Ctor(type, init));
      } catch (_) { try { el.dispatchEvent(new MouseEvent(type, init)); } catch (_) {} }
    }
  }

  function simulateClick(el) {
    const r = el.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
      try {
        const Ctor = type.startsWith('pointer') && window.PointerEvent ? PointerEvent : MouseEvent;
        el.dispatchEvent(new Ctor(type, init));
      } catch (_) { try { el.dispatchEvent(new MouseEvent(type, init)); } catch (_) {} }
    }
    if (typeof el.click === 'function') el.click();
  }

  async function clickElementLikeUser(el, doubleClick = false) {
    flash(el, '#10b981');
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await sleep(120);
    simulateHover(el);
    await sleep(120);
    simulateClick(el);
    if (doubleClick) {
      await sleep(120);
      simulateClick(el);
      try { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window })); } catch (_) {}
    }
    await sleep(300);
  }

  async function setCheckedLikeUser(el, shouldCheck) {
    el.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'instant' });
    const real = el.matches?.('input[type="checkbox"], input[type="radio"]') ? el : el.querySelector?.('input[type="checkbox"], input[type="radio"]') || el;
    const checked = real.checked === true || real.getAttribute?.('aria-checked') === 'true' || el.getAttribute?.('aria-checked') === 'true';
    if (checked !== shouldCheck || real.getAttribute?.('role') === 'checkbox' || real.getAttribute?.('role') === 'radio') {
      await clickElementLikeUser(real, false);
    } else {
      flash(real, '#10b981');
    }
    await sleep(160);
  }

  async function fillFieldLikeUser(el, value) {
    const text = String(value ?? '');
    el.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'instant' });
    simulateHover(el);
    simulateClick(el);
    await sleep(80);

    if (el?.isContentEditable || el?.getAttribute?.('contenteditable') === 'true' || el?.getAttribute?.('role') === 'textbox') {
      setContentEditableValue(el, text);
      return;
    }

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      setFrameworkValue(el, text);
      await typeTextFallback(el, text);
      // Some mask/date components update only after blur or Enter/Tab.
      for (const key of ['Enter', 'Tab']) {
        try { el.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true })); } catch (_) {}
        try { el.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true, cancelable: true })); } catch (_) {}
      }
      el.blur?.();
      return;
    }

    // Custom components: find a real input inside the wrapper first.
    const inner = el.querySelector?.('input, textarea, [contenteditable="true"], [role="textbox"]');
    if (inner && inner !== el) return await fillFieldLikeUser(inner, text);

    setContentEditableValue(el, text);
  }

  async function selectLikeUser(el, value) {
    const v = String(value ?? '');
    el.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'instant' });
    simulateHover(el);
    await sleep(80);

    if (el?.tagName?.toLowerCase() === 'select') {
      setNativeSelectValue(el, v);
      fireValueEvents(el);
      el.blur?.();
      return;
    }

    // For AntD/Element/custom selects, use a safer hybrid:
    // click the trigger, then try to click an option with matching text/value.
    simulateClick(el);
    await sleep(350);
    const option = findVisibleOption(v);
    if (option) {
      simulateHover(option);
      await sleep(80);
      simulateClick(option);
      await sleep(120);
      return;
    }

    const inner = el.querySelector?.('input, textarea, [role="textbox"]');
    if (inner) {
      await fillFieldLikeUser(inner, v);
      await sleep(160);
      pressKey('Enter');
      return;
    }

    // Fallback: keep the click behavior rather than failing hard.
    simulateClick(el);
  }

  async function multiSelectLikeUser(el, value) {
    const values = Array.isArray(value) ? value : String(value ?? '').split(/[,，;；|]/).map(x => x.trim()).filter(Boolean);
    if (!values.length) return;
    if (el?.tagName?.toLowerCase() === 'select' && el.multiple) {
      const normalized = values.map(normalize);
      for (const opt of Array.from(el.options || [])) {
        const txt = normalize(opt.textContent || '');
        opt.selected = normalized.includes(normalize(opt.value)) || normalized.includes(txt);
      }
      fireValueEvents(el);
      el.blur?.();
      return;
    }
    simulateClick(el);
    await sleep(250);
    for (const v of values) {
      const option = findVisibleOption(v);
      if (option) {
        simulateHover(option);
        await sleep(60);
        simulateClick(option);
        await sleep(160);
      }
    }
    pressKey('Escape');
  }

  async function typeTextFallback(el, text) {
    // Some masks listen to key events rather than value assignment. We dispatch a compact typing sequence
    // after the native setter. This is intentionally light to avoid making long fields slow.
    const sample = String(text ?? '').slice(0, 80);
    try { el.setSelectionRange?.(0, String(el.value || '').length); } catch (_) {}
    try { el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'deleteContentBackward', data: null })); } catch (_) {}
    for (const ch of sample) {
      try { el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true })); } catch (_) {}
      try { el.dispatchEvent(new KeyboardEvent('keypress', { key: ch, bubbles: true, cancelable: true })); } catch (_) {}
      try { el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: ch })); } catch (_) {}
      try { el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true, cancelable: true })); } catch (_) {}
    }
    fireValueEvents(el);
  }

  function findVisibleOption(value) {
    const q = normalize(value);
    const pool = queryAllDeep('[role="option"], .ant-select-item-option, .el-select-dropdown__item, li, [class*="option"], [class*="dropdown"] li, [class*="menu"] li');
    return pool.find(el => isVisible(el) && normalize(el.innerText || el.textContent || el.getAttribute('title') || '').includes(q)) || null;
  }

  function setContentEditableValue(el, value) {
    el.focus?.();
    try {
      const selection = window.getSelection?.();
      if (selection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (_) {}
    el.textContent = String(value ?? '');
    fireValueEvents(el);
    el.blur?.();
  }

  function setFrameworkValue(el, value) {
    const marker = `rr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    try { el.setAttribute('data-rr-value-target', marker); } catch (_) {}

    // First set from the isolated world so the DOM reflects the value immediately.
    setNativeInputValue(el, value);
    fireValueEvents(el);

    // Then run the same setter in the page's main world. React/Vue wrappers and
    // value trackers are much more likely to receive this as a real user-like edit.
    try {
      const script = document.createElement('script');
      script.textContent = `(() => {
        const el = document.querySelector('[data-rr-value-target="${marker}"]');
        if (!el) return;
        const value = ${JSON.stringify(String(value ?? ''))};
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, value); else el.value = value;
        if (el._valueTracker) { try { el._valueTracker.setValue(''); } catch (e) {} }
        const inputEvent = typeof InputEvent === 'function'
          ? new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value })
          : new Event('input', { bubbles: true, cancelable: true });
        el.dispatchEvent(inputEvent);
        el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
      })();`;
      (document.documentElement || document.head || document.body).appendChild(script);
      script.remove();
    } catch (_) {}

    setTimeout(() => { try { el.removeAttribute('data-rr-value-target'); } catch (_) {} }, 500);
  }

  function setNativeInputValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, String(value ?? ''));
    else el.value = String(value ?? '');
  }

  function setNativeSelectValue(el, value) {
    const v = String(value ?? '');
    const options = Array.from(el.options || []);
    const byValue = options.find(o => String(o.value) === v);
    const byText = options.find(o => normalize(o.textContent || '') === normalize(v));
    const finalValue = (byValue || byText)?.value ?? v;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    if (setter) setter.call(el, finalValue); else el.value = finalValue;
  }

  function fireValueEvents(el) {
    try { el.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true })); } catch (_) {}
    try {
      const inputEvent = typeof InputEvent === 'function'
        ? new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: String(el.value ?? el.textContent ?? '') })
        : new Event('input', { bubbles: true, cancelable: true });
      el.dispatchEvent(inputEvent);
    } catch (_) { try { el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); } catch (_) {} }
    try { el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true })); } catch (_) {}
    try { el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: true })); } catch (_) {}
    try { el.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true })); } catch (_) {}
  }

  function buildElementFingerprint(el) {
    const tag = el?.tagName?.toLowerCase?.() || '';
    const rawText = visibleText(el);
    const stable = stableText(rawText);
    const altTexts = [...new Set([
      stable,
      stableText(el?.getAttribute?.('aria-label') || ''),
      stableText(el?.getAttribute?.('title') || ''),
      stableText(el?.getAttribute?.('placeholder') || ''),
      stableText(el?.getAttribute?.('value') || ''),
      ...tokenFallbacks(stable)
    ].filter(Boolean))];
    return {
      tag,
      text: stable || rawText,
      rawText,
      stableText: stable || rawText,
      altTexts,
      selector: buildCssSelector(el),
      xpath: buildXPath(el, stable || rawText),
      value: getElementValue(el),
      nearText: getNearText(el),
      attrs: {
        inputType: el?.getAttribute?.('type') || '',
        checked: String(el?.checked ?? ''),
        multiple: String(el?.multiple ?? ''),
        id: el?.getAttribute?.('id') || '',
        name: el?.getAttribute?.('name') || '',
        title: el?.getAttribute?.('title') || '',
        ariaLabel: el?.getAttribute?.('aria-label') || '',
        role: el?.getAttribute?.('role') || ''
      },
      frame: {
        href: location.href,
        isTop: window.top === window
      }
    };
  }

  function visibleText(el) {
    if (!el) return '';
    const aria = el.getAttribute?.('aria-label') || '';
    const title = el.getAttribute?.('title') || '';
    const placeholder = el.getAttribute?.('placeholder') || '';
    const value = el.tagName?.toLowerCase() === 'input' && ['button','submit','reset'].includes((el.type || '').toLowerCase()) ? el.value : '';
    return normalize(aria || title || placeholder || value || el.innerText || el.textContent || '').slice(0, 160);
  }

  function stableVisibleText(el) { return stableText(visibleText(el)); }

  function stableText(s) {
    let t = normalize(s);
    t = t.replace(/\.\.\.|…/g, '');
    t = t.replace(/(加载|查询|导出|下载|提交|保存|处理中|进行中|loading)中$/i, '$1');
    t = t.replace(/^(正在|请稍候|loading\s*)/i, '');
    t = t.replace(/\s*(loading|please wait)$/i, '');
    return normalize(t);
  }

  function tokenFallbacks(text) {
    const t = normalize(text);
    const arr = [];
    if (/导出/.test(t)) arr.push('导出');
    if (/下载/.test(t)) arr.push('下载');
    if (/查询|搜索/.test(t)) arr.push(t.includes('搜索') ? '搜索' : '查询');
    if (/保存/.test(t)) arr.push('保存');
    if (/export/i.test(t)) arr.push('export');
    if (/download/i.test(t)) arr.push('download');
    return arr;
  }

  function getMultiSelectValue(el) {
    if (!el) return [];
    if (el.tagName?.toLowerCase() === 'select') return Array.from(el.selectedOptions || []).map(o => o.value || normalize(o.textContent || '')).filter(Boolean);
    return String(getElementValue(el) || '').split(/[,，;；|]/).map(x => x.trim()).filter(Boolean);
  }

  function getElementValue(el) {
    if (!el) return '';
    if (el.tagName?.toLowerCase() === 'select') return String(el.value || '');
    if (el.isContentEditable || el.getAttribute?.('role') === 'textbox') return String(el.textContent || '').slice(0, 300);
    if ('value' in el) return String(el.value || '').slice(0, 300);
    return '';
  }

  function getNearText(el) {
    const parts = [];
    const label = findLabelText(el);
    if (label) parts.push(label);
    const parent = el.closest?.('label, td, th, li, .form-item, .form-group, .ant-form-item, div, section');
    if (parent) parts.push(normalize(parent.innerText || parent.textContent || '').slice(0, 240));
    return [...new Set(parts.filter(Boolean))].join(' | ').slice(0, 260);
  }

  function findLabelText(el) {
    const id = el.getAttribute?.('id');
    if (id) {
      try {
        const label = document.querySelector(`label[for="${cssEscape(id)}"]`);
        if (label) return normalize(label.innerText || label.textContent || '');
      } catch (_) {}
    }
    const wrapper = el.closest?.('label');
    if (wrapper) return normalize(wrapper.innerText || wrapper.textContent || '');
    return '';
  }

  function buildCssSelector(el) {
    if (!(el instanceof Element)) return '';
    const id = el.getAttribute('id');
    if (id && isStableToken(id)) return `#${cssEscape(id)}`;
    for (const attr of ['data-testid', 'data-test', 'data-qa', 'name', 'aria-label', 'title']) {
      const value = el.getAttribute(attr);
      if (value && String(value).length < 90) return `${el.tagName.toLowerCase()}[${attr}="${attrEscape(value)}"]`;
    }
    const path = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.body && depth < 6) {
      let part = node.tagName.toLowerCase();
      const nodeId = node.getAttribute('id');
      if (nodeId && isStableToken(nodeId)) {
        part += `#${cssEscape(nodeId)}`;
        path.unshift(part);
        break;
      }
      const classes = Array.from(node.classList || []).filter(isStableToken).slice(0, 2);
      if (classes.length) part += '.' + classes.map(cssEscape).join('.');
      part += `:nth-of-type(${nthOfType(node)})`;
      path.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return path.join(' > ');
  }

  function buildXPath(el, textForPath = '') {
    if (!(el instanceof Element)) return '';
    const id = el.getAttribute('id');
    if (id && isStableToken(id)) return `//*[@id="${xpathEscape(id)}"]`;
    const text = stableText(textForPath || visibleText(el));
    if (text && text.length < 70) return `//${el.tagName.toLowerCase()}[contains(normalize-space(.), "${xpathEscape(text)}")]`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.body) {
      parts.unshift(`${node.tagName.toLowerCase()}[${nthOfType(node)}]`);
      node = node.parentElement;
    }
    return '/' + parts.join('/');
  }

  function nthOfType(el) {
    let i = 1;
    let sib = el.previousElementSibling;
    while (sib) {
      if (sib.tagName === el.tagName) i++;
      sib = sib.previousElementSibling;
    }
    return i;
  }

  function queryAllDeep(selector, root = document) {
    const out = [];
    const visit = (node) => {
      if (!node) return;
      try { out.push(...Array.from(node.querySelectorAll?.(selector) || [])); } catch (_) {}
      const all = [];
      try { all.push(...Array.from(node.querySelectorAll?.('*') || [])); } catch (_) {}
      for (const el of all) {
        if (el.shadowRoot) visit(el.shadowRoot);
      }
    };
    visit(root);
    return [...new Set(out)];
  }

  function drawHighlight(el) {
    if (!highlight || !el || el === document.documentElement || el === document.body) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    Object.assign(highlight.style, {
      display: 'block', left: `${Math.max(0, r.left - 3)}px`, top: `${Math.max(0, r.top - 3)}px`,
      width: `${Math.max(0, r.width + 6)}px`, height: `${Math.max(0, r.height + 6)}px`
    });
  }

  function flash(el, color = '#10b981') {
    const box = document.createElement('div');
    const r = el.getBoundingClientRect();
    Object.assign(box.style, {
      position: 'fixed', zIndex: '2147483645', pointerEvents: 'none', left: `${Math.max(0, r.left - 4)}px`, top: `${Math.max(0, r.top - 4)}px`,
      width: `${r.width + 8}px`, height: `${r.height + 8}px`, border: `2px solid ${color}`, borderRadius: '10px', background: 'rgba(16,185,129,.10)',
      transition: 'opacity .25s ease'
    });
    document.documentElement.appendChild(box);
    setTimeout(() => { box.style.opacity = '0'; setTimeout(() => box.remove(), 260); }, 380);
  }

  function showFloating(text) {
    hideFloating();
    const el = document.createElement('div');
    el.id = 'rr-recorder-floating';
    el.innerHTML = `<strong style="display:block;margin-bottom:4px">WebLoop</strong><span>${escapeHtml(text)}</span>`;
    Object.assign(el.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647', maxWidth: '360px',
      background: 'rgba(17,24,39,.94)', color: '#fff', padding: '11px 13px', borderRadius: '14px',
      font: '13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,Microsoft YaHei,sans-serif',
      boxShadow: '0 18px 45px rgba(0,0,0,.24)', pointerEvents: 'none'
    });
    document.documentElement.appendChild(el);
  }

  function hideFloating() { document.getElementById('rr-recorder-floating')?.remove(); }
  function isOurUi(el) { return !!el?.closest?.('#rr-picker-overlay,#rr-picker-highlight,#rr-recorder-floating'); }
  function isVisible(el) {
    if (!(el instanceof Element)) return false;
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) !== 0;
  }
  function fingerprintKey(fp = {}) { return fp.selector || fp.xpath || fp.stableText || fp.text || ''; }
  function normalize(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function makeId(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }
  function cssEscape(v) { return (window.CSS && CSS.escape) ? CSS.escape(String(v)) : String(v).replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function attrEscape(v) { return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  function xpathEscape(v) { return String(v).replace(/"/g, '\\"'); }
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function isStableToken(v) {
    const s = String(v || '');
    if (!s || s.length > 64) return false;
    if (/^[a-f0-9]{8,}$/i.test(s)) return false;
    if (/\d{5,}/.test(s)) return false;
    return /^[a-zA-Z0-9_-]+$/.test(s);
  }
})();
