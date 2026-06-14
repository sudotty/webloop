// Typed wrapper around the chrome.runtime message bus. Every call maps to a
// handler in service_worker.js. Keeping the message names in one place makes
// the side panel <-> background contract explicit and reviewable.
import type { AppState, Draft, LlmSettings, Settings, Step } from '../types';

export type MessageType =
  | 'RR_GET_STATE'
  | 'RR_CREATE_DRAFT'
  | 'RR_SAVE_DRAFT'
  | 'RR_DISCARD_DRAFT'
  | 'RR_SAVE_DRAFT_AS_TASK'
  | 'RR_EDIT_TASK_AS_DRAFT'
  | 'RR_TOGGLE_TASK'
  | 'RR_RUN_TASK'
  | 'RR_RUN_TASK_FROM_STEP'
  | 'RR_HIGHLIGHT_STEP'
  | 'RR_IMPORT_BACKUP'
  | 'RR_CLEAR_LOGS'
  | 'RR_START_RECORDING'
  | 'RR_STOP_RECORDING'
  | 'RR_START_PICKER'
  | 'RR_CAPTURE_SCREENSHOT'
  | 'RR_SAVE_SETTINGS'
  | 'RR_TEST_NOTIFICATION'
  | 'RR_TEST_LLM';

export interface OkResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

export function send<T = OkResponse>(type: MessageType, payload: Record<string, unknown> = {}): Promise<T> {
  return chrome.runtime.sendMessage({ type, payload }) as Promise<T>;
}

export type StateResponse = Partial<AppState>;

export const api = {
  getState: () => send<StateResponse>('RR_GET_STATE'),
  createDraft: (tab: { id?: number; url?: string; title?: string }) =>
    send('RR_CREATE_DRAFT', { tab }),
  saveDraft: (draft: Draft) => send('RR_SAVE_DRAFT', { draft }),
  discardDraft: () => send('RR_DISCARD_DRAFT'),
  saveDraftAsTask: () => send<OkResponse & { taskId?: string }>('RR_SAVE_DRAFT_AS_TASK'),
  editTaskAsDraft: (taskId: string) => send('RR_EDIT_TASK_AS_DRAFT', { taskId }),
  toggleTask: (taskId: string) => send('RR_TOGGLE_TASK', { taskId }),
  runTask: (taskId: string) => send('RR_RUN_TASK', { taskId }),
  runTaskFromStep: (taskId: string, startIndex: number) =>
    send('RR_RUN_TASK_FROM_STEP', { taskId, startIndex }),
  highlightStep: (tabId: number, step: Step) => send('RR_HIGHLIGHT_STEP', { tabId, step }),
  importBackup: (tasks: unknown[], settings: Settings | null) =>
    send('RR_IMPORT_BACKUP', { tasks, settings }),
  clearLogs: () => send('RR_CLEAR_LOGS'),
  startRecording: (tabId: number) => send('RR_START_RECORDING', { tabId }),
  stopRecording: () => send('RR_STOP_RECORDING'),
  startPicker: (tabId: number, mode: string) => send('RR_START_PICKER', { tabId, mode }),
  captureScreenshot: (tabId: number, label: string) =>
    send('RR_CAPTURE_SCREENSHOT', { tabId, label }),
  saveSettings: (settings: Settings) => send('RR_SAVE_SETTINGS', { settings }),
  testNotification: () => send('RR_TEST_NOTIFICATION'),
  testLlm: (settings: LlmSettings) => send<OkResponse & { text?: string }>('RR_TEST_LLM', { settings })
};

export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  } catch {
    return null;
  }
}
