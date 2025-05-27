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
          <label htmlFor={props.id} className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2"> {/* Updated text colors, increased mb */}
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm px-3 py-2.5 min-h-[120px]', // More rounded, increased vertical padding
            'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100', // Consistent background/text colors
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out', // Smooth transition for focus
            'placeholder-neutral-400 dark:placeholder-neutral-500', // Placeholder styling
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-neutral-800', // Clearer disabled state
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400 dark:focus:ring-red-400 dark:focus:border-red-400' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>} {/* Increased mt */}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;