import { useStore } from '../store';

export function Toast() {
  const { toast } = useStore();
  return <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>;
}
