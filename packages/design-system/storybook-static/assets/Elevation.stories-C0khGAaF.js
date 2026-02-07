import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{R as f}from"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";const j={title:"Design System/Semantics/Elevation",parameters:{layout:"padded",docs:{description:{component:`
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
        `}}},tags:["autodocs"]},t={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-subtle",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Elevation Scale"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-8",children:"All elevation levels from flat to elevated"})]}),e.jsxs("div",{className:"grid grid-cols-4 gap-8",children:[e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:"w-32 h-32 bg-bg-neutral-min rounded-lg flex items-center justify-center border border-border-color-neutral",children:e.jsx("span",{className:"text-sm text-fg-neutral-secondary",children:"None"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("code",{className:"text-xs bg-bg-neutral-low px-2 py-1 rounded",children:"shadow-none"}),e.jsx("p",{className:"text-xs text-fg-neutral-secondary mt-1",children:"Flat/no shadow"})]})]}),e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:"w-32 h-32 shadow-elevation-low bg-bg-neutral-min rounded-lg flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-fg-neutral-secondary",children:"Low"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("code",{className:"text-xs bg-bg-neutral-low px-2 py-1 rounded",children:"shadow-elevation-low"}),e.jsx("p",{className:"text-xs text-fg-neutral-secondary mt-1",children:"Subtle"})]})]}),e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:"w-32 h-32 shadow-elevation-medium bg-bg-neutral-min rounded-lg flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-fg-neutral-primary font-semibold",children:"Medium ✓"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("code",{className:"text-xs bg-bg-neutral-low px-2 py-1 rounded",children:"shadow-elevation-medium"}),e.jsx("p",{className:"text-xs text-fg-neutral-secondary mt-1",children:"Default (recommended)"})]})]}),e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:"w-32 h-32 shadow-elevation-high bg-bg-neutral-min rounded-lg flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-fg-neutral-secondary",children:"High"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("code",{className:"text-xs bg-bg-neutral-low px-2 py-1 rounded",children:"shadow-elevation-high"}),e.jsx("p",{className:"text-xs text-fg-neutral-secondary mt-1",children:"Floating"})]})]})]})]})},a={render:()=>{const[p,l]=f.useState(!1);return e.jsxs("div",{className:"p-8 space-y-12 bg-bg-neutral-subtle",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Interactive States"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-4",children:"Elevation can change on hover to indicate interactivity"})]}),e.jsxs("div",{className:"space-y-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Hover Elevation Change"}),e.jsxs("div",{className:`${p?"shadow-elevation-high":"shadow-elevation-low"} transition-shadow max-w-sm p-6 bg-bg-neutral-min rounded-lg cursor-pointer`,onMouseEnter:()=>l(!0),onMouseLeave:()=>l(!1),children:[e.jsx("h4",{className:"font-semibold text-fg-neutral-primary mb-2",children:"Interactive Card"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Hover to see the elevation change from low to high"})]}),e.jsxs("p",{className:"text-xs text-fg-neutral-secondary mt-2",children:["Uses React state to swap"," ",e.jsx("code",{className:"bg-bg-neutral-low px-1 rounded",children:"shadow-elevation-low"})," →"," ",e.jsx("code",{className:"bg-bg-neutral-low px-1 rounded",children:"shadow-elevation-high"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Static Elevation"}),e.jsxs("div",{className:"shadow-elevation-medium max-w-sm p-6 bg-bg-neutral-min rounded-lg",children:[e.jsx("h4",{className:"font-semibold text-fg-neutral-primary mb-2",children:"Static Card"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Most cards don't need hover elevation effects"})]})]})]})]})}},s={render:()=>e.jsxs("div",{className:"p-8 space-y-12 bg-bg-neutral-subtle",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Real-World Examples"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Common UI patterns using elevation"})]}),e.jsxs("div",{className:"space-y-12",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Dashboard Cards (elevation-medium)"}),e.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[e.jsxs("div",{className:"shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg",children:[e.jsx("div",{className:"text-xs text-fg-neutral-secondary mb-2",children:"Total Tasks"}),e.jsx("div",{className:"text-2xl font-bold text-fg-neutral-primary",children:"127"}),e.jsx("div",{className:"text-sm text-fg-positive-primary mt-2",children:"+12 this week"})]}),e.jsxs("div",{className:"shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg",children:[e.jsx("div",{className:"text-xs text-fg-neutral-secondary mb-2",children:"Completed"}),e.jsx("div",{className:"text-2xl font-bold text-fg-neutral-primary",children:"89"}),e.jsx("div",{className:"text-sm text-fg-positive-primary mt-2",children:"70% completion"})]}),e.jsxs("div",{className:"shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg",children:[e.jsx("div",{className:"text-xs text-fg-neutral-secondary mb-2",children:"In Progress"}),e.jsx("div",{className:"text-2xl font-bold text-fg-neutral-primary",children:"38"}),e.jsx("div",{className:"text-sm text-fg-attention-primary mt-2",children:"8 due today"})]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Dropdown Menu (elevation-high)"}),e.jsxs("div",{className:"inline-block",children:[e.jsx("button",{className:"px-4 py-2 bg-bg-neutral-min shadow-elevation-low rounded-lg text-sm font-medium border border-border-color-neutral",children:"Options ▾"}),e.jsxs("div",{className:"mt-2 shadow-elevation-high bg-bg-neutral-min rounded-lg border border-border-color-neutral overflow-hidden w-48",children:[e.jsx("button",{className:"w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary",children:"Edit"}),e.jsx("button",{className:"w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary",children:"Duplicate"}),e.jsx("button",{className:"w-full px-4 py-2 text-left text-sm hover:bg-bg-neutral-subtle text-fg-neutral-primary",children:"Archive"}),e.jsx("hr",{className:"border-border-color-neutral"}),e.jsx("button",{className:"w-full px-4 py-2 text-left text-sm text-fg-alert-primary hover:bg-bg-alert-subtle",children:"Delete"})]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-fg-neutral-primary",children:"Modal Dialog (elevation-high)"}),e.jsxs("div",{className:"shadow-elevation-high max-w-md p-8 bg-bg-neutral-min rounded-xl",children:[e.jsx("h2",{className:"text-xl font-bold text-fg-neutral-primary mb-4",children:"Confirm Action"}),e.jsx("p",{className:"text-fg-neutral-secondary mb-6",children:"Are you sure you want to delete this item? This action cannot be undone."}),e.jsxs("div",{className:"flex gap-3 justify-end",children:[e.jsx("button",{className:"px-4 py-2 text-sm font-medium rounded-lg border border-border-color-neutral hover:bg-bg-neutral-subtle",children:"Cancel"}),e.jsx("button",{className:"px-4 py-2 text-sm font-medium rounded-lg bg-bg-alert-high text-white hover:bg-bg-alert-high-accented",children:"Delete"})]})]})]})]})]})},n={render:()=>e.jsxs("div",{className:"p-8 space-y-8 bg-bg-neutral-subtle",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2 text-fg-neutral-primary",children:"Stacking & Layering"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-8",children:"Understanding visual depth in complex interfaces"})]}),e.jsxs("div",{className:"relative shadow-elevation-low p-8 bg-bg-neutral-min rounded-lg",children:[e.jsx("h3",{className:"font-semibold mb-4 text-fg-neutral-primary",children:"Resting: Base Container (elevation-low)"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-6",children:"Subtle cards resting on the page background."}),e.jsxs("div",{className:"relative shadow-elevation-medium p-6 bg-bg-neutral-min rounded-lg",children:[e.jsx("h4",{className:"font-semibold mb-3 text-fg-neutral-primary",children:"Raised: Standard Card (elevation-medium)"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-4",children:"Most cards and containers use this elevation."}),e.jsxs("div",{className:"relative shadow-elevation-high p-4 bg-bg-neutral-min rounded-lg",children:[e.jsx("p",{className:"text-sm font-medium mb-2 text-fg-neutral-primary",children:"Floating: Dropdown (elevation-high)"}),e.jsx("p",{className:"text-xs text-fg-neutral-secondary",children:"Menus and tooltips that float above cards."})]})]})]}),e.jsxs("div",{className:"p-6 bg-bg-information-subtle border-l-4 border-bg-information-high rounded",children:[e.jsx("h3",{className:"text-lg font-semibold mb-3 text-fg-information-primary",children:"Stacking Guidelines"}),e.jsxs("ul",{className:"space-y-2 text-sm text-fg-information-secondary",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Flat"})," (none): Page background, borders, dividers"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Resting"})," (low): Subtle cards, minimal lift"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Raised"})," (medium): Standard cards and containers ✓"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Floating"})," (high): Dropdowns, modals, tooltips"]})]})]})]})};var r,d,i;t.parameters={...t.parameters,docs:{...(r=t.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-subtle">
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
}`,...(i=(d=t.parameters)==null?void 0:d.docs)==null?void 0:i.source}}};var o,m,c;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => {
    const [hoveredCard, setHoveredCard] = React.useState(false);
    return <div className="p-8 space-y-12 bg-bg-neutral-subtle">
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
            <div className={\`\${hoveredCard ? 'shadow-elevation-high' : 'shadow-elevation-low'} transition-shadow max-w-sm p-6 bg-bg-neutral-min rounded-lg cursor-pointer\`} onMouseEnter={() => setHoveredCard(true)} onMouseLeave={() => setHoveredCard(false)}>
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
      </div>;
  }
}`,...(c=(m=a.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var x,g,u;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-12 bg-bg-neutral-subtle">
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
}`,...(u=(g=s.parameters)==null?void 0:g.docs)==null?void 0:u.source}}};var h,b,v;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <div className="p-8 space-y-8 bg-bg-neutral-subtle">
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
}`,...(v=(b=n.parameters)==null?void 0:b.docs)==null?void 0:v.source}}};const S=["ElevationScale","InteractiveStates","RealWorldExamples","ElevationHierarchy"];export{n as ElevationHierarchy,t as ElevationScale,a as InteractiveStates,s as RealWorldExamples,S as __namedExportsOrder,j as default};
