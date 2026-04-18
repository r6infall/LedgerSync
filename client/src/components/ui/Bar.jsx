export default function Bar({ label, value, max, colorClass = 'bar-fill-green', showValue = true }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const formattedValue = typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : value;

  return (
    <div style={{ marginBottom: '10px' }}>
      <div className="bar-label-row">
        <span className="bar-label">{label}</span>
        {showValue && <span className="bar-value">{formattedValue}</span>}
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
