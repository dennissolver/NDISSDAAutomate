'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm',
    ghost: 'text-gray-700 hover:bg-gray-100',
    link: 'text-blue-600 underline-offset-4 hover:underline',
  },
  size: {
    sm: 'h-8 px-3 text-sm rounded-md',
    default: 'h-10 px-4 py-2 text-sm rounded-md',
    lg: 'h-12 px-6 text-base rounded-lg',
  },
} as const;

type ButtonVariant = keyof typeof buttonVariants.variant;
type ButtonSize = keyof typeof buttonVariants.size;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export default Button;
export { Button, buttonVariants };
