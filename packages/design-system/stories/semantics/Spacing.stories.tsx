import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Semantics/Spacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Spacing Tokens

Consistent spacing scale based on a 4px grid system.

## Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| \`space-0\` | 0px | No spacing |
| \`space-0.5\` | 2px | Micro spacing |
| \`space-1\` | 4px | Tight coupling (icon + text) |
| \`space-1.5\` | 6px | Extra small |
| \`space-2\` | 8px | Small gaps, tight padding |
| \`space-3\` | 12px | Compact padding |
| \`space-4\` | 16px | Standard padding (default) |
| \`space-5\` | 20px | Medium padding |
| \`space-6\` | 24px | Large padding |
| \`space-8\` | 32px | Section spacing |
| \`space-10\` | 40px | Large sections |
| \`space-12\` | 48px | Page sections |
| \`space-16\` | 64px | Major sections |
| \`space-20\` | 80px | Hero sections |

---

## Usage

\`\`\`tsx
// Gap between elements
<div className="flex gap-4">
  <button>First</button>
  <button>Second</button>
</div>

// Padding
<div className="p-4">Card with 16px padding</div>

// Margin
<div className="mb-6">Section with 24px bottom margin</div>
\`\`\`

## Design Principles

- **4px Grid**: All spacing values are multiples of 4px
- **Consistent Scale**: Use the same scale for gaps, padding, and margins
- **Semantic Meaning**: Choose spacing based on visual relationship
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const SpacingScale: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Spacing Scale</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Visual representation of all spacing values (4px grid)
        </p>
      </div>

      <div className="space-y-3">
        {[
          { name: 'space-0', value: '0px', width: 0 },
          { name: 'space-0.5', value: '2px', width: 2 },
          { name: 'space-1', value: '4px', width: 4 },
          { name: 'space-1.5', value: '6px', width: 6 },
          { name: 'space-2', value: '8px', width: 8 },
          { name: 'space-3', value: '12px', width: 12 },
          { name: 'space-4', value: '16px', width: 16 },
          { name: 'space-5', value: '20px', width: 20 },
          { name: 'space-6', value: '24px', width: 24 },
          { name: 'space-8', value: '32px', width: 32 },
          { name: 'space-10', value: '40px', width: 40 },
          { name: 'space-12', value: '48px', width: 48 },
          { name: 'space-16', value: '64px', width: 64 },
          { name: 'space-20', value: '80px', width: 80 },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-4">
            <div className="w-24 text-sm font-mono text-fg-neutral-primary">{item.name}</div>
            <div className="w-16 text-sm text-fg-neutral-secondary">{item.value}</div>
            <div
              className="h-6 bg-bg-accent-high rounded"
              style={{ width: `${Math.max(item.width * 2, 4)}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  ),
};

