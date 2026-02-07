import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";const $={title:"Design System/Semantics/Colors",parameters:{layout:"padded",docs:{description:{component:`
# Semantic Color Tokens

Purpose-driven color tokens organized by role (background, foreground, border) and semantic meaning.

## Token Structure

\`--color-{role}-{category}-{intensity}\`

| Part | Options | Example |
|------|---------|---------|
| **role** | bg, fg, border | \`bg\` |
| **category** | neutral, positive, alert, attention, information, accent, transparent, status-* | \`positive\` |
| **intensity** | subtle, low, low-accented, medium, strong, high, high-accented | \`subtle\` |

**Result**: \`bg-bg-positive-subtle\`

---

## Intensity Scale

| Intensity | Usage |
|-----------|-------|
| **subtle** | Very light backgrounds, pills |
| **low** | Light backgrounds, cards |
| **low-accented** | Hover states for low |
| **medium** | Medium emphasis |
| **strong** | Primary emphasis |
| **high** | Dark/saturated backgrounds |
| **high-accented** | Hover states for high |

---

## Categories

| Category | Purpose |
|----------|---------|
| **neutral** | Default UI, text, backgrounds |
| **positive** | Success, completion, good states |
| **alert** | Errors, critical, destructive |
| **attention** | Warnings, caution |
| **information** | Info, links, help |
| **accent** | Brand, focus, interactive |
| **transparent** | Overlays, subtle backgrounds |
| **status-*** | Task status colors |

---

## Usage

\`\`\`tsx
// Background
<div className="bg-bg-positive-subtle">Success message</div>

// Foreground (text)
<span className="text-fg-alert-primary">Error text</span>

// Border
<div className="border border-border-color-neutral">Card</div>
\`\`\`
        `}}},tags:["autodocs"]},s=({label:a,bgClass:r,description:b})=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:`w-16 h-10 rounded border border-zinc-200 dark:border-zinc-700 ${r}`}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-mono text-fg-neutral-primary",children:r}),e.jsx("div",{className:"text-xs text-fg-neutral-secondary",children:b})]})]}),t=({label:a,fgClass:r,description:b})=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"w-16 h-10 flex items-center justify-center bg-bg-neutral-subtle rounded border border-border-color-neutral",children:e.jsx("span",{className:`text-lg font-bold ${r}`,children:"Aa"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-mono text-fg-neutral-primary",children:r}),e.jsx("div",{className:"text-xs text-fg-neutral-secondary",children:b})]})]}),n={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Neutral Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Default colors for UI elements, text, and backgrounds"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-neutral-base",label:"base",description:"Page background"}),e.jsx(s,{bgClass:"bg-bg-neutral-min",label:"min",description:"Card backgrounds"}),e.jsx(s,{bgClass:"bg-bg-neutral-subtle",label:"subtle",description:"Subtle sections"}),e.jsx(s,{bgClass:"bg-bg-neutral-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-neutral-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-neutral-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-neutral-inverse",label:"inverse",description:"Dark surfaces"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds (Text)"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-neutral-primary",label:"primary",description:"Primary text"}),e.jsx(t,{fgClass:"text-fg-neutral-secondary",label:"secondary",description:"Secondary text"}),e.jsx(t,{fgClass:"text-fg-neutral-soft",label:"soft",description:"Subdued text"}),e.jsx(t,{fgClass:"text-fg-neutral-softer",label:"softer",description:"Very subdued"}),e.jsx(t,{fgClass:"text-fg-neutral-softest",label:"softest",description:"Lightest text"}),e.jsx(t,{fgClass:"text-fg-neutral-disabled",label:"disabled",description:"Disabled state"}),e.jsx(t,{fgClass:"text-fg-neutral-spot-readable",label:"spot-readable",description:"Mid-contrast"})]})]})]})]})},l={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Positive Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Success, completion, and good states"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-positive-subtle",label:"subtle",description:"Light success bg"}),e.jsx(s,{bgClass:"bg-bg-positive-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-positive-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-positive-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-positive-strong",label:"strong",description:"Strong emphasis"}),e.jsx(s,{bgClass:"bg-bg-positive-high",label:"high",description:"High saturation"}),e.jsx(s,{bgClass:"bg-bg-positive-high-accented",label:"high-accented",description:"Hover for high"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-positive-primary",label:"primary",description:"Primary success text"}),e.jsx(t,{fgClass:"text-fg-positive-secondary",label:"secondary",description:"Secondary text"})]}),e.jsx("h3",{className:"text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary",children:"Example"}),e.jsxs("div",{className:"p-4 bg-bg-positive-subtle rounded-lg border border-bg-positive-medium",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-5 h-5 rounded-full bg-bg-positive-high flex items-center justify-center",children:e.jsx("span",{className:"text-white text-xs",children:"✓"})}),e.jsx("span",{className:"text-fg-positive-primary font-medium",children:"Success!"})]}),e.jsx("p",{className:"text-fg-positive-secondary text-sm mt-1",children:"Your changes have been saved."})]})]})]})]})},i={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Alert Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Errors, critical states, and destructive actions"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-alert-subtle",label:"subtle",description:"Light error bg"}),e.jsx(s,{bgClass:"bg-bg-alert-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-alert-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-alert-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-alert-strong",label:"strong",description:"Strong emphasis"}),e.jsx(s,{bgClass:"bg-bg-alert-high",label:"high",description:"High saturation"}),e.jsx(s,{bgClass:"bg-bg-alert-high-accented",label:"high-accented",description:"Hover for high"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-alert-primary",label:"primary",description:"Primary error text"}),e.jsx(t,{fgClass:"text-fg-alert-secondary",label:"secondary",description:"Secondary text"})]}),e.jsx("h3",{className:"text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary",children:"Example"}),e.jsxs("div",{className:"p-4 bg-bg-alert-subtle rounded-lg border border-bg-alert-medium",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-5 h-5 rounded-full bg-bg-alert-high flex items-center justify-center",children:e.jsx("span",{className:"text-white text-xs",children:"!"})}),e.jsx("span",{className:"text-fg-alert-primary font-medium",children:"Error"})]}),e.jsx("p",{className:"text-fg-alert-secondary text-sm mt-1",children:"Something went wrong."})]})]})]})]})},o={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Attention Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Warnings and cautionary states"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-attention-subtle",label:"subtle",description:"Light warning bg"}),e.jsx(s,{bgClass:"bg-bg-attention-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-attention-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-attention-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-attention-strong",label:"strong",description:"Strong emphasis"}),e.jsx(s,{bgClass:"bg-bg-attention-high",label:"high",description:"High saturation"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-attention-primary",label:"primary",description:"Primary warning text"}),e.jsx(t,{fgClass:"text-fg-attention-secondary",label:"secondary",description:"Secondary text"})]}),e.jsx("h3",{className:"text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary",children:"Example"}),e.jsxs("div",{className:"p-4 bg-bg-attention-subtle rounded-lg border border-bg-attention-medium",children:[e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:"text-fg-attention-primary font-medium",children:"Warning"})}),e.jsx("p",{className:"text-fg-attention-secondary text-sm mt-1",children:"Please review before continuing."})]})]})]})]})},d={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Information Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Informational states, links, help"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-information-subtle",label:"subtle",description:"Light info bg"}),e.jsx(s,{bgClass:"bg-bg-information-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-information-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-information-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-information-strong",label:"strong",description:"Strong emphasis"}),e.jsx(s,{bgClass:"bg-bg-information-high",label:"high",description:"High saturation"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-information-primary",label:"primary",description:"Primary info text"}),e.jsx(t,{fgClass:"text-fg-information-secondary",label:"secondary",description:"Secondary text"})]}),e.jsx("h3",{className:"text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary",children:"Example"}),e.jsxs("div",{className:"p-4 bg-bg-information-subtle rounded-lg border border-bg-information-medium",children:[e.jsx("span",{className:"text-fg-information-primary font-medium",children:"Did you know?"}),e.jsx("p",{className:"text-fg-information-secondary text-sm mt-1",children:"You can use keyboard shortcuts for faster navigation."})]})]})]})]})},c={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Accent Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Brand colors, focus states, and interactive elements"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Backgrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(s,{bgClass:"bg-bg-accent-subtle",label:"subtle",description:"Light accent bg"}),e.jsx(s,{bgClass:"bg-bg-accent-low",label:"low",description:"Low emphasis"}),e.jsx(s,{bgClass:"bg-bg-accent-low-accented",label:"low-accented",description:"Hover for low"}),e.jsx(s,{bgClass:"bg-bg-accent-medium",label:"medium",description:"Medium emphasis"}),e.jsx(s,{bgClass:"bg-bg-accent-strong",label:"strong",description:"Strong emphasis"}),e.jsx(s,{bgClass:"bg-bg-accent-high",label:"high",description:"High saturation"}),e.jsx(s,{bgClass:"bg-bg-accent-high-accented",label:"high-accented",description:"Hover for high"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Foregrounds"}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(t,{fgClass:"text-fg-accent-primary",label:"primary",description:"Primary accent text"}),e.jsx(t,{fgClass:"text-fg-accent-secondary",label:"secondary",description:"Secondary text"})]}),e.jsx("h3",{className:"text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary",children:"Example"}),e.jsx("button",{className:"px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors",children:"Primary Button"})]})]})]})},g={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Status Colors"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Task status-specific colors for the productivity app"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-6",children:[{name:"completed",label:"Completed",description:"Done tasks"},{name:"today",label:"Today",description:"Due today"},{name:"focus",label:"Focus",description:"Currently focused"},{name:"waiting",label:"Waiting",description:"Waiting on others"},{name:"deferred",label:"Deferred",description:"Postponed"},{name:"ready",label:"Ready",description:"Ready to start"},{name:"inbox",label:"Inbox",description:"Unsorted tasks"},{name:"archived",label:"Archived",description:"Archived tasks"}].map(a=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:`w-16 h-10 rounded bg-bg-status-${a.name}-subtle border border-border-color-neutral`}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:`text-sm font-semibold text-fg-status-${a.name}`,children:a.label}),e.jsx("div",{className:"text-xs text-fg-neutral-secondary",children:a.description})]}),e.jsx("span",{className:`px-2 py-1 text-xs rounded-full bg-bg-status-${a.name}-subtle text-fg-status-${a.name}`,children:a.label})]},a.name))}),e.jsxs("div",{className:"p-6 bg-bg-neutral-subtle rounded-lg border border-border-color-neutral",children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-neutral-primary",children:"Status Token Pattern"}),e.jsxs("div",{className:"space-y-2 text-sm text-fg-neutral-secondary",children:[e.jsxs("p",{children:[e.jsx("code",{className:"bg-bg-neutral-low px-2 py-1 rounded font-mono text-xs",children:"bg-bg-status-[name]-subtle"})," ","- Background for pills/badges"]}),e.jsxs("p",{children:[e.jsx("code",{className:"bg-bg-neutral-low px-2 py-1 rounded font-mono text-xs",children:"text-fg-status-[name]"})," ","- Text/icon color"]})]})]})]})},m={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-base",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Real-World Examples"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Common UI patterns using semantic color tokens"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-neutral-primary",children:"Alert Banner"}),e.jsxs("div",{className:"p-4 bg-bg-alert-subtle border-l-4 border-bg-alert-high rounded-r",children:[e.jsx("div",{className:"font-medium text-fg-alert-primary",children:"Critical Update Required"}),e.jsx("p",{className:"text-sm text-fg-alert-secondary mt-1",children:"Please update your payment information to avoid service interruption."})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-neutral-primary",children:"Success Toast"}),e.jsxs("div",{className:"inline-flex items-center gap-3 px-4 py-3 bg-bg-positive-subtle rounded-lg border border-bg-positive-medium",children:[e.jsx("div",{className:"w-6 h-6 rounded-full bg-bg-positive-high flex items-center justify-center",children:e.jsx("span",{className:"text-white text-sm",children:"✓"})}),e.jsx("span",{className:"text-fg-positive-primary font-medium",children:"Changes saved successfully"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-neutral-primary",children:"Info Card"}),e.jsxs("div",{className:"max-w-md p-4 bg-bg-information-subtle rounded-lg border border-bg-information-medium",children:[e.jsx("h4",{className:"font-semibold text-fg-information-primary mb-2",children:"Pro Tip"}),e.jsxs("p",{className:"text-sm text-fg-information-secondary",children:["Use keyboard shortcuts to navigate faster. Press"," ",e.jsx("kbd",{className:"px-1.5 py-0.5 bg-bg-neutral-min rounded border border-border-color-neutral text-xs",children:"?"})," ","to see all available shortcuts."]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-neutral-primary",children:"Card with Sections"}),e.jsxs("div",{className:"max-w-md bg-bg-neutral-min rounded-lg border border-border-color-neutral overflow-hidden",children:[e.jsx("div",{className:"p-4 border-b border-border-color-neutral",children:e.jsx("h4",{className:"font-semibold text-fg-neutral-primary",children:"Project Settings"})}),e.jsx("div",{className:"p-4 bg-bg-neutral-subtle",children:e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Configure your project settings here."})}),e.jsxs("div",{className:"p-4 flex justify-end gap-2",children:[e.jsx("button",{className:"px-3 py-1.5 text-sm text-fg-neutral-primary border border-border-color-neutral rounded hover:bg-bg-neutral-subtle",children:"Cancel"}),e.jsx("button",{className:"px-3 py-1.5 text-sm text-white bg-bg-accent-high rounded hover:bg-bg-accent-high-accented",children:"Save"})]})]})]})]})};var p,x,u;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Neutral Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Default colors for UI elements, text, and backgrounds
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Backgrounds */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-neutral-base" label="base" description="Page background" />
            <ColorRow bgClass="bg-bg-neutral-min" label="min" description="Card backgrounds" />
            <ColorRow bgClass="bg-bg-neutral-subtle" label="subtle" description="Subtle sections" />
            <ColorRow bgClass="bg-bg-neutral-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-neutral-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-neutral-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-neutral-inverse" label="inverse" description="Dark surfaces" />
          </div>
        </div>

        {/* Foregrounds */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds (Text)</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-neutral-primary" label="primary" description="Primary text" />
            <FgColorRow fgClass="text-fg-neutral-secondary" label="secondary" description="Secondary text" />
            <FgColorRow fgClass="text-fg-neutral-soft" label="soft" description="Subdued text" />
            <FgColorRow fgClass="text-fg-neutral-softer" label="softer" description="Very subdued" />
            <FgColorRow fgClass="text-fg-neutral-softest" label="softest" description="Lightest text" />
            <FgColorRow fgClass="text-fg-neutral-disabled" label="disabled" description="Disabled state" />
            <FgColorRow fgClass="text-fg-neutral-spot-readable" label="spot-readable" description="Mid-contrast" />
          </div>
        </div>
      </div>
    </div>
}`,...(u=(x=n.parameters)==null?void 0:x.docs)==null?void 0:u.source}}};var h,f,v;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Positive Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Success, completion, and good states
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-positive-subtle" label="subtle" description="Light success bg" />
            <ColorRow bgClass="bg-bg-positive-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-positive-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-positive-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-positive-strong" label="strong" description="Strong emphasis" />
            <ColorRow bgClass="bg-bg-positive-high" label="high" description="High saturation" />
            <ColorRow bgClass="bg-bg-positive-high-accented" label="high-accented" description="Hover for high" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-positive-primary" label="primary" description="Primary success text" />
            <FgColorRow fgClass="text-fg-positive-secondary" label="secondary" description="Secondary text" />
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary">Example</h3>
          <div className="p-4 bg-bg-positive-subtle rounded-lg border border-bg-positive-medium">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-bg-positive-high flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-fg-positive-primary font-medium">Success!</span>
            </div>
            <p className="text-fg-positive-secondary text-sm mt-1">
              Your changes have been saved.
            </p>
          </div>
        </div>
      </div>
    </div>
}`,...(v=(f=l.parameters)==null?void 0:f.docs)==null?void 0:v.source}}};var y,N,j;i.parameters={...i.parameters,docs:{...(y=i.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Alert Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Errors, critical states, and destructive actions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-alert-subtle" label="subtle" description="Light error bg" />
            <ColorRow bgClass="bg-bg-alert-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-alert-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-alert-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-alert-strong" label="strong" description="Strong emphasis" />
            <ColorRow bgClass="bg-bg-alert-high" label="high" description="High saturation" />
            <ColorRow bgClass="bg-bg-alert-high-accented" label="high-accented" description="Hover for high" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-alert-primary" label="primary" description="Primary error text" />
            <FgColorRow fgClass="text-fg-alert-secondary" label="secondary" description="Secondary text" />
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary">Example</h3>
          <div className="p-4 bg-bg-alert-subtle rounded-lg border border-bg-alert-medium">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-bg-alert-high flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-fg-alert-primary font-medium">Error</span>
            </div>
            <p className="text-fg-alert-secondary text-sm mt-1">Something went wrong.</p>
          </div>
        </div>
      </div>
    </div>
}`,...(j=(N=i.parameters)==null?void 0:N.docs)==null?void 0:j.source}}};var C,w,S;o.parameters={...o.parameters,docs:{...(C=o.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Attention Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Warnings and cautionary states</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-attention-subtle" label="subtle" description="Light warning bg" />
            <ColorRow bgClass="bg-bg-attention-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-attention-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-attention-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-attention-strong" label="strong" description="Strong emphasis" />
            <ColorRow bgClass="bg-bg-attention-high" label="high" description="High saturation" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-attention-primary" label="primary" description="Primary warning text" />
            <FgColorRow fgClass="text-fg-attention-secondary" label="secondary" description="Secondary text" />
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary">Example</h3>
          <div className="p-4 bg-bg-attention-subtle rounded-lg border border-bg-attention-medium">
            <div className="flex items-center gap-2">
              <span className="text-fg-attention-primary font-medium">Warning</span>
            </div>
            <p className="text-fg-attention-secondary text-sm mt-1">
              Please review before continuing.
            </p>
          </div>
        </div>
      </div>
    </div>
}`,...(S=(w=o.parameters)==null?void 0:w.docs)==null?void 0:S.source}}};var R,k,P;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Information Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">Informational states, links, help</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-information-subtle" label="subtle" description="Light info bg" />
            <ColorRow bgClass="bg-bg-information-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-information-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-information-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-information-strong" label="strong" description="Strong emphasis" />
            <ColorRow bgClass="bg-bg-information-high" label="high" description="High saturation" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-information-primary" label="primary" description="Primary info text" />
            <FgColorRow fgClass="text-fg-information-secondary" label="secondary" description="Secondary text" />
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary">Example</h3>
          <div className="p-4 bg-bg-information-subtle rounded-lg border border-bg-information-medium">
            <span className="text-fg-information-primary font-medium">Did you know?</span>
            <p className="text-fg-information-secondary text-sm mt-1">
              You can use keyboard shortcuts for faster navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
}`,...(P=(k=d.parameters)==null?void 0:k.docs)==null?void 0:P.source}}};var F,H,B;c.parameters={...c.parameters,docs:{...(F=c.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Accent Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Brand colors, focus states, and interactive elements
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Backgrounds</h3>
          <div className="space-y-3">
            <ColorRow bgClass="bg-bg-accent-subtle" label="subtle" description="Light accent bg" />
            <ColorRow bgClass="bg-bg-accent-low" label="low" description="Low emphasis" />
            <ColorRow bgClass="bg-bg-accent-low-accented" label="low-accented" description="Hover for low" />
            <ColorRow bgClass="bg-bg-accent-medium" label="medium" description="Medium emphasis" />
            <ColorRow bgClass="bg-bg-accent-strong" label="strong" description="Strong emphasis" />
            <ColorRow bgClass="bg-bg-accent-high" label="high" description="High saturation" />
            <ColorRow bgClass="bg-bg-accent-high-accented" label="high-accented" description="Hover for high" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg-neutral-primary">Foregrounds</h3>
          <div className="space-y-3">
            <FgColorRow fgClass="text-fg-accent-primary" label="primary" description="Primary accent text" />
            <FgColorRow fgClass="text-fg-accent-secondary" label="secondary" description="Secondary text" />
          </div>

          <h3 className="text-lg font-semibold mb-4 mt-6 text-fg-neutral-primary">Example</h3>
          <button className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors">
            Primary Button
          </button>
        </div>
      </div>
    </div>
}`,...(B=(H=c.parameters)==null?void 0:H.docs)==null?void 0:B.source}}};var L,E,A;g.parameters={...g.parameters,docs:{...(L=g.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Status Colors</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Task status-specific colors for the productivity app
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[{
        name: 'completed',
        label: 'Completed',
        description: 'Done tasks'
      }, {
        name: 'today',
        label: 'Today',
        description: 'Due today'
      }, {
        name: 'focus',
        label: 'Focus',
        description: 'Currently focused'
      }, {
        name: 'waiting',
        label: 'Waiting',
        description: 'Waiting on others'
      }, {
        name: 'deferred',
        label: 'Deferred',
        description: 'Postponed'
      }, {
        name: 'ready',
        label: 'Ready',
        description: 'Ready to start'
      }, {
        name: 'inbox',
        label: 'Inbox',
        description: 'Unsorted tasks'
      }, {
        name: 'archived',
        label: 'Archived',
        description: 'Archived tasks'
      }].map(status => <div key={status.name} className="flex items-center gap-4">
            <div className={\`w-16 h-10 rounded bg-bg-status-\${status.name}-subtle border border-border-color-neutral\`} />
            <div className="flex-1">
              <div className={\`text-sm font-semibold text-fg-status-\${status.name}\`}>
                {status.label}
              </div>
              <div className="text-xs text-fg-neutral-secondary">{status.description}</div>
            </div>
            <span className={\`px-2 py-1 text-xs rounded-full bg-bg-status-\${status.name}-subtle text-fg-status-\${status.name}\`}>
              {status.label}
            </span>
          </div>)}
      </div>

      <div className="p-6 bg-bg-neutral-subtle rounded-lg border border-border-color-neutral">
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Status Token Pattern</h3>
        <div className="space-y-2 text-sm text-fg-neutral-secondary">
          <p>
            <code className="bg-bg-neutral-low px-2 py-1 rounded font-mono text-xs">
              bg-bg-status-[name]-subtle
            </code>{' '}
            - Background for pills/badges
          </p>
          <p>
            <code className="bg-bg-neutral-low px-2 py-1 rounded font-mono text-xs">
              text-fg-status-[name]
            </code>{' '}
            - Text/icon color
          </p>
        </div>
      </div>
    </div>
}`,...(A=(E=g.parameters)==null?void 0:E.docs)==null?void 0:A.source}}};var I,T,D;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-base">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-fg-neutral-primary">Real-World Examples</h2>
        <p className="text-sm text-fg-neutral-secondary mb-6">
          Common UI patterns using semantic color tokens
        </p>
      </div>

      {/* Alert Banner */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Alert Banner</h3>
        <div className="p-4 bg-bg-alert-subtle border-l-4 border-bg-alert-high rounded-r">
          <div className="font-medium text-fg-alert-primary">Critical Update Required</div>
          <p className="text-sm text-fg-alert-secondary mt-1">
            Please update your payment information to avoid service interruption.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Success Toast</h3>
        <div className="inline-flex items-center gap-3 px-4 py-3 bg-bg-positive-subtle rounded-lg border border-bg-positive-medium">
          <div className="w-6 h-6 rounded-full bg-bg-positive-high flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <span className="text-fg-positive-primary font-medium">Changes saved successfully</span>
        </div>
      </div>

      {/* Info Card */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Info Card</h3>
        <div className="max-w-md p-4 bg-bg-information-subtle rounded-lg border border-bg-information-medium">
          <h4 className="font-semibold text-fg-information-primary mb-2">Pro Tip</h4>
          <p className="text-sm text-fg-information-secondary">
            Use keyboard shortcuts to navigate faster. Press{' '}
            <kbd className="px-1.5 py-0.5 bg-bg-neutral-min rounded border border-border-color-neutral text-xs">
              ?
            </kbd>{' '}
            to see all available shortcuts.
          </p>
        </div>
      </div>

      {/* Card with Sections */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-fg-neutral-primary">Card with Sections</h3>
        <div className="max-w-md bg-bg-neutral-min rounded-lg border border-border-color-neutral overflow-hidden">
          <div className="p-4 border-b border-border-color-neutral">
            <h4 className="font-semibold text-fg-neutral-primary">Project Settings</h4>
          </div>
          <div className="p-4 bg-bg-neutral-subtle">
            <p className="text-sm text-fg-neutral-secondary">
              Configure your project settings here.
            </p>
          </div>
          <div className="p-4 flex justify-end gap-2">
            <button className="px-3 py-1.5 text-sm text-fg-neutral-primary border border-border-color-neutral rounded hover:bg-bg-neutral-subtle">
              Cancel
            </button>
            <button className="px-3 py-1.5 text-sm text-white bg-bg-accent-high rounded hover:bg-bg-accent-high-accented">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
}`,...(D=(T=m.parameters)==null?void 0:T.docs)==null?void 0:D.source}}};const Y=["SemanticNeutral","SemanticPositive","SemanticAlert","SemanticAttention","SemanticInformation","SemanticAccent","StatusColors","UsageExamples"];export{c as SemanticAccent,i as SemanticAlert,o as SemanticAttention,d as SemanticInformation,n as SemanticNeutral,l as SemanticPositive,g as StatusColors,m as UsageExamples,Y as __namedExportsOrder,$ as default};
