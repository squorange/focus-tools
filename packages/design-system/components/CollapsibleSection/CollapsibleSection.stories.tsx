import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Components/CollapsibleSection',
  component: CollapsibleSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-bg-neutral-min rounded-lg border border-border-neutral-default">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

// Basic collapsed
export const Collapsed: Story = {
  args: {
    title: 'Settings',
    expanded: false,
    onToggle: () => {},
    children: (
      <div className="space-y-2">
        <p className="text-sm text-fg-neutral-secondary">Setting 1</p>
        <p className="text-sm text-fg-neutral-secondary">Setting 2</p>
      </div>
    ),
  },
};

// Basic expanded
export const Expanded: Story = {
  args: {
    title: 'Settings',
    expanded: true,
    onToggle: () => {},
    children: (
      <div className="space-y-2">
        <p className="text-sm text-fg-neutral-secondary">Setting 1</p>
        <p className="text-sm text-fg-neutral-secondary">Setting 2</p>
      </div>
    ),
  },
};

// With active count badge
export const WithActiveCount: Story = {
  args: {
    title: 'Filters',
    expanded: false,
    onToggle: () => {},
    activeCount: 3,
    children: (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> High priority
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Medium priority
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Today
        </label>
      </div>
    ),
  },
};

// Interactive demo
export const Interactive: Story = {
  render: function InteractiveDemo() {
    const [expanded, setExpanded] = useState(false);
    return (
      <CollapsibleSection
        title="Click to toggle"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        activeCount={expanded ? 0 : 2}
      >
        <div className="space-y-2 text-sm text-fg-neutral-secondary">
          <p>This content is revealed when expanded.</p>
          <p>The badge shows "2" when collapsed.</p>
        </div>
      </CollapsibleSection>
    );
  },
};

// Multiple sections (filter drawer example)
export const MultipleSections: Story = {
  render: function MultipleSectionsDemo() {
    const [sections, setSections] = useState({
      priority: true,
      status: false,
      project: false,
    });

    const toggle = (key: keyof typeof sections) => {
      setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="divide-y divide-border-neutral-default">
        <CollapsibleSection
          title="Priority"
          expanded={sections.priority}
          onToggle={() => toggle('priority')}
          activeCount={2}
        >
          <div className="space-y-1">
            {['High', 'Medium', 'Low'].map((p, i) => (
              <label key={p} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" defaultChecked={i < 2} /> {p}
              </label>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Status"
          expanded={sections.status}
          onToggle={() => toggle('status')}
          activeCount={1}
        >
          <div className="space-y-1">
            {['In Progress', 'Waiting', 'Ready'].map((s, i) => (
              <label key={s} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" defaultChecked={i === 0} /> {s}
              </label>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Project"
          expanded={sections.project}
          onToggle={() => toggle('project')}
        >
          <div className="space-y-1">
            {['Design System', 'Task Copilot', 'Documentation'].map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" /> {p}
              </label>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    );
  },
};

// In filter drawer context
export const InFilterDrawer: Story = {
  render: function FilterDrawerDemo() {
    const [expanded, setExpanded] = useState({ energy: false, time: true });

    return (
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-fg-neutral-soft uppercase tracking-wide mb-2">
          Filters
        </h3>
        <CollapsibleSection
          title="Energy Level"
          expanded={expanded.energy}
          onToggle={() => setExpanded((p) => ({ ...p, energy: !p.energy }))}
          activeCount={1}
        >
          <div className="flex flex-wrap gap-1.5">
            {['Low', 'Medium', 'High'].map((e, i) => (
              <button
                key={e}
                className={`px-2.5 py-1 text-xs rounded-full ${
                  i === 0
                    ? 'bg-bg-accent-subtle text-fg-accent-primary'
                    : 'bg-bg-neutral-subtle text-fg-neutral-secondary'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Time Estimate"
          expanded={expanded.time}
          onToggle={() => setExpanded((p) => ({ ...p, time: !p.time }))}
        >
          <div className="flex flex-wrap gap-1.5">
            {['5 min', '15 min', '30 min', '1+ hr'].map((t) => (
              <button
                key={t}
                className="px-2.5 py-1 text-xs rounded-full bg-bg-neutral-subtle text-fg-neutral-secondary"
              >
                {t}
              </button>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    );
  },
};
