import type { Meta, StoryObj } from '@storybook/react';
import { ActionableCard } from './ActionableCard';
import { Pill } from '../Pill';
import { Zap, MoreVertical, Bell, Check } from 'lucide-react';

/**
 * ActionableCard is a unified card primitive for tasks, notifications, and routines.
 * It uses a slot-based composition pattern with Leading, Body, and Trailing sections.
 */
const meta: Meta<typeof ActionableCard> = {
  title: 'Components/ActionableCard',
  component: ActionableCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['standard', 'compact'],
      description: 'Layout variant',
    },
    appearance: {
      control: 'select',
      options: ['default', 'highlighted', 'muted'],
      description: 'Visual appearance (use highlighted for today/queue items)',
    },
    isComplete: {
      control: 'boolean',
      description: 'Show completed state (reduced opacity + strikethrough)',
    },
    emphasis: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Border emphasis',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionableCard>;

// ============================================
// Mock Components for Stories
// ============================================

/** Visual-only progress ring - shows arc progress or checkmark when complete */
const MockProgressRing = ({
  isComplete = false,
  progress = 0,
  dashed = false,
}: {
  isComplete?: boolean;
  progress?: number;
  dashed?: boolean;
}) => {
  if (isComplete) {
    return (
      <div className="w-5 h-5 rounded-full bg-bg-positive-strong flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
    );
  }

  // SVG progress ring matching app implementation
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width={20} height={20} className="transform -rotate-90">
      {/* Background circle - neutral stroke (zinc-300/zinc-600 for better contrast) */}
      <circle
        cx={10}
        cy={10}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray={dashed ? '3 3' : undefined}
        className="text-zinc-300 dark:text-zinc-600"
      />
      {/* Progress arc - accent stroke */}
      {progress > 0 && (
        <circle
          cx={10}
          cy={10}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-violet-500"
        />
      )}
    </svg>
  );
};

