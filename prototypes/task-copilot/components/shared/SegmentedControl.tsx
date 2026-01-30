"use client";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  /** Allow deselecting by tapping the selected option again */
  allowDeselect?: boolean;
}

/**
 * iOS-style segmented control for single-select options.
 * Horizontally scrollable on overflow.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = true,
}: SegmentedControlProps<T>) {
  const handleClick = (optionValue: T) => {
    if (allowDeselect && value === optionValue) {
      onChange(undefined);
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className="flex overflow-x-auto no-scrollbar">
      <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all
                ${isSelected
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
