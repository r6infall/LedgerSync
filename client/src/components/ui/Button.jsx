export default function Button({
  children,
  variant = 'primary',
  size = '',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const variantCls = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    amber:     'btn-amber',
  }[variant] || 'btn-primary';

  const sizeCls = { sm: 'btn-sm', xs: 'btn-xs', '': '' }[size] || '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantCls} ${sizeCls} ${className}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {children}
    </button>
  );
}
