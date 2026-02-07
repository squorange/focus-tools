import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as D}from"./index-B2-qRKKC.js";import{B as k}from"./BottomSheet-CijdfXmX.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-kS-9iBlu.js";import"./useReducedMotion-Cc5HMhSj.js";const E={title:"Components/BottomSheet",component:k,parameters:{layout:"fullscreen"},tags:["autodocs"]};function t({height:d="50vh",children:r}){const[B,c]=D.useState(!1);return e.jsxs("div",{className:"h-screen flex items-center justify-center bg-bg-neutral-subtle",children:[e.jsx("button",{onClick:()=>c(!0),className:"px-4 py-2 bg-bg-accent-high text-white rounded-lg hover:bg-bg-accent-high-accented transition-colors",children:"Open Bottom Sheet"}),e.jsx(k,{isOpen:B,onClose:()=>c(!1),height:d,children:r||e.jsxs("div",{className:"p-4",children:[e.jsx("h2",{className:"text-lg font-semibold mb-2",children:"Bottom Sheet"}),e.jsx("p",{className:"text-fg-neutral-secondary mb-4",children:"Drag down or click backdrop to close. Try swiping down quickly!"}),e.jsx("button",{onClick:()=>c(!1),className:"w-full py-2 bg-bg-neutral-low rounded-lg",children:"Close"})]})})]})}const o={render:()=>e.jsx(t,{})},s={render:()=>e.jsx(t,{height:"70vh"})},l={render:()=>e.jsx(t,{height:"30vh"})},a={render:()=>e.jsx(t,{height:"60vh",children:e.jsxs("div",{className:"p-4 flex flex-col gap-4",children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Add New Task"}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Title"}),e.jsx("input",{type:"text",placeholder:"Task title...",className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm text-fg-neutral-secondary mb-1",children:"Description"}),e.jsx("textarea",{placeholder:"Optional description...",rows:3,className:"w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min"})]}),e.jsxs("div",{className:"flex gap-2 mt-auto",children:[e.jsx("button",{className:"flex-1 py-2 bg-bg-neutral-low rounded-lg",children:"Cancel"}),e.jsx("button",{className:"flex-1 py-2 bg-bg-accent-high text-white rounded-lg",children:"Add Task"})]})]})})},n={render:()=>e.jsxs(t,{height:"60vh",children:[e.jsx("div",{className:"p-4",children:e.jsx("h2",{className:"text-lg font-semibold mb-4",children:"Select Option"})}),e.jsx("div",{className:"flex-1 overflow-y-auto px-4 pb-4",children:Array.from({length:20},(d,r)=>e.jsxs("button",{className:"w-full p-3 text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors",children:["Option ",r+1]},r))})]})};var i,m,h;o.parameters={...o.parameters,docs:{...(i=o.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <BottomSheetDemo />
}`,...(h=(m=o.parameters)==null?void 0:m.docs)==null?void 0:h.source}}};var p,u,b;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <BottomSheetDemo height="70vh" />
}`,...(b=(u=s.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};var g,x,f;l.parameters={...l.parameters,docs:{...(g=l.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <BottomSheetDemo height="30vh" />
}`,...(f=(x=l.parameters)==null?void 0:x.docs)==null?void 0:f.source}}};var v,N,j;a.parameters={...a.parameters,docs:{...(v=a.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <BottomSheetDemo height="60vh">
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Add New Task</h2>

        <div>
          <label className="block text-sm text-fg-neutral-secondary mb-1">Title</label>
          <input type="text" placeholder="Task title..." className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min" />
        </div>

        <div>
          <label className="block text-sm text-fg-neutral-secondary mb-1">Description</label>
          <textarea placeholder="Optional description..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border-color-neutral bg-bg-neutral-min" />
        </div>

        <div className="flex gap-2 mt-auto">
          <button className="flex-1 py-2 bg-bg-neutral-low rounded-lg">
            Cancel
          </button>
          <button className="flex-1 py-2 bg-bg-accent-high text-white rounded-lg">
            Add Task
          </button>
        </div>
      </div>
    </BottomSheetDemo>
}`,...(j=(N=a.parameters)==null?void 0:N.docs)==null?void 0:j.source}}};var S,y,w;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <BottomSheetDemo height="60vh">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Select Option</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Array.from({
        length: 20
      }, (_, i) => <button key={i} className="w-full p-3 text-left hover:bg-bg-neutral-subtle rounded-lg transition-colors">
            Option {i + 1}
          </button>)}
      </div>
    </BottomSheetDemo>
}`,...(w=(y=n.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};const F=["Default","TallSheet","ShortSheet","WithForm","WithScrollableContent"];export{o as Default,l as ShortSheet,s as TallSheet,a as WithForm,n as WithScrollableContent,F as __namedExportsOrder,E as default};
