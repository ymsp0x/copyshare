// project/src/components/ui/TextArea.tsx
import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-dark dark:text-text-light mb-1"> {/* MODIFIED */}
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full rounded-md border border-gray-300 dark:border-neutral-700 shadow-sm px-3 py-2 min-h-[120px]',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500', // MODIFIED
            'disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-neutral-700',
            'bg-white dark:bg-neutral-800 text-text-dark dark:text-text-light', // MODIFIED
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400 dark:focus:ring-red-400 dark:focus:border-red-400' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;