import { useEffect, useRef, useState } from 'react';
import type { LlmProvider, Settings } from '../../../types';
import { LLM_PRESETS } from '../../../constants';
import { useStore } from '../../store';
import { useActions } from '../../actions';
import { useGuard } from '../../hooks';

export function SettingsView() {
  const { state, saveSettings } = useStore();
  const { testNotification, testLlm, exportBackup, importBackup } = useActions();
  const guard = useGuard();

  const [s, setS] = useState<Settings>(state.settings);
  const editing = useRef(false);

  // Re-sync from the background only when the user isn't actively editing, so
  // the 1.8s poll never clobbers an in-progress field.
  useEffect(() => {
    if (!editing.current) setS(state.settings);
  }, [state.settings]);

  const update = (patch: Partial<Settings>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  };

  const updateLlm = (patch: Partial<Settings['llm']>) => {
    setS((prev) => {
      const next = { ...prev, llm: { ...prev.llm, ...patch } };
      void saveSettings(next);
      return next;
    });
  };

  const onProvider = (provider: LlmProvider) => {
    const preset = LLM_PRESETS[provider];
    updateLlm({ provider, endpoint: preset.endpoint, model: preset.model });
  };

  const textProps = {
    onFocus: () => (editing.current = true),
    onBlur: () => (editing.current = false)
  };

  return (
    <section className="view active">
      <div className="card">
        <div className="section-head">
          <div>
            <h2>基础设置</h2>
            <p>保持默认即可。先保证任务能跑通。</p>
          </div>
        </div>
        <div className="stack">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.activateTabWhenRunning}
              onChange={(e) => update({ activateTabWhenRunning: e.target.checked })}
            />
            执行任务时自动切到运行页面
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.notifyOnSuccess}
              onChange={(e) => update({ notifyOnSuccess: e.target.checked })}
            />
            任务完成后通知我
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.notifyOnFailure}
              onChange={(e) => update({ notifyOnFailure: e.target.checked })}
            />
            任务失败后通知我
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.showPageHints}
              onChange={(e) => update({ showPageHints: e.target.checked })}
            />
            录制时在网页上显示提示
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.screenshotOnFailure}
              onChange={(e) => update({ screenshotOnFailure: e.target.checked })}
            />
            任务失败时自动保存截图
          </label>
          <button className="secondary wide" onClick={guard(testNotification)}>
            发送测试通知
          </button>
        </div>
      </div>

      <div className="card">
        <details className="advanced-block">
          <summary>高级运行设置</summary>
          <div className="divider" />
          <div className="stack">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.closeTabAfterRun}
                onChange={(e) => update({ closeTabAfterRun: e.target.checked })}
              />
              运行结束后关闭自动打开的标签页
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.notifyOnTaskStart}
                onChange={(e) => update({ notifyOnTaskStart: e.target.checked })}
              />
              任务开始时也通知
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.notifyOnNeedHuman}
                onChange={(e) => update({ notifyOnNeedHuman: e.target.checked })}
              />
              需要人工接管时通知
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.screenshotOnSuccess}
                onChange={(e) => update({ screenshotOnSuccess: e.target.checked })}
              />
              任务成功时也保存截图
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.followNewTabsAfterClick}
                onChange={(e) => update({ followNewTabsAfterClick: e.target.checked })}
              />
              点击后如果打开同站点新标签页，自动跟随执行
            </label>
            <label className="field">
              截图保存目录
              <input
                value={s.screenshotDirectory}
                {...textProps}
                onChange={(e) => update({ screenshotDirectory: e.target.value })}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.smartHoverRecording}
                onChange={(e) => update({ smartHoverRecording: e.target.checked })}
              />
              自动识别悬浮菜单
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.iframeSupport}
                onChange={(e) => update({ iframeSupport: e.target.checked })}
              />
              兼容 iframe 内嵌报表页
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={s.dynamicVariables}
                onChange={(e) => update({ dynamicVariables: e.target.checked })}
              />
              启用动态日期变量
            </label>
            <div className="grid2">
              <label className="field">
                步骤失败重试次数
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={s.stepRetryCount}
                  {...textProps}
                  onChange={(e) =>
                    update({ stepRetryCount: Math.max(0, Math.min(5, Number(e.target.value || 0))) })
                  }
                />
              </label>
              <label className="field">
                单次运行最长分钟
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={s.runTimeoutMinutes}
                  {...textProps}
                  onChange={(e) =>
                    update({ runTimeoutMinutes: Math.max(1, Math.min(120, Number(e.target.value || 1))) })
                  }
                />
              </label>
            </div>
            <div className="grid2">
              <button className="secondary" onClick={guard(exportBackup)}>
                导出任务备份
              </button>
              <button className="secondary" onClick={guard(importBackup)}>
                导入任务备份
              </button>
            </div>
          </div>
        </details>
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>LLM 智能化辅助</h2>
            <p>用于辅助失败修复和流程建议。暂不自动执行。</p>
          </div>
        </div>
        <div className="stack">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s.llm.enabled}
              onChange={(e) => updateLlm({ enabled: e.target.checked })}
            />
            启用 AI 辅助 (实验性)
          </label>

          {s.llm.enabled && (
            <div className="stack mini-panel">
              <label className="field">
                服务商
                <select
                  value={s.llm.provider}
                  onChange={(e) => onProvider(e.target.value as LlmProvider)}
                >
                  {(Object.entries(LLM_PRESETS) as Array<[LlmProvider, { name: string }]>).map(
                    ([id, p]) => (
                      <option key={id} value={id}>
                        {p.name}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="field">
                接口地址 (Endpoint)
                <input
                  value={s.llm.endpoint}
                  placeholder="https://api.example.com/v1/..."
                  {...textProps}
                  onChange={(e) => updateLlm({ endpoint: e.target.value })}
                />
              </label>
              <div className="grid2">
                <label className="field">
                  模型 (Model)
                  <input
                    value={s.llm.model}
                    placeholder="gpt-4o / deepseek-chat"
                    {...textProps}
                    onChange={(e) => updateLlm({ model: e.target.value })}
                  />
                </label>
                <label className="field">
                  温度 (Temp)
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={2}
                    value={s.llm.temperature}
                    {...textProps}
                    onChange={(e) => updateLlm({ temperature: Number(e.target.value || 0) })}
                  />
                </label>
              </div>
              <label className="field">
                API Key
                <input
                  type="password"
                  value={s.llm.apiKey}
                  placeholder="保存在本地，不上传云端"
                  {...textProps}
                  onChange={(e) => updateLlm({ apiKey: e.target.value })}
                />
              </label>
              <button className="secondary wide" onClick={guard(() => testLlm(s.llm))}>
                测试模型连接
              </button>
            </div>
          )}
          <div className="notice">
            目前仅在任务失败时用于分析 DOM 结构和提示修复方案，不会上传敏感数据。
          </div>
        </div>
      </div>
    </section>
  );
}
