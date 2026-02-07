import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{P as r}from"./Pill-XOiuUw2_.js";import"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";const se={title:"Components/Pill",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","filled","empty","locked","success","warning","error","info","priority-high","priority-medium","priority-low","status-completed","status-today","status-focus","status-waiting","status-deferred","status-ready","status-inbox","status-archived","health-healthy","health-at-risk","health-critical"]},size:{control:"select",options:["xs","sm","md","lg"]}}},a={args:{children:"Label",variant:"default"}},i={args:{children:"Filled",variant:"filled"}},s={args:{children:"+ Add item",variant:"empty"}},t={args:{children:"Read only",variant:"locked"}},l={render:()=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{size:"xs",children:"Extra Small"}),e.jsx(r,{size:"sm",children:"Small"}),e.jsx(r,{size:"md",children:"Medium"}),e.jsx(r,{size:"lg",children:"Large"})]})},n={render:()=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{variant:"success",children:"Success"}),e.jsx(r,{variant:"warning",children:"Warning"}),e.jsx(r,{variant:"error",children:"Error"}),e.jsx(r,{variant:"info",children:"Info"})]})},c={render:()=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{variant:"priority-high",children:"High"}),e.jsx(r,{variant:"priority-medium",children:"Medium"}),e.jsx(r,{variant:"priority-low",children:"Low"})]})},o={render:()=>e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(r,{variant:"status-completed",children:"Completed"}),e.jsx(r,{variant:"status-today",children:"Today"}),e.jsx(r,{variant:"status-focus",children:"Focus"}),e.jsx(r,{variant:"status-waiting",children:"Waiting"}),e.jsx(r,{variant:"status-deferred",children:"Deferred"}),e.jsx(r,{variant:"status-ready",children:"Ready"}),e.jsx(r,{variant:"status-inbox",children:"Inbox"}),e.jsx(r,{variant:"status-archived",children:"Archived"})]})},d={render:()=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(r,{variant:"health-healthy",children:"Healthy"}),e.jsx(r,{variant:"health-at-risk",children:"Watch"}),e.jsx(r,{variant:"health-critical",children:"Alert"})]})},m={args:{children:"Due Tomorrow",icon:"📅",variant:"filled"}},p={args:{children:"Work Project",colorDot:"#7c3aed",variant:"default"}},h={args:{children:"Click me",variant:"filled",onClick:()=>alert("Clicked!")}},u={render:()=>e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(r,{variant:"status-today",size:"sm",children:"Today"}),e.jsx(r,{variant:"priority-high",size:"sm",children:"High"}),e.jsx(r,{colorDot:"#7c3aed",size:"sm",children:"Personal"}),e.jsx(r,{variant:"default",size:"sm",icon:"⏱",children:"30m"})]})};var v,g,x;a.parameters={...a.parameters,docs:{...(v=a.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    children: 'Label',
    variant: 'default'
  }
}`,...(x=(g=a.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var P,f,y;i.parameters={...i.parameters,docs:{...(P=i.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    children: 'Filled',
    variant: 'filled'
  }
}`,...(y=(f=i.parameters)==null?void 0:f.docs)==null?void 0:y.source}}};var j,S,k;s.parameters={...s.parameters,docs:{...(j=s.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    children: '+ Add item',
    variant: 'empty'
  }
}`,...(k=(S=s.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var z,w,D;t.parameters={...t.parameters,docs:{...(z=t.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    children: 'Read only',
    variant: 'locked'
  }
}`,...(D=(w=t.parameters)==null?void 0:w.docs)==null?void 0:D.source}}};var N,W,C;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">
      <Pill size="xs">Extra Small</Pill>
      <Pill size="sm">Small</Pill>
      <Pill size="md">Medium</Pill>
      <Pill size="lg">Large</Pill>
    </div>
}`,...(C=(W=l.parameters)==null?void 0:W.docs)==null?void 0:C.source}}};var E,b,T;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">
      <Pill variant="success">Success</Pill>
      <Pill variant="warning">Warning</Pill>
      <Pill variant="error">Error</Pill>
      <Pill variant="info">Info</Pill>
    </div>
}`,...(T=(b=n.parameters)==null?void 0:b.docs)==null?void 0:T.source}}};var F,H,I;c.parameters={...c.parameters,docs:{...(F=c.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">
      <Pill variant="priority-high">High</Pill>
      <Pill variant="priority-medium">Medium</Pill>
      <Pill variant="priority-low">Low</Pill>
    </div>
}`,...(I=(H=c.parameters)==null?void 0:H.docs)==null?void 0:I.source}}};var L,A,M;o.parameters={...o.parameters,docs:{...(L=o.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-center gap-2">
      <Pill variant="status-completed">Completed</Pill>
      <Pill variant="status-today">Today</Pill>
      <Pill variant="status-focus">Focus</Pill>
      <Pill variant="status-waiting">Waiting</Pill>
      <Pill variant="status-deferred">Deferred</Pill>
      <Pill variant="status-ready">Ready</Pill>
      <Pill variant="status-inbox">Inbox</Pill>
      <Pill variant="status-archived">Archived</Pill>
    </div>
}`,...(M=(A=o.parameters)==null?void 0:A.docs)==null?void 0:M.source}}};var R,_,O;d.parameters={...d.parameters,docs:{...(R=d.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">
      <Pill variant="health-healthy">Healthy</Pill>
      <Pill variant="health-at-risk">Watch</Pill>
      <Pill variant="health-critical">Alert</Pill>
    </div>
}`,...(O=(_=d.parameters)==null?void 0:_.docs)==null?void 0:O.source}}};var q,B,G;m.parameters={...m.parameters,docs:{...(q=m.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    children: 'Due Tomorrow',
    icon: '📅',
    variant: 'filled'
  }
}`,...(G=(B=m.parameters)==null?void 0:B.docs)==null?void 0:G.source}}};var J,K,Q;p.parameters={...p.parameters,docs:{...(J=p.parameters)==null?void 0:J.docs,source:{originalSource:`{
  args: {
    children: 'Work Project',
    colorDot: '#7c3aed',
    variant: 'default'
  }
}`,...(Q=(K=p.parameters)==null?void 0:K.docs)==null?void 0:Q.source}}};var U,V,X;h.parameters={...h.parameters,docs:{...(U=h.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    children: 'Click me',
    variant: 'filled',
    onClick: () => alert('Clicked!')
  }
}`,...(X=(V=h.parameters)==null?void 0:V.docs)==null?void 0:X.source}}};var Y,Z,$;u.parameters={...u.parameters,docs:{...(Y=u.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-center gap-2">
      <Pill variant="status-today" size="sm">Today</Pill>
      <Pill variant="priority-high" size="sm">High</Pill>
      <Pill colorDot="#7c3aed" size="sm">Personal</Pill>
      <Pill variant="default" size="sm" icon="⏱">30m</Pill>
    </div>
}`,...($=(Z=u.parameters)==null?void 0:Z.docs)==null?void 0:$.source}}};const te=["Default","Filled","Empty","Locked","Sizes","Feedback","Priority","Status","Health","WithEmojiIcon","WithColorDot","Interactive","TaskMetadata"];export{a as Default,s as Empty,n as Feedback,i as Filled,d as Health,h as Interactive,t as Locked,c as Priority,l as Sizes,o as Status,u as TaskMetadata,p as WithColorDot,m as WithEmojiIcon,te as __namedExportsOrder,se as default};
