// Shared data model for the WebLoop side panel. These types mirror the shapes
// produced and consumed by service_worker.js / content_script.js. They are the
// single source of truth for the React UI.

export type StepAction =
  | 'click'
  | 'double_click'
  | 'hover'
  | 'input'
  | 'clear_field'
  | 'select'
  | 'multi_select'
  | 'check'
  | 'uncheck'
  | 'scroll'
  | 'press_key'
  | 'wait'
  | 'wait_stable'
  | 'wait_element'
  | 'wait_text'
  | 'wait_text_gone'
  | 'wait_download'
  | 'screenshot'
  | 'manual_check';

export interface ElementHint {
  selector?: string;
  xpath?: string;
  text?: string;
  stableText?: string;
  nearText?: string;
  role?: string;
  tag?: string;
  framePath?: string[];
  attrs?: {
    id?: string;
    name?: string;
    ariaLabel?: string;
    title?: string;
    [key: string]: string | undefined;
  };
}

export interface Step {
  id: string;
  action: StepAction;
  label?: string;
  element?: ElementHint;
  value?: string | string[];
  text?: string;
  key?: string;
  x?: number;
  y?: number;
  durationMs?: number;
  quietMs?: number;
  pauseAfterMs?: number;
  timeoutMs?: number;
  source?: string;
  createdAt?: string;
}

export type ScheduleType = 'manual' | 'daily' | 'workdays' | 'interval';

export interface Schedule {
  type: ScheduleType;
  time?: string;
  intervalMinutes?: number;
}

export interface DownloadRule {
  validationMode?: 'loose' | 'strict';
  extensions?: string[];
  minSizeBytes?: number;
  timeoutMs?: number;
}

export interface Task {
  id: string;
  name: string;
  startUrl: string;
  enabled?: boolean;
  steps?: Step[];
  schedule?: Schedule;
  downloadRule?: DownloadRule;
}

export type Draft = Task;

export type RunStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'failed'
  | 'blocked'
  | 'paused'
  | 'enabled';

export interface DownloadedFile {
  filename?: string;
}

export interface StepLog {
  action: string;
  label?: string;
  status: string;
  error?: string;
}

export interface RunLog {
  taskId: string;
  taskName?: string;
  status: RunStatus;
  startedAt?: string | number;
  currentStepLabel?: string;
  error?: string;
  advice?: string;
  downloadedFiles?: DownloadedFile[];
  screenshots?: DownloadedFile[];
  stepLogs?: StepLog[];
}

export type LlmProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'ollama'
  | 'groq'
  | 'custom';

export interface LlmSettings {
  enabled: boolean;
  provider: LlmProvider;
  endpoint: string;
  model: string;
  apiKey: string;
  shareMode: 'minimal' | 'full';
  temperature: number;
}

export interface Settings {
  closeTabAfterRun: boolean;
  activateTabWhenRunning: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyOnNeedHuman: boolean;
  notifyOnTaskStart: boolean;
  smartHoverRecording: boolean;
  showPageHints: boolean;
  iframeSupport: boolean;
  dynamicVariables: boolean;
  stepRetryCount: number;
  runTimeoutMinutes: number;
  screenshotOnFailure: boolean;
  screenshotOnSuccess: boolean;
  screenshotDirectory: string;
  followNewTabsAfterClick: boolean;
  llm: LlmSettings;
}

export interface RecordingState {
  active: boolean;
  draftId?: string;
}

export interface AppState {
  tasks: Task[];
  logs: RunLog[];
  settings: Settings;
  draft: Draft | null;
  recording: RecordingState | null;
}
