import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as x}from"./index-B2-qRKKC.js";import{c as F}from"./createLucideIcon-mz0sz0u3.js";import"./_commonjsHelpers-Cpj98o6Y.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=F("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);function n({title:i,expanded:a,onToggle:l,activeCount:t=0,children:s,className:r=""}){return e.jsxs("div",{className:r,children:[e.jsxs("button",{onClick:l,className:"w-full flex items-center justify-between py-2 group","aria-expanded":a,children:[e.jsx("span",{className:"text-sm font-medium text-fg-neutral-primary",children:i}),e.jsxs("div",{className:"flex items-center gap-2",children:[!a&&t>0&&e.jsx("span",{className:"text-xs font-medium text-fg-accent-primary bg-bg-accent-subtle px-1.5 py-0.5 rounded-full",children:t}),e.jsx(q,{className:`w-4 h-4 text-fg-neutral-soft transition-transform ${a?"rotate-180":""}`})]})]}),a&&e.jsx("div",{className:"pb-2",children:s})]})}try{n.displayName="CollapsibleSection",n.__docgenInfo={description:`CollapsibleSection - A disclosure/accordion component with title, chevron, and optional badge.

Shows a clickable header that toggles visibility of the children content.
When collapsed, can display an optional count badge (useful for showing active filters).`,displayName:"CollapsibleSection",props:{title:{defaultValue:null,description:"Section title displayed in the header",name:"title",required:!0,type:{name:"string"}},expanded:{defaultValue:null,description:"Whether the section is currently expanded",name:"expanded",required:!0,type:{name:"boolean"}},onToggle:{defaultValue:null,description:"Callback when the header is clicked to toggle expansion",name:"onToggle",required:!0,type:{name:"() => void"}},activeCount:{defaultValue:{value:"0"},description:"Optional count badge shown when collapsed (e.g., active filters)",name:"activeCount",required:!1,type:{name:"number"}},children:{defaultValue:null,description:"Content to display when expanded",name:"children",required:!0,type:{name:"ReactNode"}},className:{defaultValue:{value:""},description:"Additional className for the container",name:"className",required:!1,type:{name:"string"}}}}}catch{}const W={title:"Components/CollapsibleSection",component:n,parameters:{layout:"centered"},tags:["autodocs"],decorators:[i=>e.jsx("div",{className:"w-80 p-4 bg-bg-neutral-min rounded-lg border border-border-neutral-default",children:e.jsx(i,{})})]},c={args:{title:"Settings",expanded:!1,onToggle:()=>{},children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Setting 1"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Setting 2"})]})}},o={args:{title:"Settings",expanded:!0,onToggle:()=>{},children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Setting 1"}),e.jsx("p",{className:"text-sm text-fg-neutral-secondary",children:"Setting 2"})]})}},d={args:{title:"Filters",expanded:!1,onToggle:()=>{},activeCount:3,children:e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0})," High priority"]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0})," Medium priority"]}),e.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0})," Today"]})]})}},p={render:function(){const[a,l]=x.useState(!1);return e.jsx(n,{title:"Click to toggle",expanded:a,onToggle:()=>l(!a),activeCount:a?0:2,children:e.jsxs("div",{className:"space-y-2 text-sm text-fg-neutral-secondary",children:[e.jsx("p",{children:"This content is revealed when expanded."}),e.jsx("p",{children:'The badge shows "2" when collapsed.'})]})})}},u={render:function(){const[a,l]=x.useState({priority:!0,status:!1,project:!1}),t=s=>{l(r=>({...r,[s]:!r[s]}))};return e.jsxs("div",{className:"divide-y divide-border-neutral-default",children:[e.jsx(n,{title:"Priority",expanded:a.priority,onToggle:()=>t("priority"),activeCount:2,children:e.jsx("div",{className:"space-y-1",children:["High","Medium","Low"].map((s,r)=>e.jsxs("label",{className:"flex items-center gap-2 text-sm text-fg-neutral-secondary",children:[e.jsx("input",{type:"checkbox",defaultChecked:r<2})," ",s]},s))})}),e.jsx(n,{title:"Status",expanded:a.status,onToggle:()=>t("status"),activeCount:1,children:e.jsx("div",{className:"space-y-1",children:["In Progress","Waiting","Ready"].map((s,r)=>e.jsxs("label",{className:"flex items-center gap-2 text-sm text-fg-neutral-secondary",children:[e.jsx("input",{type:"checkbox",defaultChecked:r===0})," ",s]},s))})}),e.jsx(n,{title:"Project",expanded:a.project,onToggle:()=>t("project"),children:e.jsx("div",{className:"space-y-1",children:["Design System","Task Copilot","Documentation"].map(s=>e.jsxs("label",{className:"flex items-center gap-2 text-sm text-fg-neutral-secondary",children:[e.jsx("input",{type:"checkbox"})," ",s]},s))})})]})}},m={render:function(){const[a,l]=x.useState({energy:!1,time:!0});return e.jsxs("div",{className:"space-y-1",children:[e.jsx("h3",{className:"text-xs font-semibold text-fg-neutral-soft uppercase tracking-wide mb-2",children:"Filters"}),e.jsx(n,{title:"Energy Level",expanded:a.energy,onToggle:()=>l(t=>({...t,energy:!t.energy})),activeCount:1,children:e.jsx("div",{className:"flex flex-wrap gap-1.5",children:["Low","Medium","High"].map((t,s)=>e.jsx("button",{className:`px-2.5 py-1 text-xs rounded-full ${s===0?"bg-bg-accent-subtle text-fg-accent-primary":"bg-bg-neutral-subtle text-fg-neutral-secondary"}`,children:t},t))})}),e.jsx(n,{title:"Time Estimate",expanded:a.time,onToggle:()=>l(t=>({...t,time:!t.time})),children:e.jsx("div",{className:"flex flex-wrap gap-1.5",children:["5 min","15 min","30 min","1+ hr"].map(t=>e.jsx("button",{className:"px-2.5 py-1 text-xs rounded-full bg-bg-neutral-subtle text-fg-neutral-secondary",children:t},t))})})]})}};var g,f,h;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    title: 'Settings',
    expanded: false,
    onToggle: () => {},
    children: <div className="space-y-2">
        <p className="text-sm text-fg-neutral-secondary">Setting 1</p>
        <p className="text-sm text-fg-neutral-secondary">Setting 2</p>
      </div>
  }
}`,...(h=(f=c.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var y,b,v;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    title: 'Settings',
    expanded: true,
    onToggle: () => {},
    children: <div className="space-y-2">
        <p className="text-sm text-fg-neutral-secondary">Setting 1</p>
        <p className="text-sm text-fg-neutral-secondary">Setting 2</p>
      </div>
  }
}`,...(v=(b=o.parameters)==null?void 0:b.docs)==null?void 0:v.source}}};var N,j,S;d.parameters={...d.parameters,docs:{...(N=d.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    title: 'Filters',
    expanded: false,
    onToggle: () => {},
    activeCount: 3,
    children: <div className="space-y-2">
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
  }
}`,...(S=(j=d.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};var C,k,w;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: function InteractiveDemo() {
    const [expanded, setExpanded] = useState(false);
    return <CollapsibleSection title="Click to toggle" expanded={expanded} onToggle={() => setExpanded(!expanded)} activeCount={expanded ? 0 : 2}>
        <div className="space-y-2 text-sm text-fg-neutral-secondary">
          <p>This content is revealed when expanded.</p>
          <p>The badge shows "2" when collapsed.</p>
        </div>
      </CollapsibleSection>;
  }
}`,...(w=(k=p.parameters)==null?void 0:k.docs)==null?void 0:w.source}}};var T,D,E;u.parameters={...u.parameters,docs:{...(T=u.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: function MultipleSectionsDemo() {
    const [sections, setSections] = useState({
      priority: true,
      status: false,
      project: false
    });
    const toggle = (key: keyof typeof sections) => {
      setSections(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };
    return <div className="divide-y divide-border-neutral-default">
        <CollapsibleSection title="Priority" expanded={sections.priority} onToggle={() => toggle('priority')} activeCount={2}>
          <div className="space-y-1">
            {['High', 'Medium', 'Low'].map((p, i) => <label key={p} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" defaultChecked={i < 2} /> {p}
              </label>)}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Status" expanded={sections.status} onToggle={() => toggle('status')} activeCount={1}>
          <div className="space-y-1">
            {['In Progress', 'Waiting', 'Ready'].map((s, i) => <label key={s} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" defaultChecked={i === 0} /> {s}
              </label>)}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Project" expanded={sections.project} onToggle={() => toggle('project')}>
          <div className="space-y-1">
            {['Design System', 'Task Copilot', 'Documentation'].map(p => <label key={p} className="flex items-center gap-2 text-sm text-fg-neutral-secondary">
                <input type="checkbox" /> {p}
              </label>)}
          </div>
        </CollapsibleSection>
      </div>;
  }
}`,...(E=(D=u.parameters)==null?void 0:D.docs)==null?void 0:E.source}}};var I,M,_;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  render: function FilterDrawerDemo() {
    const [expanded, setExpanded] = useState({
      energy: false,
      time: true
    });
    return <div className="space-y-1">
        <h3 className="text-xs font-semibold text-fg-neutral-soft uppercase tracking-wide mb-2">
          Filters
        </h3>
        <CollapsibleSection title="Energy Level" expanded={expanded.energy} onToggle={() => setExpanded(p => ({
        ...p,
        energy: !p.energy
      }))} activeCount={1}>
          <div className="flex flex-wrap gap-1.5">
            {['Low', 'Medium', 'High'].map((e, i) => <button key={e} className={\`px-2.5 py-1 text-xs rounded-full \${i === 0 ? 'bg-bg-accent-subtle text-fg-accent-primary' : 'bg-bg-neutral-subtle text-fg-neutral-secondary'}\`}>
                {e}
              </button>)}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Time Estimate" expanded={expanded.time} onToggle={() => setExpanded(p => ({
        ...p,
        time: !p.time
      }))}>
          <div className="flex flex-wrap gap-1.5">
            {['5 min', '15 min', '30 min', '1+ hr'].map(t => <button key={t} className="px-2.5 py-1 text-xs rounded-full bg-bg-neutral-subtle text-fg-neutral-secondary">
                {t}
              </button>)}
          </div>
        </CollapsibleSection>
      </div>;
  }
}`,...(_=(M=m.parameters)==null?void 0:M.docs)==null?void 0:_.source}}};const A=["Collapsed","Expanded","WithActiveCount","Interactive","MultipleSections","InFilterDrawer"];export{c as Collapsed,o as Expanded,m as InFilterDrawer,p as Interactive,u as MultipleSections,d as WithActiveCount,A as __namedExportsOrder,W as default};
