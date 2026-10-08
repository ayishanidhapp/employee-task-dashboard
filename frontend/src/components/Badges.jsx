import { statusLabel, priorityLabel } from '../utils/format';

export const StatusBadge = ({ status }) => <span className={`pill status-${status}`}>{statusLabel(status)}</span>;

// Priority is a quiet dot + word; the colour carries urgency without shouting.
export const PriorityBadge = ({ priority }) => (
  <span className="prio"><i className={`prio-dot prio-${priority}`} />{priorityLabel(priority)}</span>
);
