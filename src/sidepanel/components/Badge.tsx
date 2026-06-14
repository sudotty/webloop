import type { RunStatus } from '../../types';
import { BADGE_LABELS } from '../lib/format';

export function Badge({ status }: { status: RunStatus }) {
  const { cls, text } = BADGE_LABELS[status] ?? BADGE_LABELS.idle;
  return <span className={`badge ${cls}`}>{text}</span>;
}
