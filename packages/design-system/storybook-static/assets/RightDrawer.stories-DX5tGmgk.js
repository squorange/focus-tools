import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as y}from"./index-B2-qRKKC.js";import{R as d}from"./RightDrawer-D_FLCX-Q.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-kS-9iBlu.js";import"./useReducedMotion-Cc5HMhSj.js";const S={title:"Components/RightDrawer",component:d,parameters:{layout:"fullscreen"},tags:["autodocs"]};function i({width:a="400px",children:c}){const[r,s]=y.useState(!1);return e.jsxs("div",{className:"h-screen flex items-center justify-center bg-bg-neutral-subtle",children:[e.jsx("button",{onClick:()=>s(!0),className:"px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors",children:"Open Right Drawer"}),e.jsx(d,{isOpen:r,onClose:()=>s(!1),width:a,children:c||e.jsxs("div",{className:"flex flex-col h-full",children:[e.jsxs("div",{className:"flex items-center justify-between p-4 border-b border-border-color-neutral",children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Right Drawer"}),e.jsxs("button",{onClick:()=>s(!1),className:"p-2 hover:bg-bg-neutral-subtle rounded-lg",children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})]})]}),e.jsxs("div",{className:"flex-1 p-4 overflow-y-auto",children:[e.jsx("p",{className:"text-fg-neutral-secondary mb-4",children:"Press Escape or click backdrop to close."}),e.jsx("p",{className:"text-fg-neutral-secondary",children:"This drawer slides in from the right, perfect for desktop side panels."})]}),e.jsx("div",{className:"p-4 border-t border-border-color-neutral",children:e.jsx("button",{onClick:()=>s(!1),className:"w-full py-2 bg-bg-neutral-low rounded-lg",children:"Close"})})]})})]})}const n={render:()=>e.jsx(i,{})},t={render:()=>e.jsx(i,{width:"500px"})},l={render:()=>e.jsx(i,{width:"320px"})},o={render:()=>{function a(){const[c,r]=y.useState(!1);return e.jsxs("div",{className:"h-screen flex items-center justify-center bg-bg-neutral-subtle",children:[e.jsx("button",{onClick:()=>r(!0),className:"px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors",children:"Edit Task"}),e.jsx(d,{isOpen:c,onClose:()=>r(!1),children:e.jsxs("div",{className:"flex flex-col h-full",children:[e.jsxs("div",{className:"flex items-center justify-between p-4 border-b border-border-color-neutral",children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Edit Task"}),e.jsxs("button",{onClick:()=>r(!1),className:"p-2 hover:bg-bg-neutral-subtle rounded-lg",children:[e.jsx("span",{className:"sr-only",children:"Close"}),e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})]})]}),e.jsx("div",{className:"flex-1 p-4 overflow-y-auto",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Title"}),e.jsx("input",{type:"text",defaultValue:"Review quarterly report",className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Description"}),e.jsx("textarea",{rows:4,defaultValue:"Go through the Q4 financial report and prepare summary for stakeholders.",className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Due Date"}),e.jsx("input",{type:"date",className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Priority"}),e.jsxs("select",{className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min",children:[e.jsx("option",{children:"High"}),e.jsx("option",{children:"Medium"}),e.jsx("option",{children:"Low"})]})]})]})}),e.jsxs("div",{className:"flex gap-2 p-4 border-t border-border-color-neutral",children:[e.jsx("button",{onClick:()=>r(!1),className:"flex-1 py-2 bg-bg-neutral-low rounded-lg",children:"Cancel"}),e.jsx("button",{className:"flex-1 py-2 bg-bg-accent-high text-white rounded-lg",children:"Save"})]})]})})]})}return e.jsx(a,{})}};var u,b,m;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => <RightDrawerDemo />
}`,...(m=(b=n.parameters)==null?void 0:b.docs)==null?void 0:m.source}}};var p,x,g;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <RightDrawerDemo width="500px" />
}`,...(g=(x=t.parameters)==null?void 0:x.docs)==null?void 0:g.source}}};var h,f,j;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <RightDrawerDemo width="320px" />
}`,...(j=(f=l.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};var N,w,v;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => {
    function FormDemo() {
      const [isOpen, setIsOpen] = useState(false);
      return <div className="h-screen flex items-center justify-center bg-bg-neutral-subtle">
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors">
            Edit Task
          </button>

          <RightDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-color-neutral">
                <h2 className="text-lg font-semibold">Edit Task</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-bg-neutral-subtle rounded-lg">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Title</label>
                    <input type="text" defaultValue="Review quarterly report" className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min" />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Description</label>
                    <textarea rows={4} defaultValue="Go through the Q4 financial report and prepare summary for stakeholders." className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min" />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Due Date</label>
                    <input type="date" className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min" />
                  </div>

                  <div>
                    <label className="block text-sm text-fg-neutral-secondary mb-1">Priority</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min">
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-4 border-t border-border-color-neutral">
                <button onClick={() => setIsOpen(false)} className="flex-1 py-2 bg-bg-neutral-low rounded-lg">
                  Cancel
                </button>
                <button className="flex-1 py-2 bg-bg-accent-high text-white rounded-lg">
                  Save
                </button>
              </div>
            </div>
          </RightDrawer>
        </div>;
    }
    return <FormDemo />;
  }
}`,...(v=(w=o.parameters)==null?void 0:w.docs)==null?void 0:v.source}}};const E=["Default","WideDrawer","NarrowDrawer","WithForm"];export{n as Default,l as NarrowDrawer,t as WideDrawer,o as WithForm,E as __namedExportsOrder,S as default};
