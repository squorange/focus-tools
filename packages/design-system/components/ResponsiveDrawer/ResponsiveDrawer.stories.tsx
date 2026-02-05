import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ResponsiveDrawer } from './ResponsiveDrawer';

const meta: Meta<typeof ResponsiveDrawer> = {
  title: 'Components/ResponsiveDrawer',
  component: ResponsiveDrawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Automatically renders as RightDrawer on desktop or BottomSheet on mobile. Resize your browser window to see the responsive behavior.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResponsiveDrawer>;

// Demo wrapper
function ResponsiveDrawerDemo({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-bg-neutral-subtle p-4">
      <p className="text-sm text-fg-neutral-secondary text-center max-w-md">
        Resize your browser to see the responsive behavior.
        <br />
        Desktop (&gt;1024px): Right Drawer
        <br />
        Mobile (&lt;1024px): Bottom Sheet
      </p>

      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors"
      >
        Open Responsive Drawer
      </button>

      <ResponsiveDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children || (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-color-neutral">
              <h2 className="text-lg font-semibold">Responsive Drawer</h2>
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
                This drawer automatically adapts to the screen size:
              </p>
              <ul className="list-disc list-inside text-fg-neutral-secondary space-y-2">
                <li>Desktop: Slides in from the right</li>
                <li>Mobile: Slides up from the bottom</li>
                <li>Both support backdrop click to close</li>
                <li>Keyboard accessible (Escape to close on desktop)</li>
              </ul>
            </div>

            {/* Footer */}
            <div
              className="p-4 border-t border-border-color-neutral"
              style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-bg-neutral-low rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        )}
      </ResponsiveDrawer>
    </div>
  );
}

export const Default: Story = {
  render: () => <ResponsiveDrawerDemo />,
};

export const WithScrollableContent: Story = {
  render: () => {
    function ScrollableDemo() {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div className="h-screen flex items-center justify-center bg-bg-neutral-subtle">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors"
          >
            Open Drawer with List
          </button>

          <ResponsiveDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} mobileHeight="80vh">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border-color-neutral">
                <h2 className="text-lg font-semibold">Select Item</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {Array.from({ length: 30 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setIsOpen(false)}
                    className="w-full p-4 text-left hover:bg-bg-neutral-subtle border-b border-border-color-neutral"
                  >
                    Item {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </ResponsiveDrawer>
        </div>
      );
    }

    return <ScrollableDemo />;
  },
};
