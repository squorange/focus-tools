import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RightDrawer } from './RightDrawer';

const meta: Meta<typeof RightDrawer> = {
  title: 'Components/RightDrawer',
  component: RightDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RightDrawer>;

// Demo wrapper
function RightDrawerDemo({
  width = '400px',
  children,
}: {
  width?: string;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen flex items-center justify-center bg-bg-neutral-subtle">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors"
      >
        Open Right Drawer
      </button>

      <RightDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} width={width}>
        {children || (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-color-neutral">
              <h2 className="text-lg font-semibold">Right Drawer</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-bg-neutral-subtle rounded-lg"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-fg-neutral-secondary mb-4">
                Press Escape or click backdrop to close.
              </p>
              <p className="text-fg-neutral-secondary">
                This drawer slides in from the right, perfect for desktop side panels.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-color-neutral">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-bg-neutral-low rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </RightDrawer>
    </div>
  );
}

export const Default: Story = {
  render: () => <RightDrawerDemo />,
};

export const WideDrawer: Story = {
  render: () => <RightDrawerDemo width="500px" />,
};

export const NarrowDrawer: Story = {
  render: () => <RightDrawerDemo width="320px" />,
};

export const WithForm: Story = {
  render: () => {
    function FormDemo() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div className="h-screen flex items-center justify-center bg-bg-neutral-subtle">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors"
          >
            Edit Task
          </button>

          <RightDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-color-neutral">
                <h2 className="text-lg font-semibold">Edit Task</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-bg-neutral-subtle rounded-lg"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Title</label>
                    <input
                      type="text"
                      defaultValue="Review quarterly report"
                      className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Description</label>
                    <textarea
                      rows={4}
                      defaultValue="Go through the Q4 financial report and prepare summary for stakeholders."
                      className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Priority</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min">
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-4 border-t border-border-color-neutral">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 bg-bg-neutral-low rounded-lg"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2 bg-bg-accent-high text-white rounded-lg">
                  Save
                </button>
              </div>
            </div>
          </RightDrawer>
        </div>
      );
    }

    return <FormDemo />;
  },
};
