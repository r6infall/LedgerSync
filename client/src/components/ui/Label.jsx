export default function Label({ children, className = '' }) {
  return (
    <div className={`section-label ${className}`}>
      {children}
    </div>
  );
}
