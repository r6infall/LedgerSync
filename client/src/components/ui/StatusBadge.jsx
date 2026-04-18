const STATUS_MAP = {
  matched:  'badge-matched',
  mismatch: 'badge-mismatch',
  missing:  'badge-missing',
  pending:  'badge-pending',
  accepted: 'badge-accepted',
  rejected: 'badge-rejected',
  info:     'badge-info',
  warning:  'badge-warning',
  success:  'badge-success',
  danger:   'badge-danger',
  low:      'badge-low',
  medium:   'badge-medium',
  high:     'badge-high',
  completed:'badge-matched',
  failed:   'badge-mismatch',
};

export default function StatusBadge({ status, label }) {
  const cls = STATUS_MAP[status] || 'badge-pending';
  return (
    <span className={`badge ${cls}`}>
      {label || status}
    </span>
  );
}
