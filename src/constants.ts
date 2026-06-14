import type { LlmProvider, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
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

export interface LlmPreset {
  name: string;
  endpoint: string;
  model: string;
}

export const LLM_PRESETS: Record<LlmProvider, LlmPreset> = {
  openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  anthropic: { name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620' },
  gemini: { name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-1.5-flash' },
  deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  ollama: { name: 'Ollama (本地)', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'llama3' },
  groq: { name: 'Groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-70b-versatile' },
  custom: { name: '自定义 (OpenAI 兼容)', endpoint: '', model: '' }
};

export function mergeSettings(input: Partial<Settings> | undefined): Settings {
  const base = structuredClone(DEFAULT_SETTINGS);
  return {
    ...base,
    ...(input || {}),
    llm: { ...base.llm, ...(input?.llm || {}) }
  };
}