export const GapExamples: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Gap Examples</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Using spacing for gaps in flexbox</p>
      </div>

      {/* Tight coupling */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">
          gap-1 (4px) - Tight Coupling
        </h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Icon + text, tightly coupled elements</p>
        <div className="inline-flex items-center gap-1 bg-bg-neutral-subtle px-3 py-2 rounded-lg">
          <span className="w-4 h-4 bg-bg-accent-high rounded" />
          <span className="text-sm text-fg-neutral-primary">Icon with label</span>
        </div>
      </div>

      {/* Small gap */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">
          gap-2 (8px) - Small Gap
        </h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Pills, tags, small repeated elements</p>
        <div className="flex flex-wrap gap-2">
          {['Design', 'Development', 'Testing', 'Deployment'].map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-bg-accent-subtle text-fg-accent-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Standard gap */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">
          gap-4 (16px) - Standard Gap
        </h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Cards, form fields, standard spacing</p>
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="p-4 bg-bg-neutral-min rounded-lg border border-border-color-neutral"
            >
              <div className="text-sm font-semibold text-fg-neutral-primary">Card {num}</div>
              <div className="text-xs text-fg-neutral-secondary">Standard gap</div>
            </div>
          ))}
        </div>
      </div>

      {/* Large gap */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">
          gap-6 (24px) - Large Gap
        </h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Sections, major content blocks</p>
        <div className="flex flex-col gap-6 max-w-xl">
          <div className="p-6 bg-bg-information-subtle rounded-lg">
            <div className="font-semibold text-fg-information-primary">Section A</div>
            <div className="text-sm text-fg-information-secondary">Major content section</div>
          </div>
          <div className="p-6 bg-bg-positive-subtle rounded-lg">
            <div className="font-semibold text-fg-positive-primary">Section B</div>
            <div className="text-sm text-fg-positive-secondary">Clear visual separation</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const PaddingExamples: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Padding Examples</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Using spacing for internal padding</p>
      </div>

      {/* Tight padding */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">p-2 (8px) - Tight</h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Pills, small buttons</p>
        <button className="p-2 bg-bg-accent-high text-white text-sm rounded">Compact</button>
      </div>

      {/* Standard padding */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">p-4 (16px) - Standard</h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Cards, containers (most common)</p>
        <div className="p-4 bg-bg-neutral-min rounded-lg border border-border-color-neutral max-w-sm">
          <div className="font-semibold text-fg-neutral-primary">Standard Card</div>
          <div className="text-sm text-fg-neutral-secondary">
            16px padding on all sides. Most cards use this.
          </div>
        </div>
      </div>

      {/* Large padding */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">p-6 (24px) - Large</h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Featured sections, hero areas</p>
        <div className="p-6 bg-gradient-to-br from-bg-accent-subtle to-bg-information-subtle rounded-lg max-w-md">
          <div className="text-xl font-bold text-fg-neutral-primary mb-2">Featured Section</div>
          <div className="text-sm text-fg-neutral-secondary">
            24px padding creates a spacious, premium feel for featured content.
          </div>
        </div>
      </div>

      {/* Asymmetric padding */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">
          px-4 py-2 - Asymmetric
        </h3>
        <p className="text-xs text-fg-neutral-secondary mb-3">Buttons, horizontal elements</p>
        <button className="px-4 py-2 bg-bg-accent-high text-white rounded-lg">
          Button with asymmetric padding
        </button>
      </div>
    </div>
  ),
};

export const UsagePatterns: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Common Usage Patterns</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Real-world examples combining gap and padding
        </p>
      </div>

      {/* Button Group */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Button Group</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-bg-accent-high text-white text-sm rounded-lg">Save</button>
          <button className="px-4 py-2 bg-bg-neutral-min text-fg-neutral-primary text-sm rounded-lg border border-border-color-neutral">
            Cancel
          </button>
        </div>
        <p className="text-xs text-fg-neutral-secondary mt-2">
          Gap: <code className="bg-bg-neutral-subtle px-1 rounded">gap-2</code> • Padding:{' '}
          <code className="bg-bg-neutral-subtle px-1 rounded">px-4 py-2</code>
        </p>
      </div>

      {/* Form Layout */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Form Layout</h3>
        <div className="max-w-sm p-4 bg-bg-neutral-min rounded-lg border border-border-color-neutral">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg-neutral-primary mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-border-color-neutral rounded-lg"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fg-neutral-primary mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border-color-neutral rounded-lg"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-fg-neutral-secondary mt-2">
          Card padding: <code className="bg-bg-neutral-subtle px-1 rounded">p-4</code> • Field gap:{' '}
          <code className="bg-bg-neutral-subtle px-1 rounded">space-y-4</code>
        </p>
      </div>

      {/* Card Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Card Grid</h3>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          {[1, 2].map((num) => (
            <div
              key={num}
              className="p-4 bg-bg-neutral-min rounded-lg shadow-elevation-medium"
            >
              <div className="font-semibold text-fg-neutral-primary">Card {num}</div>
              <div className="text-sm text-fg-neutral-secondary">Standard card spacing</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-fg-neutral-secondary mt-2">
          Grid gap: <code className="bg-bg-neutral-subtle px-1 rounded">gap-4</code> • Card padding:{' '}
          <code className="bg-bg-neutral-subtle px-1 rounded">p-4</code>
        </p>
      </div>

      {/* Guidelines */}
      <div className="p-6 bg-bg-information-subtle border-l-4 border-bg-information-high rounded">
        <h3 className="text-lg font-semibold mb-3 text-fg-information-primary">Best Practices</h3>
        <ul className="space-y-2 text-sm text-fg-information-secondary">
          <li>
            <code className="bg-bg-neutral-min px-1 rounded">gap-2</code> (8px) for tight groups
            (buttons, tags)
          </li>
          <li>
            <code className="bg-bg-neutral-min px-1 rounded">gap-4</code> (16px) for standard grids
            and lists
          </li>
          <li>
            <code className="bg-bg-neutral-min px-1 rounded">p-4</code> (16px) is the most common
            card padding
          </li>
          <li>
            <code className="bg-bg-neutral-min px-1 rounded">space-y-4</code> for vertical form
            fields
          </li>
          <li>Consistent spacing creates visual rhythm and improves scannability</li>
        </ul>
      </div>
    </div>
  ),
};
