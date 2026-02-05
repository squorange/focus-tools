import type { Meta, StoryObj } from '@storybook/react';
import { ProgressRing } from './ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Components/ProgressRing',
  component: ProgressRing,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'dashed'],
    },
    size: {
      control: { type: 'range', min: 12, max: 48, step: 4 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

// Basic examples
export const Default: Story = {
  args: {
    completed: 2,
    total: 5,
  },
};

export const Empty: Story = {
  args: {
    completed: 0,
    total: 5,
  },
};

export const HalfComplete: Story = {
  args: {
    completed: 3,
    total: 6,
  },
};

export const NearlyComplete: Story = {
  args: {
    completed: 4,
    total: 5,
  },
};

export const Complete: Story = {
  args: {
    completed: 5,
    total: 5,
    isComplete: true,
  },
};

// Dashed variant
export const Dashed: Story = {
  args: {
    completed: 0,
    total: 0,
    variant: 'dashed',
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={16} />
        <span className="text-xs text-fg-neutral-secondary">16px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={20} />
        <span className="text-xs text-fg-neutral-secondary">20px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={24} />
        <span className="text-xs text-fg-neutral-secondary">24px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={32} />
        <span className="text-xs text-fg-neutral-secondary">32px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={40} />
        <span className="text-xs text-fg-neutral-secondary">40px</span>
      </div>
    </div>
  ),
};

// Progress states
export const ProgressStates: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={0} total={5} />
        <span className="text-xs text-fg-neutral-secondary">0/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={1} total={5} />
        <span className="text-xs text-fg-neutral-secondary">1/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} />
        <span className="text-xs text-fg-neutral-secondary">2/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={3} total={5} />
        <span className="text-xs text-fg-neutral-secondary">3/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={4} total={5} />
        <span className="text-xs text-fg-neutral-secondary">4/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={5} total={5} isComplete />
        <span className="text-xs text-fg-neutral-secondary">Done</span>
      </div>
    </div>
  ),
};

// In context - task list item
export const InTaskList: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={0} total={3} variant="dashed" />
        <span className="text-sm text-fg-neutral-primary">New inbox item</span>
      </div>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={1} total={4} />
        <span className="text-sm text-fg-neutral-primary">In progress task</span>
      </div>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={3} total={3} isComplete />
        <span className="text-sm text-fg-neutral-secondary line-through">Completed task</span>
      </div>
    </div>
  ),
};
