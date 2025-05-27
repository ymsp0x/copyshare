// project/src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils'; // Assuming cn utility is correct

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
          'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900',
          'disabled:opacity-60 disabled:pointer-events-none',
          {
            // Primary (Blue, consistent with form focus)
            'bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:ring-blue-500':
              variant === 'primary',
            // Secondary (Neutral, for less emphasis)
            'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100 shadow-sm focus:ring-neutral-500':
              variant === 'secondary',
            // Outline (Bordered, clean look)
            'border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 shadow-sm focus:ring-blue-500':
              variant === 'outline',
            // Ghost (Minimalist, only text and icon)
            'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:ring-neutral-500':
              variant === 'ghost',
            // Danger (Red for destructive actions)
            'bg-red-600 hover:bg-red-700 text-white shadow-md focus:ring-red-500':
              variant === 'danger',

            // Sizes
            'px-3 py-1.5 text-sm': size === 'sm', // Smaller size for table actions
            'px-4 py-2 text-base': size === 'md', // Default size
            'px-5 py-2.5 text-lg': size === 'lg', // Larger size for prominent actions
          },
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white dark:border-neutral-200"></div>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;