const MockButton = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) => (
  <button
    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
      variant === 'primary'
        ? 'bg-bg-accent-subtle text-fg-accent-primary hover:bg-bg-accent-low'
        : 'bg-bg-transparent-low text-fg-neutral-primary hover:bg-bg-transparent-medium'
    }`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </button>
);

const MockKebab = () => (
  <button
    className="p-1 flex items-center justify-center rounded text-fg-neutral-soft hover:text-fg-neutral-primary hover:bg-bg-transparent-low"
    onClick={(e) => e.stopPropagation()}
  >
    <MoreVertical className="w-4 h-4" />
  </button>
);

// ============================================
// Basic Examples
// ============================================

export const Default: Story = {
  render: () => (
    <ActionableCard onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Review quarterly OKRs with team</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>2/5 steps</Pill>
          <Pill variant="info">Due Friday</Pill>
          <Pill colorDot="#7c3aed">Work</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Focus</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const Highlighted: Story = {
  render: () => (
    <ActionableCard appearance="highlighted" onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Morning standup meeting</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>1/3 steps</Pill>
          <Pill>9:00 AM</Pill>
          <Pill colorDot="#3b82f6">Daily</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Start</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const Muted: Story = {
  render: () => (
    <ActionableCard appearance="muted" onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing isComplete />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title strikethrough>Completed task with all steps done</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>5/5 steps</Pill>
          <Pill>Completed 2h ago</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

// ============================================
// Variants
// ============================================

export const AllAppearances: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ActionableCard appearance="default">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Default appearance - Pool/Inbox tasks</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/5 steps</Pill>
            <Pill colorDot="#7c3aed">Work</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Focus</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Highlighted appearance - Today/Queue items</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>1/3 steps</Pill>
            <Pill variant="info">Due Today</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Start</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockProgressRing isComplete />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title strikethrough>Muted appearance - Completed tasks</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>5/5 steps</Pill>
            <Pill>Done</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockKebab />
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
  ),
};

export const ProgressStates: Story = {
  name: 'Progress States',
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-neutral-secondary mb-2">
        Progress ring shows partial completion with an arc indicator.
      </p>
      <ActionableCard>
        <ActionableCard.Leading>
          <MockProgressRing progress={0} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Not started - 0% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard>
        <ActionableCard.Leading>
          <MockProgressRing progress={0.25} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Quarter done - 25% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>1/4 steps</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing progress={0.5} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Halfway there - 50% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/4 steps</Pill>
            <Pill variant="info">In Progress</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing progress={0.75} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Almost done - 75% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>3/4 steps</Pill>
            <Pill variant="info">In Progress</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockProgressRing isComplete />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title strikethrough>Complete - checkmark indicator</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>4/4 steps</Pill>
            <Pill>Done</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
  ),
};

export const QueueStateViaColors: Story = {
  name: 'Queue State (via Colors)',
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-neutral-secondary mb-2">
        Queue/today state is indicated by appearance colors, not offset bars.
      </p>
      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Task in today queue (highlighted appearance)</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
            <Pill variant="info">Today</Pill>
            <Pill colorDot="#10b981">Personal</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Start</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="default">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Task not in queue (default appearance)</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
            <Pill colorDot="#10b981">Personal</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Add to Queue</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
  ),
};

// ============================================
// Compact Variant (Routine Gallery)
// ============================================

const MockStreakBadge = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-fg-neutral-secondary">
    <Zap className="w-3.5 h-3.5" />
    {count}
  </span>
);

const MockStatusRing = ({ alert = false }: { alert?: boolean }) => (
  <div
    className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-transparent flex items-center justify-center"
  >
    {alert && <span className="text-zinc-400 dark:text-zinc-500 text-[9px] font-semibold">!</span>}
  </div>
);

export const CompactVariant: Story = {
  render: () => (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <ActionableCard
        variant="compact"
        appearance="highlighted"
        height={110}
        className="w-40 shrink-0"
        onClick={() => alert('Routine clicked')}
      >
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={5} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Morning workout routine</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-neutral-soft">Daily at 7 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard
        variant="compact"
        appearance="default"
        height={110}
        className="w-40 shrink-0"
        onClick={() => alert('Routine clicked')}
      >
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing alert />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={12} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Review and respond to emails</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-attention-primary">Overdue</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard
        variant="compact"
        appearance="default"
        height={110}
        className="w-40 shrink-0"
        onClick={() => alert('Routine clicked')}
      >
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={3} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Weekly planning</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-neutral-soft">Mon at 9 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
  ),
};

// ============================================
// With InlineActions (Notifications)
// ============================================

const MockNotificationIcon = ({ type }: { type: 'bell' | 'poke' }) => (
  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
    {type === 'poke' ? '👉' : <Bell className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
  </div>
);

export const WithInlineActions: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="poke" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Time for your daily standup!</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">2 minutes ago</span>
          </ActionableCard.Meta>
          <ActionableCard.InlineActions>
            <MockButton variant="primary">Start</MockButton>
            <MockButton>Snooze 5m</MockButton>
            <MockButton>Dismiss</MockButton>
          </ActionableCard.InlineActions>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="bell" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Missed: Weekly review</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">30 minutes ago</span>
          </ActionableCard.Meta>
          <ActionableCard.InlineActions>
            <MockButton variant="primary">Start Now</MockButton>
            <MockButton>Reschedule</MockButton>
          </ActionableCard.InlineActions>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="bell" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Completed: Morning routine</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">Yesterday at 8:00 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
  ),
};

// ============================================
// Real-World Examples
// ============================================

export const PoolTaskRow: Story = {
  name: 'Pool Task Row',
  render: () => (
    <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Review quarterly OKRs with team</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>2/5 steps</Pill>
          <Pill variant="info">Due Friday</Pill>
          <Pill colorDot="#7c3aed">Work</Pill>
          <Pill>30m</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">+ Focus</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const QueueItemToday: Story = {
  name: 'Queue Item (Today)',
  render: () => (
    <ActionableCard appearance="highlighted" onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Prepare presentation slides</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>1/3 steps</Pill>
          <Pill variant="info">Due 3 PM</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">▶</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const QueueItemUpcoming: Story = {
  name: 'Queue Item (Upcoming)',
  render: () => (
    <ActionableCard appearance="highlighted" onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Research competitor products</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>0/4 steps</Pill>
          <Pill>Tomorrow</Pill>
          <Pill colorDot="#f59e0b">Strategy</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton>Move to Today</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const TriageRow: Story = {
  name: 'Triage Row (Inbox)',
  render: () => (
    <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing dashed />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>New task needing triage</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill variant="empty">No steps</Pill>
          <Pill colorDot="#f59e0b">Inbox</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Triage</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

export const CompletedTask: Story = {
  name: 'Completed Task',
  render: () => (
    <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing isComplete />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title strikethrough>Setup project repository</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>4/4 steps</Pill>
          <Pill>Completed 2 hours ago</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
  ),
};

// ============================================
// Responsive Behavior
// ============================================

export const LayoutBehavior: Story = {
  name: 'Layout Behavior',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="p-4">
      <p className="text-sm text-fg-neutral-secondary mb-4">
        Meta pills always stack below title. Leading/Trailing align with first row of title.
      </p>
      <ActionableCard onClick={() => alert('Card clicked')}>
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>A task with multiple metadata pills - meta always below title</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/5 steps</Pill>
            <Pill variant="info">Due Friday</Pill>
            <Pill colorDot="#7c3aed">Work Project</Pill>
            <Pill>High Energy</Pill>
            <Pill>45m</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Focus</MockButton>
          <MockKebab />
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
  ),
};
