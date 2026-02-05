import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Semantics/Text Styles',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Text Styles

Pre-composed text styles for consistent typography across the application.

## Categories

| Category | Use Case | Sizes |
|----------|----------|-------|
| **display** | Hero titles, large headlines | sm, md, lg, xl |
| **heading** | Page structure, sections | xs, sm, md, lg, xl, 2xl, 3xl |
| **title** | Card titles, section headers | sm, lg, xl |
| **body** | Paragraphs, content | xs, sm, md, lg |
| **label** | Form labels, UI elements | 2xs, xs, sm, md, lg |
| **eyebrow** | Overlines, tags, categories | sm, md |

## Naming Convention

\`text-{category}-{size}-{weight}\`

Example: \`text-heading-xl-bold\`

---

## Usage

\`\`\`tsx
<h1 className="text-display-xl-bold text-fg-neutral-primary">
  Page Title
</h1>

<p className="text-body-md-regular text-fg-neutral-secondary">
  Body paragraph text
</p>

<span className="text-label-sm-medium text-fg-neutral-primary">
  Form Label
</span>
\`\`\`

## Best Practices

- Combine text styles with color tokens for complete styling
- Use \`text-heading-xl-bold\` for card titles
- Use \`text-body-md-regular\` for most paragraph text
- Text styles only handle typography—add color classes separately
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const AllStyles: Story = {
  render: () => (
    <div className="p-8 space-y-16 bg-bg-neutral-base">
      {/* Display Styles */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
          Display Styles (Large Headlines)
        </h2>
        <div className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-fg-neutral-primary">
              Display XL Bold - Main Hero Title
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-display-xl-bold</code>
          </div>
          <div>
            <div className="text-3xl font-medium text-fg-neutral-primary">
              Display LG Medium - Section Title
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-display-lg-medium</code>
          </div>
          <div>
            <div className="text-2xl font-normal text-fg-neutral-primary">
              Display MD Regular - Subsection
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-display-md-regular</code>
          </div>
        </div>
      </section>

      {/* Heading Styles */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
          Heading Styles (Page Structure)
        </h2>
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold text-fg-neutral-primary">Heading 3XL Bold</div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-3xl-bold</code>
          </div>
          <div>
            <div className="text-2xl font-medium text-fg-neutral-primary">Heading 2XL Medium</div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-2xl-medium</code>
          </div>
          <div>
            <div className="text-xl font-bold text-fg-neutral-primary">
              Heading XL Bold - Card Title
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-xl-bold</code>
          </div>
          <div>
            <div className="text-lg font-medium text-fg-neutral-primary">
              Heading LG Medium - Section Header
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-lg-medium</code>
          </div>
          <div>
            <div className="text-base font-semibold text-fg-neutral-primary">
              Heading MD Semibold - Subsection
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-md-semibold</code>
          </div>
          <div>
            <div className="text-sm font-bold text-fg-neutral-primary">Heading SM Bold</div>
            <code className="text-xs text-fg-neutral-secondary">.text-heading-sm-bold</code>
          </div>
        </div>
      </section>

      {/* Body Styles */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
          Body Styles (Paragraphs & Content)
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-lg text-fg-neutral-primary max-w-2xl">
              Body LG Regular - This is a larger body text size used for important paragraphs or
              lead text that needs emphasis without being a heading.
            </p>
            <code className="text-xs text-fg-neutral-secondary">.text-body-lg-regular</code>
          </div>
          <div>
            <p className="text-base text-fg-neutral-secondary max-w-2xl">
              Body MD Regular - This is the most common body text size, perfect for standard
              paragraphs and most content. It provides good readability at 16px.
            </p>
            <code className="text-xs text-fg-neutral-secondary">.text-body-md-regular</code>
          </div>
          <div>
            <p className="text-base font-medium text-fg-neutral-primary max-w-2xl">
              Body MD Medium - Same size as regular but with medium weight for emphasis within body
              content.
            </p>
            <code className="text-xs text-fg-neutral-secondary">.text-body-md-medium</code>
          </div>
          <div>
            <p className="text-sm text-fg-neutral-secondary max-w-2xl">
              Body SM Regular - Smaller body text for secondary information, captions, or when you
              need to fit more content in a smaller space.
            </p>
            <code className="text-xs text-fg-neutral-secondary">.text-body-sm-regular</code>
          </div>
          <div>
            <p className="text-xs text-fg-neutral-secondary max-w-2xl">
              Body XS Regular - Extra small body text for tertiary information, footnotes, or very
              dense content layouts.
            </p>
            <code className="text-xs text-fg-neutral-secondary">.text-body-xs-regular</code>
          </div>
        </div>
      </section>

      {/* Label Styles */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
          Label Styles (Forms & UI Elements)
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-fg-neutral-primary">Label LG Medium</span>
            <code className="text-xs text-fg-neutral-secondary">.text-label-lg-medium</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-fg-neutral-primary">Label MD Medium</span>
            <code className="text-xs text-fg-neutral-secondary">.text-label-md-medium</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-fg-neutral-primary">Label SM Medium</span>
            <code className="text-xs text-fg-neutral-secondary">.text-label-sm-medium</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-neutral-primary">Label XS Medium</span>
            <code className="text-xs text-fg-neutral-secondary">.text-label-xs-medium</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-fg-neutral-primary">Label 2XS Medium</span>
            <code className="text-xs text-fg-neutral-secondary">.text-label-2xs-medium</code>
          </div>
        </div>
      </section>

      {/* Eyebrow Styles */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">
          Eyebrow Styles (Overlines & Tags)
        </h2>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-fg-neutral-secondary">
              Eyebrow MD Medium
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-eyebrow-md-medium</code>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-fg-neutral-secondary">
              Eyebrow SM Medium
            </div>
            <code className="text-xs text-fg-neutral-secondary">.text-eyebrow-sm-medium</code>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Real-World Example</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Combining text styles with color tokens
        </p>
      </div>

      {/* Event Card */}
      <div className="max-w-md p-6 bg-bg-neutral-min rounded-lg shadow-elevation-medium">
        <div className="text-xs font-medium uppercase tracking-wide text-fg-neutral-secondary mb-2">
          Upcoming Event
        </div>
        <h3 className="text-xl font-bold text-fg-neutral-primary mb-2">Monthly Team Review</h3>
        <p className="text-base text-fg-neutral-secondary mb-4">
          Join us for our monthly review session where we discuss progress, blockers, and team
          updates.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg-neutral-primary">Date:</span>
          <span className="text-sm text-fg-neutral-secondary">December 15, 2025</span>
        </div>
      </div>

      {/* Article Card */}
      <div className="max-w-md p-6 bg-bg-neutral-min rounded-lg shadow-elevation-medium">
        <div className="text-xs font-medium uppercase tracking-wide text-fg-accent-primary mb-2">
          Featured Article
        </div>
        <h3 className="text-xl font-bold text-fg-neutral-primary mb-2">
          Getting Started with Design Tokens
        </h3>
        <p className="text-sm text-fg-neutral-secondary mb-4">
          Learn how design tokens create consistency across your product by establishing a shared
          design language.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-fg-neutral-secondary">5 min read</span>
          <span className="text-xs font-medium text-fg-accent-primary">Read more →</span>
        </div>
      </div>

      {/* Form Example */}
      <div className="max-w-md p-6 bg-bg-neutral-min rounded-lg shadow-elevation-medium">
        <h3 className="text-lg font-semibold text-fg-neutral-primary mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg-neutral-primary mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border-color-neutral rounded-lg text-base text-fg-neutral-primary bg-bg-neutral-min"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-neutral-primary mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-border-color-neutral rounded-lg text-base text-fg-neutral-primary bg-bg-neutral-min"
              placeholder="john@example.com"
            />
            <p className="mt-1 text-xs text-fg-neutral-secondary">
              We'll never share your email with anyone else.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const TypographyScale: Story = {
  render: () => (
    <div className="p-8 bg-bg-neutral-base">
      <h2 className="text-2xl font-bold mb-6 text-fg-neutral-primary">Typography Scale</h2>

      <div className="space-y-1">
        {[
          { size: '4xl', px: '36px', example: 'Display XL' },
          { size: '3xl', px: '30px', example: 'Display LG / Heading 3XL' },
          { size: '2xl', px: '24px', example: 'Display MD / Heading 2XL' },
          { size: 'xl', px: '20px', example: 'Heading XL / Title XL' },
          { size: 'lg', px: '18px', example: 'Heading LG / Body LG' },
          { size: 'base', px: '16px', example: 'Heading MD / Body MD' },
          { size: 'sm', px: '14px', example: 'Heading SM / Body SM / Label SM' },
          { size: 'xs', px: '12px', example: 'Body XS / Label XS / Eyebrow' },
          { size: '2xs', px: '10px', example: 'Label 2XS' },
        ].map((item) => (
          <div key={item.size} className="flex items-center gap-4 py-2 border-b border-border-color-neutral">
            <div className="w-16 text-right">
              <span className="text-xs font-mono text-fg-neutral-secondary">{item.px}</span>
            </div>
            <div className={`text-${item.size} text-fg-neutral-primary flex-1`}>
              The quick brown fox jumps over the lazy dog
            </div>
            <div className="w-48">
              <span className="text-xs text-fg-neutral-secondary">{item.example}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
