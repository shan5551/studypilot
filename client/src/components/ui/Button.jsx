import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };
  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}