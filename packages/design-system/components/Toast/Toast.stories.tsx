import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToastItem, ToastContainer, ToastData } from './Toast';

const meta: Meta<typeof ToastItem> = {
  title: 'Components/Toast',
  component: ToastItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    toast: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToastItem>;

// Basic variants
export const Info: Story = {
  args: {
    toast: {
      id: '1',
      message: 'Your changes have been saved.',
      type: 'info',
    },
    onDismiss: () => {},
  },
};

export const Success: Story = {
  args: {
    toast: {
      id: '2',
      message: 'Task completed successfully!',
      type: 'success',
    },
    onDismiss: () => {},
  },
};

export const Warning: Story = {
  args: {
    toast: {
      id: '3',
      message: 'You have unsaved changes.',
      type: 'warning',
    },
    onDismiss: () => {},
  },
};

export const Error: Story = {
  args: {
    toast: {
      id: '4',
      message: 'Failed to save. Please try again.',
      type: 'error',
    },
    onDismiss: () => {},
  },
};

// With action button
export const WithAction: Story = {
  args: {
    toast: {
      id: '5',
      message: 'Task moved to archive.',
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo clicked'),
      },
    },
    onDismiss: () => {},
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ToastItem
        toast={{ id: '1', message: 'Information message', type: 'info' }}
        onDismiss={() => {}}
      />
      <ToastItem
        toast={{ id: '2', message: 'Success! Your task is complete.', type: 'success' }}
        onDismiss={() => {}}
      />
      <ToastItem
        toast={{ id: '3', message: 'Warning: This action cannot be undone.', type: 'warning' }}
        onDismiss={() => {}}
      />
      <ToastItem
        toast={{ id: '4', message: 'Error: Something went wrong.', type: 'error' }}
        onDismiss={() => {}}
      />
    </div>
  ),
};

// Container with multiple toasts
export const Container: Story = {
  render: () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'First notification', type: 'info' },
      { id: '2', message: 'Task completed!', type: 'success' },
      { id: '3', message: 'Warning message', type: 'warning' },
    ];
    return <ToastContainer toasts={toasts} onDismiss={(id) => console.log('Dismiss:', id)} />;
  },
};

// Interactive demo
export const Interactive: Story = {
  render: function InteractiveDemo() {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [counter, setCounter] = useState(0);

    const addToast = (type: ToastData['type']) => {
      const messages = {
        info: 'This is an info message.',
        success: 'Action completed successfully!',
        warning: 'Please review your changes.',
        error: 'An error occurred.',
      };
      setToasts((prev) => [...prev, { id: String(counter), message: messages[type], type }]);
      setCounter((c) => c + 1);
    };

    const dismissToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
      <div className="flex flex-col gap-6 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => addToast('info')}
            className="px-3 py-1.5 text-sm rounded bg-bg-neutral-subtle hover:bg-bg-neutral-low"
          >
            Info
          </button>
          <button
            onClick={() => addToast('success')}
            className="px-3 py-1.5 text-sm rounded bg-bg-positive-subtle text-fg-positive-primary hover:bg-bg-positive-low"
          >
            Success
          </button>
          <button
            onClick={() => addToast('warning')}
            className="px-3 py-1.5 text-sm rounded bg-bg-attention-subtle text-fg-attention-primary hover:bg-bg-attention-low"
          >
            Warning
          </button>
          <button
            onClick={() => addToast('error')}
            className="px-3 py-1.5 text-sm rounded bg-bg-alert-subtle text-fg-alert-primary hover:bg-bg-alert-low"
          >
            Error
          </button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  },
};
