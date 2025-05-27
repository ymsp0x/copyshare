// project/src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white focus:ring-primary-500': // MODIFIED
              variant === 'primary',
            'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500': 
              variant === 'secondary',
            'border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 focus:ring-primary-500': // MODIFIED
              variant === 'outline',
            'bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-gray-500': // MODIFIED
              variant === 'ghost',
            'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500': 
              variant === 'danger',
            'px-2.5 py-1.5 text-xs': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-5 py-2.5 text-base': size === 'lg',
          },
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;