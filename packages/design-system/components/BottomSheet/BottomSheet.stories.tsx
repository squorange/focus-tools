import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

// Demo wrapper
function BottomSheetDemo({
  height = '50vh',
  children,
}: {
  height?: string;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen flex items-center justify-center bg-bg-neutral-subtle">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors"
      >
        Open Bottom Sheet
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} height={height}>
        {children || (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Bottom Sheet</h2>
            <p className="text-fg-neutral-secondary mb-4">
              Drag down or click backdrop to close. Try swiping down quickly!
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-bg-neutral-low rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export const Default: Story = {
  render: () => <BottomSheetDemo />,
};

export const TallSheet: Story = {
  render: () => <BottomSheetDemo height="70vh" />,
};

export const ShortSheet: Story = {
  render: () => <BottomSheetDemo height="30vh" />,
};

export const WithForm: Story = {
  render: () => (
    <BottomSheetDemo height="60vh">
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Add New Task</h2>

        <div>
          <label className="block text-sm text-fg-neutral-secondary mb-1">Title</label>
          <input
            type="text"
            placeholder="Task title..."
            className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"
          />
        </div>

        <div>
          <label className="block text-sm text-fg-neutral-secondary mb-1">Description</label>
          <textarea
            placeholder="Optional description..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"
          />
        </div>

        <div className="flex gap-2 mt-auto">
          <button className="flex-1 py-2 bg-bg-neutral-low rounded-lg">
            Cancel
          </button>
          <button className="flex-1 py-2 bg-bg-accent-high text-white rounded-lg">
            Add Task
          </button>
        </div>
      </div>
    </BottomSheetDemo>
  ),
};

export const WithScrollableContent: Story = {
  render: () => (
    <BottomSheetDemo height="60vh">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Select Option</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Array.from({ length: 20 }, (_, i) => (
          <button
            key={i}
            className="w-full p-3 text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors"
          >
            Option {i + 1}
          </button>
        ))}
      </div>
    </BottomSheetDemo>
  ),
};
