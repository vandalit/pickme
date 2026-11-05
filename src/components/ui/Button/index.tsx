import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'alert' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = styles[`variant_${variant}`] || styles.variant_primary;
  const sizeClass = styles[`size_${size}`] || styles.size_md;
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  const loadingClass = isLoading ? styles.loading : '';

  return (
    <button
      className={`${styles.button} ${variantClass} ${sizeClass} ${fullWidthClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {icon && !isLoading && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
