'use client';

import React from 'react';

export interface SegmentedControlOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  /** Available options */
  options: SegmentedControlOption<T>[];
  /** Currently selected value */
  value: T | undefined;
  /** Change handler */
  onChange: (value: T | undefined) => void;
  /** Allow deselecting by tapping the selected option again */
  allowDeselect?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width mode */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const containerSizeClasses = {
  sm: 'p-0.5 gap-0',
  md: 'p-0.5 gap-0',
  lg: 'p-0.5 gap-0',
};

/**
 * SegmentedControl - iOS-style segmented control for single-select options.
 *
 * Horizontally scrollable on overflow. Supports optional deselection.
 *
 * @example
 * ```tsx
 * const [view, setView] = useState<'list' | 'grid'>('list');
 *
 * <SegmentedControl
 *   options={[
 *     { value: 'list', label: 'List' },
 *     { value: 'grid', label: 'Grid' },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 * ```
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = true,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const handleClick = (optionValue: T, disabled?: boolean) => {
    if (disabled) return;

    if (allowDeselect && value === optionValue) {
      onChange(undefined);
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className={`flex overflow-x-auto no-scrollbar ${className}`}>
      <div
        className={`inline-flex bg-black/[0.06] dark:bg-white/[0.08] rounded-lg ${containerSizeClasses[size]} ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = option.disabled;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value, isDisabled)}
              disabled={isDisabled}
              className={`
                ${sizeClasses[size]}
                font-medium rounded-md whitespace-nowrap transition-all
                flex items-center justify-center gap-1.5
                ${fullWidth ? 'flex-1' : ''}
                ${
                  isSelected
                    ? 'bg-white dark:bg-[#141417] text-fg-neutral-primary shadow-sm'
                    : 'text-fg-neutral-spot-readable hover:text-fg-neutral-primary'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {option.icon && (
                <span className="flex-shrink-0">{option.icon}</span>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SegmentedControl;
