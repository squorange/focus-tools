import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";function s({completed:t,total:r,isComplete:F=!1,variant:G="solid",size:a=20,className:u=""}){const l=(a-2)/2,f=2*Math.PI*l,h=r>0?t/r:0,J=f-h*f,K=G==="dashed";return F?e.jsx("div",{className:`rounded-full bg-bg-positive-strong flex items-center justify-center flex-shrink-0 ${u}`,style:{width:a,height:a},role:"img","aria-label":"Completed",children:e.jsx("svg",{className:"text-fg-neutral-inverse-primary",style:{width:a*.6,height:a*.6},fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",clipRule:"evenodd"})})}):K?e.jsx("svg",{width:a,height:a,className:`flex-shrink-0 ${u}`,role:"img","aria-label":"No progress",children:e.jsx("circle",{cx:a/2,cy:a/2,r:l,fill:"none",stroke:"currentColor",strokeWidth:2,strokeDasharray:"3 2",className:"text-fg-neutral-disabled"})}):e.jsxs("svg",{width:a,height:a,className:`transform -rotate-90 flex-shrink-0 ${u}`,role:"progressbar","aria-valuenow":t,"aria-valuemin":0,"aria-valuemax":r,"aria-label":`${t} of ${r} complete`,children:[e.jsx("circle",{cx:a/2,cy:a/2,r:l,fill:"none",stroke:"currentColor",strokeWidth:2,className:"text-fg-neutral-softest"}),h>0&&e.jsx("circle",{cx:a/2,cy:a/2,r:l,fill:"none",stroke:"currentColor",strokeWidth:2,strokeDasharray:f,strokeDashoffset:J,strokeLinecap:"round",className:"text-fg-accent-primary"})]})}try{s.displayName="ProgressRing",s.__docgenInfo={description:`ProgressRing - A circular progress indicator for task completion.

Shows step progress as a circular arc, or a checkmark when complete.`,displayName:"ProgressRing",props:{completed:{defaultValue:null,description:"Number of completed steps/items",name:"completed",required:!0,type:{name:"number"}},total:{defaultValue:null,description:"Total number of steps/items",name:"total",required:!0,type:{name:"number"}},isComplete:{defaultValue:{value:"false"},description:"Whether the task is fully complete (shows checkmark)",name:"isComplete",required:!1,type:{name:"boolean"}},variant:{defaultValue:{value:"solid"},description:"Visual variant: solid shows progress arc, dashed shows fully dashed circle",name:"variant",required:!1,type:{name:"enum",value:[{value:'"solid"'},{value:'"dashed"'}]}},size:{defaultValue:{value:"20"},description:"Size in pixels",name:"size",required:!1,type:{name:"number"}},className:{defaultValue:{value:""},description:"Custom className",name:"className",required:!1,type:{name:"string"}}}}}catch{}const Z={title:"Components/ProgressRing",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["solid","dashed"]},size:{control:{type:"range",min:12,max:48,step:4}}}},n={args:{completed:2,total:5}},o={args:{completed:0,total:5}},c={args:{completed:3,total:6}},i={args:{completed:4,total:5}},d={args:{completed:5,total:5,isComplete:!0}},m={args:{completed:0,total:0,variant:"dashed"}},p={render:()=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5,size:16}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"16px"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5,size:20}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"20px"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5,size:24}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"24px"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5,size:32}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"32px"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5,size:40}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"40px"})]})]})},x={render:()=>e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:0,total:5}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"0/5"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:1,total:5}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"1/5"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:2,total:5}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"2/5"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:3,total:5}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"3/5"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:4,total:5}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"4/5"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx(s,{completed:5,total:5,isComplete:!0}),e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"Done"})]})]})},g={render:()=>e.jsxs("div",{className:"flex flex-col gap-2 w-64",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle",children:[e.jsx(s,{completed:0,total:3,variant:"dashed"}),e.jsx("span",{className:"text-sm text-fg-neutral-primary",children:"New inbox item"})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle",children:[e.jsx(s,{completed:1,total:4}),e.jsx("span",{className:"text-sm text-fg-neutral-primary",children:"In progress task"})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle",children:[e.jsx(s,{completed:3,total:3,isComplete:!0}),e.jsx("span",{className:"text-sm text-fg-neutral-secondary line-through",children:"Completed task"})]})]})};var v,N,y;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    completed: 2,
    total: 5
  }
}`,...(y=(N=n.parameters)==null?void 0:N.docs)==null?void 0:y.source}}};var j,b,k;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    completed: 0,
    total: 5
  }
}`,...(k=(b=o.parameters)==null?void 0:b.docs)==null?void 0:k.source}}};var C,P,R;c.parameters={...c.parameters,docs:{...(C=c.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    completed: 3,
    total: 6
  }
}`,...(R=(P=c.parameters)==null?void 0:P.docs)==null?void 0:R.source}}};var w,S,D;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    completed: 4,
    total: 5
  }
}`,...(D=(S=i.parameters)==null?void 0:S.docs)==null?void 0:D.source}}};var _,V,q;d.parameters={...d.parameters,docs:{...(_=d.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    completed: 5,
    total: 5,
    isComplete: true
  }
}`,...(q=(V=d.parameters)==null?void 0:V.docs)==null?void 0:q.source}}};var I,W,$;m.parameters={...m.parameters,docs:{...(I=m.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    completed: 0,
    total: 0,
    variant: 'dashed'
  }
}`,...($=(W=m.parameters)==null?void 0:W.docs)==null?void 0:$.source}}};var E,L,T;p.parameters={...p.parameters,docs:{...(E=p.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={16} />
        <span className="text-xs text-fg-neutral-secondary">16px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={20} />
        <span className="text-xs text-fg-neutral-secondary">20px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={24} />
        <span className="text-xs text-fg-neutral-secondary">24px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={32} />
        <span className="text-xs text-fg-neutral-secondary">32px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} size={40} />
        <span className="text-xs text-fg-neutral-secondary">40px</span>
      </div>
    </div>
}`,...(T=(L=p.parameters)==null?void 0:L.docs)==null?void 0:T.source}}};var z,H,M;x.parameters={...x.parameters,docs:{...(z=x.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={0} total={5} />
        <span className="text-xs text-fg-neutral-secondary">0/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={1} total={5} />
        <span className="text-xs text-fg-neutral-secondary">1/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={2} total={5} />
        <span className="text-xs text-fg-neutral-secondary">2/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={3} total={5} />
        <span className="text-xs text-fg-neutral-secondary">3/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={4} total={5} />
        <span className="text-xs text-fg-neutral-secondary">4/5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ProgressRing completed={5} total={5} isComplete />
        <span className="text-xs text-fg-neutral-secondary">Done</span>
      </div>
    </div>
}`,...(M=(H=x.parameters)==null?void 0:H.docs)==null?void 0:M.source}}};var A,B,O;g.parameters={...g.parameters,docs:{...(A=g.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2 w-64">
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={0} total={3} variant="dashed" />
        <span className="text-sm text-fg-neutral-primary">New inbox item</span>
      </div>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={1} total={4} />
        <span className="text-sm text-fg-neutral-primary">In progress task</span>
      </div>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-neutral-subtle">
        <ProgressRing completed={3} total={3} isComplete />
        <span className="text-sm text-fg-neutral-secondary line-through">Completed task</span>
      </div>
    </div>
}`,...(O=(B=g.parameters)==null?void 0:B.docs)==null?void 0:O.source}}};const ee=["Default","Empty","HalfComplete","NearlyComplete","Complete","Dashed","Sizes","ProgressStates","InTaskList"];export{d as Complete,m as Dashed,n as Default,o as Empty,c as HalfComplete,g as InTaskList,i as NearlyComplete,x as ProgressStates,p as Sizes,ee as __namedExportsOrder,Z as default};
