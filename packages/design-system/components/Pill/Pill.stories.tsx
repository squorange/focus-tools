import type { Meta, StoryObj } from '@storybook/react';
import { Pill } from './Pill';

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'filled',
        'empty',
        'locked',
        'success',
        'warning',
        'error',
        'info',
        'priority-high',
        'priority-medium',
        'priority-low',
        'status-completed',
        'status-today',
        'status-focus',
        'status-waiting',
        'status-deferred',
        'status-ready',
        'status-inbox',
        'status-archived',
        'health-healthy',
        'health-at-risk',
        'health-critical',
      ],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pill>;

// Basic examples
export const Default: Story = {
  args: {
    children: 'Label',
    variant: 'default',
  },
};

export const Filled: Story = {
  args: {
    children: 'Filled',
    variant: 'filled',
  },
};

export const Empty: Story = {
  args: {
    children: '+ Add item',
    variant: 'empty',
  },
};

export const Locked: Story = {
  args: {
    children: 'Read only',
    variant: 'locked',
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Pill size="xs">Extra Small</Pill>
      <Pill size="sm">Small</Pill>
      <Pill size="md">Medium</Pill>
      <Pill size="lg">Large</Pill>
    </div>
  ),
};

// Feedback variants
export const Feedback: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Pill variant="success">Success</Pill>
      <Pill variant="warning">Warning</Pill>
      <Pill variant="error">Error</Pill>
      <Pill variant="info">Info</Pill>
    </div>
  ),
};

// Priority variants
export const Priority: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Pill variant="priority-high">High</Pill>
      <Pill variant="priority-medium">Medium</Pill>
      <Pill variant="priority-low">Low</Pill>
    </div>
  ),
};

// Status variants
export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill variant="status-completed">Completed</Pill>
      <Pill variant="status-today">Today</Pill>
      <Pill variant="status-focus">Focus</Pill>
      <Pill variant="status-waiting">Waiting</Pill>
      <Pill variant="status-deferred">Deferred</Pill>
      <Pill variant="status-ready">Ready</Pill>
      <Pill variant="status-inbox">Inbox</Pill>
      <Pill variant="status-archived">Archived</Pill>
    </div>
  ),
};

// Health variants
export const Health: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Pill variant="health-healthy">Healthy</Pill>
      <Pill variant="health-at-risk">Watch</Pill>
      <Pill variant="health-critical">Alert</Pill>
    </div>
  ),
};

// With emoji icon
export const WithEmojiIcon: Story = {
  args: {
    children: 'Due Tomorrow',
    icon: '📅',
    variant: 'filled',
  },
};

// With color dot (for projects)
export const WithColorDot: Story = {
  args: {
    children: 'Work Project',
    colorDot: '#7c3aed',
    variant: 'default',
  },
};

// Interactive
export const Interactive: Story = {
  args: {
    children: 'Click me',
    variant: 'filled',
    onClick: () => alert('Clicked!'),
  },
};

// Complex example
export const TaskMetadata: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill variant="status-today" size="sm">Today</Pill>
      <Pill variant="priority-high" size="sm">High</Pill>
      <Pill colorDot="#7c3aed" size="sm">Personal</Pill>
      <Pill variant="default" size="sm" icon="⏱">30m</Pill>
    </div>
  ),
};
