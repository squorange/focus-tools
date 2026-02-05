import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Semantics/Elevation',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Elevation System

A shadow-based elevation system for creating visual depth and hierarchy.

## Elevation Levels

| Level | Use Case |
|-------|----------|
| **none** | Flat elements on page background |
| **low** | Subtle cards, resting state |
| **medium** | Standard cards (recommended) |
| **high** | Dropdowns, floating elements |

---

## Usage

\`\`\`tsx
// Standard card
<div className="shadow-elevation-medium rounded-lg p-4 bg-bg-neutral-min">
  Card content
</div>

// Floating element
<div className="shadow-elevation-high rounded-lg p-4 bg-bg-neutral-min">
  Dropdown menu
</div>
\`\`\`

## Best Practices

- Use \`shadow-elevation-medium\` as the default for most cards
- Use \`shadow-elevation-high\` for floating elements (dropdowns, popovers)
- Match elevation with z-index (higher elevation = higher z-index)
- Always set a background color for shadows to be visible
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const ElevationScale: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-subtle">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Elevation Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-8">
          All elevation levels from flat to elevated
        </p>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 bg-bg-neutral-min rounded-lg flex items-center justify-center border border-border-color-neutral">
            <span className="text-sm text-fg-neutral-secondary">None</span>
          </div>
          <div className="text-center">
            <code className="text-xs bg-bg-neutral-low px-2 py-1 rounded">shadow-none</code>
            <p className="text-xs text-fg-neutral-secondary mt-1">Flat/no shadow</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 shadow-elevation-low bg-bg-neutral-min rounded-lg flex items-center justify-center">
            <span className="text-sm text-fg-neutral-secondary">Low</span>
          </div>
          <div className="text-center">
            <code className="text-xs bg-bg-neutral-low px-2 py-1 rounded">shadow-elevation-low</code>
            <p className="text-xs text-fg-neutral-secondary mt-1">Subtle</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 shadow-elevation-medium bg-bg-neutral-min rounded-lg flex items-center justify-center">
            <span className="text-sm text-fg-neutral-primary font-semibold">Medium ✓</span>
          </div>
          <div className="text-center">
            <code className="text-xs bg-bg-neutral-low px-2 py-1 rounded">
              shadow-elevation-medium
            </code>
            <p className="text-xs text-fg-neutral-secondary mt-1">Default (recommended)</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 shadow-elevation-high bg-bg-neutral-min rounded-lg flex items-center justify-center">
            <span className="text-sm text-fg-neutral-secondary">High</span>
          </div>
          <div className="text-center">
            <code className="text-xs bg-bg-neutral-low px-2 py-1 rounded">shadow-elevation-high</code>
            <p className="text-xs text-fg-neutral-secondary mt-1">Floating</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InteractiveStates: Story = {
  render: () => {
    const [hoveredCard, setHoveredCard] = React.useState(false);

    return (
      <div className="p-8 space-y-12 bg-bg-neutral-subtle">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Interactive States</h2>
          <p className="text-sm text-fg-neutral-secondary mb-4">
            Elevation can change on hover to indicate interactivity
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">
              Hover Elevation Change
            </h3>
            <div
              className={`${hoveredCard ? 'shadow-elevation-high' : 'shadow-elevation-low'} transition-shadow max-w-sm p-6 bg-bg-neutral-min rounded-lg cursor-pointer`}
              onMouseEnter={() => setHoveredCard(true)}
              onMouseLeave={() => setHoveredCard(false)}
            >
              <h4 className="font-semibold text-fg-neutral-primary mb-2">Interactive Card</h4>
              <p className="text-sm text-fg-neutral-secondary">
                Hover to see the elevation change from low to high
              </p>
            </div>
            <p className="text-xs text-fg-neutral-secondary mt-2">
              Uses React state to swap{' '}
              <code className="bg-bg-neutral-low px-1 rounded">shadow-elevation-low</code> →{' '}
              <code className="bg-bg-neutral-low px-1 rounded">shadow-elevation-high</code>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Static Elevation</h3>
            <div className="shadow-elevation-medium max-w-sm p-6 bg-bg-neutral-min rounded-lg">
              <h4 className="font-semibold text-fg-neutral-primary mb-2">Static Card</h4>
              <p className="text-sm text-fg-neutral-secondary">
                Most cards don't need hover elevation effects
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="p-8 space-y-12 bg-bg-neutral-subtle">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Real-World Examples</h2>
        <p className="text-sm text-fg-neutral-secondary">Common UI patterns using elevation</p>
      </div>

      <div className="space-y-12">
        {/* Dashboard Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">
            Dashboard Cards (elevation-medium)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg">
              <div className="text-xs text-fg-neutral-secondary mb-2">Total Tasks</div>
              <div className="text-2xl font-bold text-fg-neutral-primary">127</div>
              <div className="text-sm text-fg-positive-primary mt-2">+12 this week</div>
            </div>
            <div className="shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg">
              <div className="text-xs text-fg-neutral-secondary mb-2">Completed</div>
              <div className="text-2xl font-bold text-fg-neutral-primary">89</div>
              <div className="text-sm text-fg-positive-primary mt-2">70% completion</div>
            </div>
            <div className="shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg">
              <div className="text-xs text-fg-neutral-secondary mb-2">In Progress</div>
              <div className="text-2xl font-bold text-fg-neutral-primary">38</div>
              <div className="text-sm text-fg-attention-primary mt-2">8 due today</div>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">
            Dropdown Menu (elevation-high)
          </h3>
          <div className="inline-block">
            <button className="px-4 py-2 bg-bg-neutral-min shadow-elevation-low rounded-lg text-sm font-medium border border-border-color-neutral">
              Options ▾
            </button>
            <div className="mt-2 shadow-elevation-high bg-bg-neutral-min rounded-lg border border-border-color-neutral overflow-hidden w-48">
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary">
                Edit
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary">
                Duplicate
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary">
                Archive
              </button>
              <hr className="border-border-color-neutral" />
              <button className="w-full px-4 py-2 text-left text-sm text-fg-alert-primary hover:bg-bg-alert-subtle">
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Modal Dialog */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">
            Modal Dialog (elevation-high)
          </h3>
          <div className="shadow-elevation-high max-w-md p-8 bg-bg-neutral-min rounded-xl">
            <h2 className="text-xl font-bold text-fg-neutral-primary mb-4">Confirm Action</h2>
            <p className="text-fg-neutral-secondary mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 text-sm font-medium rounded-lg border border-border-color-neutral hover:bg-bg-neutral-subtle">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-lg bg-bg-alert-high text-white hover:bg-bg-alert-high-accented">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ElevationHierarchy: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-subtle">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Stacking & Layering</h2>
        <p className="text-sm text-fg-neutral-secondary mb-8">
          Understanding visual depth in complex interfaces
        </p>
      </div>

      <div className="relative shadow-elevation-low p-8 bg-bg-neutral-min rounded-lg">
        <h3 className="font-semibold mb-4 text-fg-neutral-primary">
          Resting: Base Container (elevation-low)
        </h3>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Subtle cards resting on the page background.
        </p>

        <div className="relative shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg">
          <h4 className="font-semibold mb-3 text-fg-neutral-primary">
            Raised: Standard Card (elevation-medium)
          </h4>
          <p className="text-sm text-fg-neutral-secondary mb-4">
            Most cards and containers use this elevation.
          </p>

          <div className="relative shadow-elevation-high p-4 bg-bg-neutral-min rounded-lg">
            <p className="text-sm font-medium mb-2 text-fg-neutral-primary">
              Floating: Dropdown (elevation-high)
            </p>
            <p className="text-xs text-fg-neutral-secondary">
              Menus and tooltips that float above cards.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-bg-information-subtle border-l-4 border-bg-information-high rounded">
        <h3 className="text-lg font-semibold mb-3 text-fg-information-primary">
          Stacking Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-fg-information-secondary">
          <li>
            <strong>Flat</strong> (none): Page background, borders, dividers
          </li>
          <li>
            <strong>Resting</strong> (low): Subtle cards, minimal lift
          </li>
          <li>
            <strong>Raised</strong> (medium): Standard cards and containers ✓
          </li>
          <li>
            <strong>Floating</strong> (high): Dropdowns, modals, tooltips
          </li>
        </ul>
      </div>
    </div>
  ),
};
