import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

// Interactive wrapper for stateful demos
function SegmentedControlDemo<T extends string>({
  options,
  defaultValue,
  ...props
}: {
  options: { value: T; label: string }[];
  defaultValue?: T;
} & Omit<Parameters<typeof SegmentedControl<T>>[0], 'value' | 'onChange' | 'options'>) {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={setValue}
      {...props}
    />
  );
}

// Basic example
export const Default: Story = {
  render: () => (
    <SegmentedControlDemo
      options={[
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ]}
      defaultValue="all"
    />
  ),
};

// Two options
export const TwoOptions: Story = {
  render: () => (
    <SegmentedControlDemo
      options={[
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid' },
      ]}
      defaultValue="list"
    />
  ),
};

// Without default selection
export const NoDefault: Story = {
  render: () => (
    <SegmentedControlDemo
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    />
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Small</span>
        <SegmentedControlDemo
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
          defaultValue="a"
          size="sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Medium (default)</span>
        <SegmentedControlDemo
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
          defaultValue="a"
          size="md"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Large</span>
        <SegmentedControlDemo
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
          defaultValue="a"
          size="lg"
        />
      </div>
    </div>
  ),
};

// Full width
export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <SegmentedControlDemo
        options={[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'all', label: 'All' },
        ]}
        defaultValue="today"
        fullWidth
      />
    </div>
  ),
};

// No deselect
export const NoDeselect: Story = {
  render: () => (
    <SegmentedControlDemo
      options={[
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ]}
      defaultValue="on"
      allowDeselect={false}
    />
  ),
};

// Many options (scrollable)
export const ManyOptions: Story = {
  render: () => (
    <div className="w-64 overflow-hidden">
      <SegmentedControlDemo
        options={[
          { value: 'mon', label: 'Mon' },
          { value: 'tue', label: 'Tue' },
          { value: 'wed', label: 'Wed' },
          { value: 'thu', label: 'Thu' },
          { value: 'fri', label: 'Fri' },
          { value: 'sat', label: 'Sat' },
          { value: 'sun', label: 'Sun' },
        ]}
        defaultValue="mon"
      />
    </div>
  ),
};

// In context - filter tabs
export const FilterTabs: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <SegmentedControlDemo
        options={[
          { value: 'inbox', label: 'Inbox (7)' },
          { value: 'pool', label: 'Pool (23)' },
        ]}
        defaultValue="inbox"
        fullWidth
      />
      <div className="text-sm text-fg-neutral-secondary text-center">
        Filter content appears here...
      </div>
    </div>
  ),
};
