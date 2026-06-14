import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { AppState, Draft, Settings } from '../types';
import { DEFAULT_SETTINGS, mergeSettings } from '../constants';
import { api, getCurrentTab } from './api';

export type ViewId = 'today' | 'builder' | 'tasks' | 'logs' | 'permissions' | 'settings';

const EMPTY_STATE: AppState = {
  tasks: [],
  logs: [],
  settings: structuredClone(DEFAULT_SETTINGS),
  draft: null,
  recording: null
};

interface Store {
  state: AppState;
  currentTab: chrome.tabs.Tab | null;
  view: ViewId;
  toast: string;
  setView: (v: ViewId) => void;
  showToast: (message: string) => void;
  refresh: (quiet?: boolean) => Promise<void>;
  /** Persist a draft. Optimistically updates local state; pass refresh:true to
   *  re-pull from the background after structural changes (add/remove steps). */
  saveDraft: (draft: Draft, opts?: { refresh?: boolean }) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [view, setView] = useState<ViewId>('today');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const refresh = useCallback(
    async (quiet = false) => {
      try {
        const res = await api.getState();
        setState({
          tasks: res.tasks || [],
          logs: res.logs || [],
          settings: mergeSettings(res.settings),
          draft: res.draft || null,
          recording: res.recording || null
        });
        setCurrentTab(await getCurrentTab());
      } catch (err) {
        if (!quiet) showToast(`刷新失败：${(err as Error).message || err}`);
      }
    },
    [showToast]
  );

  const saveDraft = useCallback(
    async (draft: Draft, opts?: { refresh?: boolean }) => {
      await api.saveDraft(draft);
      if (opts?.refresh) {
        await refresh(true);
      } else {
        setState((s) => ({ ...s, draft }));
      }
    },
    [refresh]
  );

  const saveSettings = useCallback(async (settings: Settings) => {
    await api.saveSettings(settings);
    setState((s) => ({ ...s, settings }));
  }, []);

  // Initial load + background-driven and timer-driven refresh.
  useEffect(() => {
    void refresh();
    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === 'RR_STATE_CHANGED') void refresh(true);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    const timer = setInterval(() => void refresh(true), 1800);
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
      clearInterval(timer);
    };
  }, [refresh]);

  const store: Store = {
    state,
    currentTab,
    view,
    toast,
    setView,
    showToast,
    refresh,
    saveDraft,
    saveSettings
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
