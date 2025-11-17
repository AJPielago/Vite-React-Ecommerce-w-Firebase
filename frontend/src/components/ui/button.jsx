import React from 'react';

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  const cls = `${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`;

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
