import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as h}from"./index-B2-qRKKC.js";import{P as t}from"./Pill-XOiuUw2_.js";import{c as w}from"./createLucideIcon-mz0sz0u3.js";import"./_commonjsHelpers-Cpj98o6Y.js";const Pe=h.createContext({variant:"standard",appearance:"default",isComplete:!1}),Fe=()=>h.useContext(Pe),Be=h.forwardRef(({children:r,className:i=""},l)=>e.jsx("div",{ref:l,className:`flex items-center gap-[var(--actionable-card-gap)] shrink-0 ${i}`,children:r}));Be.displayName="ActionableCard.Leading";const we=h.forwardRef(({children:r,className:i=""},l)=>e.jsx("div",{ref:l,className:`flex flex-col gap-1 min-w-0 flex-1 ${i}`,children:r}));we.displayName="ActionableCard.Body";const Le=h.forwardRef(({clamp:r,strikethrough:i,children:l,className:d=""},c)=>{const{isComplete:s,variant:b}=Fe(),L=i??s,g=r??(b==="compact"?2:void 0),N=`text-[length:var(--actionable-card-title-size)] ${b==="compact"?"font-[number:var(--actionable-card-compact-title-weight)]":"font-[number:var(--actionable-card-title-weight)]"} leading-[var(--actionable-card-title-line-height)] text-fg-neutral-primary truncate`,R=L?"line-through":"",S=g?{display:"-webkit-box",WebkitLineClamp:g,WebkitBoxOrient:"vertical",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"normal"}:{};return e.jsx("span",{ref:c,className:`${N} ${R} ${d}`,style:S,children:l})});Le.displayName="ActionableCard.Title";const Ne=h.forwardRef(({position:r="inline",children:i,className:l=""},d)=>{const c="flex items-center gap-1.5 flex-wrap text-[length:var(--actionable-card-meta-size)] leading-[var(--actionable-card-meta-line-height)] text-fg-neutral-secondary",s=r==="bottom"?"mt-auto":"";return e.jsx("div",{ref:d,className:`${c} ${s} ${l}`,children:i})});Ne.displayName="ActionableCard.Meta";const Re=h.forwardRef(({children:r,className:i=""},l)=>e.jsx("div",{ref:l,className:`flex items-center gap-2 mt-2 ${i}`,children:r}));Re.displayName="ActionableCard.InlineActions";const Se=h.forwardRef(({children:r,className:i=""},l)=>e.jsx("div",{ref:l,className:`flex items-center gap-1.5 shrink-0 ml-auto ${i}`,children:r}));Se.displayName="ActionableCard.Trailing";const De=h.forwardRef(({variant:r="standard",appearance:i="default",isComplete:l=!1,emphasis:d="secondary",height:c,onClick:s,className:b="",children:L},g)=>{const W="relative border transition-colors",N=r==="compact"?"rounded-[var(--actionable-card-compact-radius)]":"rounded-[var(--actionable-card-radius)]",R=r==="standard"?"px-[var(--actionable-card-padding-x)] sm:px-[var(--actionable-card-padding-x-sm)] py-[var(--actionable-card-padding-y)]":"px-[var(--actionable-card-padding-x)] py-[var(--actionable-card-padding-y)]",S=r==="standard"?"flex items-start gap-[var(--actionable-card-gap)]":"flex flex-col",Ie={default:"bg-[var(--actionable-card-bg-default)] border-[var(--actionable-card-border-default)] hover:bg-[var(--actionable-card-hover-bg-default)] hover:border-[var(--actionable-card-hover-border-default)]",highlighted:"bg-[var(--actionable-card-bg-highlighted)] border-[var(--actionable-card-border-highlighted)] hover:bg-[var(--actionable-card-hover-bg-highlighted)] hover:border-[var(--actionable-card-hover-border-highlighted)]",muted:"bg-[var(--actionable-card-bg-muted)] border-[var(--actionable-card-border-muted)] opacity-[var(--actionable-card-opacity-muted)]"},Oe=d==="primary"?"border-2":"border",Qe=l?"opacity-[var(--actionable-card-complete-opacity)]":"",We=s?"cursor-pointer active:scale-[0.995]":"",qe=c?{height:typeof c=="number"?`${c}px`:c}:r==="compact"?{height:"var(--actionable-card-compact-height)"}:{},Ke=[W,N,R,S,Ie[i],Oe,Qe,We,b].filter(Boolean).join(" ");return e.jsx(Pe.Provider,{value:{variant:r,appearance:i,isComplete:l},children:e.jsx("div",{ref:g,className:Ke,style:qe,onClick:s,role:s?"button":void 0,tabIndex:s?0:void 0,onKeyDown:s?D=>{(D.key==="Enter"||D.key===" ")&&(D.preventDefault(),s())}:void 0,children:L})})});De.displayName="ActionableCard";const a=Object.assign(De,{Leading:Be,Body:we,Title:Le,Meta:Ne,InlineActions:Re,Trailing:Se});try{a.displayName="ActionableCard",a.__docgenInfo={description:"",displayName:"ActionableCard",props:{variant:{defaultValue:{value:"standard"},description:"Layout variant",name:"variant",required:!1,type:{name:"enum",value:[{value:'"standard"'},{value:'"compact"'}]}},appearance:{defaultValue:{value:"default"},description:"Visual appearance (use 'highlighted' for today/queue items)",name:"appearance",required:!1,type:{name:"enum",value:[{value:'"default"'},{value:'"highlighted"'},{value:'"muted"'}]}},isComplete:{defaultValue:{value:"false"},description:"Show completed state (reduced opacity + strikethrough)",name:"isComplete",required:!1,type:{name:"boolean"}},emphasis:{defaultValue:{value:"secondary"},description:"Border emphasis",name:"emphasis",required:!1,type:{name:"enum",value:[{value:'"primary"'},{value:'"secondary"'}]}},height:{defaultValue:null,description:"Fixed height for compact variant",name:"height",required:!1,type:{name:"string | number"}},onClick:{defaultValue:null,description:"Click handler for entire card",name:"onClick",required:!1,type:{name:"(() => void)"}},className:{defaultValue:{value:""},description:"Additional className for overrides",name:"className",required:!1,type:{name:"string"}}}}}catch{}/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=w("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=w("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=w("MoreVertical",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=w("Zap",[["polygon",{points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2",key:"45s27k"}]]),Ge={title:"Components/ActionableCard",component:a,parameters:{layout:"padded",docs:{description:{component:`ActionableCard is a unified card primitive for tasks, notifications, and routines.
It uses a slot-based composition pattern with Leading, Body, and Trailing sections.`}}},tags:["autodocs"],argTypes:{variant:{control:"select",options:["standard","compact"],description:"Layout variant"},appearance:{control:"select",options:["default","highlighted","muted"],description:"Visual appearance (use highlighted for today/queue items)"},isComplete:{control:"boolean",description:"Show completed state (reduced opacity + strikethrough)"},emphasis:{control:"select",options:["primary","secondary"],description:"Border emphasis"}}},n=({isComplete:r=!1,progress:i=0,dashed:l=!1})=>{if(r)return e.jsx("div",{className:"w-5 h-5 rounded-full bg-bg-positive-strong flex items-center justify-center",children:e.jsx($e,{className:"w-3 h-3 text-white"})});const d=9,c=2*Math.PI*d,s=c*(1-i);return e.jsxs("svg",{width:20,height:20,className:"transform -rotate-90",children:[e.jsx("circle",{cx:10,cy:10,r:d,fill:"none",stroke:"currentColor",strokeWidth:2,strokeDasharray:l?"3 3":void 0,className:"text-zinc-300 dark:text-zinc-600"}),i>0&&e.jsx("circle",{cx:10,cy:10,r:d,fill:"none",stroke:"currentColor",strokeWidth:2,strokeDasharray:c,strokeDashoffset:s,strokeLinecap:"round",className:"text-violet-500"})]})},o=({children:r,variant:i="default"})=>e.jsx("button",{className:`px-2 py-1 rounded text-xs font-medium transition-colors ${i==="primary"?"bg-bg-accent-subtle text-fg-accent-primary hover:bg-bg-accent-low":"bg-bg-transparent-low text-fg-neutral-primary hover:bg-bg-transparent-medium"}`,onClick:l=>l.stopPropagation(),children:r}),p=()=>e.jsx("button",{className:"p-1 flex items-center justify-center rounded text-fg-neutral-soft hover:text-fg-neutral-primary hover:bg-bg-transparent-low",onClick:r=>r.stopPropagation(),children:e.jsx(ze,{className:"w-4 h-4"})}),x={render:()=>e.jsxs(a,{onClick:()=>alert("Card clicked"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Review quarterly OKRs with team"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"2/5 steps"}),e.jsx(t,{variant:"info",children:"Due Friday"}),e.jsx(t,{colorDot:"#7c3aed",children:"Work"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"Focus"}),e.jsx(p,{})]})]})},m={render:()=>e.jsxs(a,{appearance:"highlighted",onClick:()=>alert("Card clicked"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Morning standup meeting"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"1/3 steps"}),e.jsx(t,{children:"9:00 AM"}),e.jsx(t,{colorDot:"#3b82f6",children:"Daily"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"Start"}),e.jsx(p,{})]})]})},u={render:()=>e.jsxs(a,{appearance:"muted",onClick:()=>alert("Card clicked"),children:[e.jsx(a.Leading,{children:e.jsx(n,{isComplete:!0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{strikethrough:!0,children:"Completed task with all steps done"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"5/5 steps"}),e.jsx(t,{children:"Completed 2h ago"})]})]}),e.jsx(a.Trailing,{children:e.jsx(p,{})})]})},C={render:()=>e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsxs(a,{appearance:"default",children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Default appearance - Pool/Inbox tasks"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"2/5 steps"}),e.jsx(t,{colorDot:"#7c3aed",children:"Work"})]})]}),e.jsx(a.Trailing,{children:e.jsx(o,{variant:"primary",children:"Focus"})})]}),e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Highlighted appearance - Today/Queue items"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"1/3 steps"}),e.jsx(t,{variant:"info",children:"Due Today"})]})]}),e.jsx(a.Trailing,{children:e.jsx(o,{variant:"primary",children:"Start"})})]}),e.jsxs(a,{appearance:"muted",children:[e.jsx(a.Leading,{children:e.jsx(n,{isComplete:!0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{strikethrough:!0,children:"Muted appearance - Completed tasks"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"5/5 steps"}),e.jsx(t,{children:"Done"})]})]}),e.jsx(a.Trailing,{children:e.jsx(p,{})})]})]})},A={name:"Progress States",render:()=>e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-2",children:"Progress ring shows partial completion with an arc indicator."}),e.jsxs(a,{children:[e.jsx(a.Leading,{children:e.jsx(n,{progress:0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Not started - 0% progress"}),e.jsx(a.Meta,{children:e.jsx(t,{children:"0/4 steps"})})]})]}),e.jsxs(a,{children:[e.jsx(a.Leading,{children:e.jsx(n,{progress:.25})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Quarter done - 25% progress"}),e.jsx(a.Meta,{children:e.jsx(t,{children:"1/4 steps"})})]})]}),e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(n,{progress:.5})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Halfway there - 50% progress"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"2/4 steps"}),e.jsx(t,{variant:"info",children:"In Progress"})]})]})]}),e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(n,{progress:.75})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Almost done - 75% progress"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"3/4 steps"}),e.jsx(t,{variant:"info",children:"In Progress"})]})]})]}),e.jsxs(a,{appearance:"muted",children:[e.jsx(a.Leading,{children:e.jsx(n,{isComplete:!0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{strikethrough:!0,children:"Complete - checkmark indicator"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"4/4 steps"}),e.jsx(t,{children:"Done"})]})]})]})]})},j={name:"Queue State (via Colors)",render:()=>e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-2",children:"Queue/today state is indicated by appearance colors, not offset bars."}),e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Task in today queue (highlighted appearance)"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"0/4 steps"}),e.jsx(t,{variant:"info",children:"Today"}),e.jsx(t,{colorDot:"#10b981",children:"Personal"})]})]}),e.jsx(a.Trailing,{children:e.jsx(o,{variant:"primary",children:"Start"})})]}),e.jsxs(a,{appearance:"default",children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Task not in queue (default appearance)"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"0/4 steps"}),e.jsx(t,{colorDot:"#10b981",children:"Personal"})]})]}),e.jsx(a.Trailing,{children:e.jsx(o,{variant:"primary",children:"Add to Queue"})})]})]})},I=({count:r})=>e.jsxs("span",{className:"inline-flex items-center gap-0.5 text-xs font-medium text-fg-neutral-secondary",children:[e.jsx(_e,{className:"w-3.5 h-3.5"}),r]}),O=({alert:r=!1})=>e.jsx("div",{className:"w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-transparent flex items-center justify-center",children:r&&e.jsx("span",{className:"text-zinc-400 dark:text-zinc-500 text-[9px] font-semibold",children:"!"})}),y={render:()=>e.jsxs("div",{className:"flex gap-3 overflow-x-auto pb-2",children:[e.jsxs(a,{variant:"compact",appearance:"highlighted",height:110,className:"w-40 shrink-0",onClick:()=>alert("Routine clicked"),children:[e.jsxs("div",{className:"flex items-start justify-between mb-2",children:[e.jsx(a.Leading,{children:e.jsx(O,{})}),e.jsx(a.Trailing,{children:e.jsx(I,{count:5})})]}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{clamp:2,children:"Morning workout routine"}),e.jsx(a.Meta,{position:"bottom",children:e.jsx("span",{className:"text-xs text-fg-neutral-soft",children:"Daily at 7 AM"})})]})]}),e.jsxs(a,{variant:"compact",appearance:"default",height:110,className:"w-40 shrink-0",onClick:()=>alert("Routine clicked"),children:[e.jsxs("div",{className:"flex items-start justify-between mb-2",children:[e.jsx(a.Leading,{children:e.jsx(O,{alert:!0})}),e.jsx(a.Trailing,{children:e.jsx(I,{count:12})})]}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{clamp:2,children:"Review and respond to emails"}),e.jsx(a.Meta,{position:"bottom",children:e.jsx("span",{className:"text-xs text-fg-attention-primary",children:"Overdue"})})]})]}),e.jsxs(a,{variant:"compact",appearance:"default",height:110,className:"w-40 shrink-0",onClick:()=>alert("Routine clicked"),children:[e.jsxs("div",{className:"flex items-start justify-between mb-2",children:[e.jsx(a.Leading,{children:e.jsx(O,{})}),e.jsx(a.Trailing,{children:e.jsx(I,{count:3})})]}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{clamp:2,children:"Weekly planning"}),e.jsx(a.Meta,{position:"bottom",children:e.jsx("span",{className:"text-xs text-fg-neutral-soft",children:"Mon at 9 AM"})})]})]})]})},Q=({type:r})=>e.jsx("div",{className:"w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center",children:r==="poke"?"👉":e.jsx(Ve,{className:"w-4 h-4 text-violet-600 dark:text-violet-400"})}),f={render:()=>e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(Q,{type:"poke"})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Time for your daily standup!"}),e.jsx(a.Meta,{children:e.jsx("span",{className:"text-xs text-fg-neutral-soft",children:"2 minutes ago"})}),e.jsxs(a.InlineActions,{children:[e.jsx(o,{variant:"primary",children:"Start"}),e.jsx(o,{children:"Snooze 5m"}),e.jsx(o,{children:"Dismiss"})]})]})]}),e.jsxs(a,{appearance:"highlighted",children:[e.jsx(a.Leading,{children:e.jsx(Q,{type:"bell"})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Missed: Weekly review"}),e.jsx(a.Meta,{children:e.jsx("span",{className:"text-xs text-fg-neutral-soft",children:"30 minutes ago"})}),e.jsxs(a.InlineActions,{children:[e.jsx(o,{variant:"primary",children:"Start Now"}),e.jsx(o,{children:"Reschedule"})]})]})]}),e.jsxs(a,{appearance:"muted",children:[e.jsx(a.Leading,{children:e.jsx(Q,{type:"bell"})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Completed: Morning routine"}),e.jsx(a.Meta,{children:e.jsx("span",{className:"text-xs text-fg-neutral-soft",children:"Yesterday at 8:00 AM"})})]})]})]})},k={name:"Pool Task Row",render:()=>e.jsxs(a,{onClick:()=>alert("Open task"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Review quarterly OKRs with team"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"2/5 steps"}),e.jsx(t,{variant:"info",children:"Due Friday"}),e.jsx(t,{colorDot:"#7c3aed",children:"Work"}),e.jsx(t,{children:"30m"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"+ Focus"}),e.jsx(p,{})]})]})},v={name:"Queue Item (Today)",render:()=>e.jsxs(a,{appearance:"highlighted",onClick:()=>alert("Open task"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Prepare presentation slides"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"1/3 steps"}),e.jsx(t,{variant:"info",children:"Due 3 PM"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"▶"}),e.jsx(p,{})]})]})},M={name:"Queue Item (Upcoming)",render:()=>e.jsxs(a,{appearance:"highlighted",onClick:()=>alert("Open task"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"Research competitor products"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"0/4 steps"}),e.jsx(t,{children:"Tomorrow"}),e.jsx(t,{colorDot:"#f59e0b",children:"Strategy"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{children:"Move to Today"}),e.jsx(p,{})]})]})},T={name:"Triage Row (Inbox)",render:()=>e.jsxs(a,{onClick:()=>alert("Open task"),children:[e.jsx(a.Leading,{children:e.jsx(n,{dashed:!0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"New task needing triage"}),e.jsxs(a.Meta,{children:[e.jsx(t,{variant:"empty",children:"No steps"}),e.jsx(t,{colorDot:"#f59e0b",children:"Inbox"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"Triage"}),e.jsx(p,{})]})]})},P={name:"Completed Task",render:()=>e.jsxs(a,{onClick:()=>alert("Open task"),children:[e.jsx(a.Leading,{children:e.jsx(n,{isComplete:!0})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{strikethrough:!0,children:"Setup project repository"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"4/4 steps"}),e.jsx(t,{children:"Completed 2 hours ago"})]})]}),e.jsx(a.Trailing,{children:e.jsx(p,{})})]})},B={name:"Layout Behavior",parameters:{layout:"fullscreen"},render:()=>e.jsxs("div",{className:"p-4",children:[e.jsx("p",{className:"text-sm text-fg-neutral-secondary mb-4",children:"Meta pills always stack below title. Leading/Trailing align with first row of title."}),e.jsxs(a,{onClick:()=>alert("Card clicked"),children:[e.jsx(a.Leading,{children:e.jsx(n,{})}),e.jsxs(a.Body,{children:[e.jsx(a.Title,{children:"A task with multiple metadata pills - meta always below title"}),e.jsxs(a.Meta,{children:[e.jsx(t,{children:"2/5 steps"}),e.jsx(t,{variant:"info",children:"Due Friday"}),e.jsx(t,{colorDot:"#7c3aed",children:"Work Project"}),e.jsx(t,{children:"High Energy"}),e.jsx(t,{children:"45m"})]})]}),e.jsxs(a.Trailing,{children:[e.jsx(o,{variant:"primary",children:"Focus"}),e.jsx(p,{})]})]})]})};var q,K,F;x.parameters={...x.parameters,docs:{...(q=x.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => <ActionableCard onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Review quarterly OKRs with team</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>2/5 steps</Pill>
          <Pill variant="info">Due Friday</Pill>
          <Pill colorDot="#7c3aed">Work</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Focus</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(F=(K=x.parameters)==null?void 0:K.docs)==null?void 0:F.source}}};var V,$,z;m.parameters={...m.parameters,docs:{...(V=m.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <ActionableCard appearance="highlighted" onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Morning standup meeting</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>1/3 steps</Pill>
          <Pill>9:00 AM</Pill>
          <Pill colorDot="#3b82f6">Daily</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Start</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(z=($=m.parameters)==null?void 0:$.docs)==null?void 0:z.source}}};var _,H,E;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  render: () => <ActionableCard appearance="muted" onClick={() => alert('Card clicked')}>
      <ActionableCard.Leading>
        <MockProgressRing isComplete />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title strikethrough>Completed task with all steps done</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>5/5 steps</Pill>
          <Pill>Completed 2h ago</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(E=(H=u.parameters)==null?void 0:H.docs)==null?void 0:E.source}}};var U,Y,Z;C.parameters={...C.parameters,docs:{...(U=C.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      <ActionableCard appearance="default">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Default appearance - Pool/Inbox tasks</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/5 steps</Pill>
            <Pill colorDot="#7c3aed">Work</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Focus</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Highlighted appearance - Today/Queue items</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>1/3 steps</Pill>
            <Pill variant="info">Due Today</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Start</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockProgressRing isComplete />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title strikethrough>Muted appearance - Completed tasks</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>5/5 steps</Pill>
            <Pill>Done</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockKebab />
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
}`,...(Z=(Y=C.parameters)==null?void 0:Y.docs)==null?void 0:Z.source}}};var G,J,X;A.parameters={...A.parameters,docs:{...(G=A.parameters)==null?void 0:G.docs,source:{originalSource:`{
  name: 'Progress States',
  render: () => <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-neutral-secondary mb-2">
        Progress ring shows partial completion with an arc indicator.
      </p>
      <ActionableCard>
        <ActionableCard.Leading>
          <MockProgressRing progress={0} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Not started - 0% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard>
        <ActionableCard.Leading>
          <MockProgressRing progress={0.25} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Quarter done - 25% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>1/4 steps</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing progress={0.5} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Halfway there - 50% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/4 steps</Pill>
            <Pill variant="info">In Progress</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing progress={0.75} />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Almost done - 75% progress</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>3/4 steps</Pill>
            <Pill variant="info">In Progress</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockProgressRing isComplete />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title strikethrough>Complete - checkmark indicator</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>4/4 steps</Pill>
            <Pill>Done</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
}`,...(X=(J=A.parameters)==null?void 0:J.docs)==null?void 0:X.source}}};var ee,ae,te;j.parameters={...j.parameters,docs:{...(ee=j.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  name: 'Queue State (via Colors)',
  render: () => <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-neutral-secondary mb-2">
        Queue/today state is indicated by appearance colors, not offset bars.
      </p>
      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Task in today queue (highlighted appearance)</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
            <Pill variant="info">Today</Pill>
            <Pill colorDot="#10b981">Personal</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Start</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>

      <ActionableCard appearance="default">
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Task not in queue (default appearance)</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>0/4 steps</Pill>
            <Pill colorDot="#10b981">Personal</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Add to Queue</MockButton>
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
}`,...(te=(ae=j.parameters)==null?void 0:ae.docs)==null?void 0:te.source}}};var re,ie,ne;y.parameters={...y.parameters,docs:{...(re=y.parameters)==null?void 0:re.docs,source:{originalSource:`{
  render: () => <div className="flex gap-3 overflow-x-auto pb-2">
      <ActionableCard variant="compact" appearance="highlighted" height={110} className="w-40 shrink-0" onClick={() => alert('Routine clicked')}>
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={5} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Morning workout routine</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-neutral-soft">Daily at 7 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard variant="compact" appearance="default" height={110} className="w-40 shrink-0" onClick={() => alert('Routine clicked')}>
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing alert />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={12} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Review and respond to emails</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-attention-primary">Overdue</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard variant="compact" appearance="default" height={110} className="w-40 shrink-0" onClick={() => alert('Routine clicked')}>
        <div className="flex items-start justify-between mb-2">
          <ActionableCard.Leading>
            <MockStatusRing />
          </ActionableCard.Leading>
          <ActionableCard.Trailing>
            <MockStreakBadge count={3} />
          </ActionableCard.Trailing>
        </div>
        <ActionableCard.Body>
          <ActionableCard.Title clamp={2}>Weekly planning</ActionableCard.Title>
          <ActionableCard.Meta position="bottom">
            <span className="text-xs text-fg-neutral-soft">Mon at 9 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
}`,...(ne=(ie=y.parameters)==null?void 0:ie.docs)==null?void 0:ne.source}}};var le,oe,se;f.parameters={...f.parameters,docs:{...(le=f.parameters)==null?void 0:le.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="poke" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Time for your daily standup!</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">2 minutes ago</span>
          </ActionableCard.Meta>
          <ActionableCard.InlineActions>
            <MockButton variant="primary">Start</MockButton>
            <MockButton>Snooze 5m</MockButton>
            <MockButton>Dismiss</MockButton>
          </ActionableCard.InlineActions>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="highlighted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="bell" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Missed: Weekly review</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">30 minutes ago</span>
          </ActionableCard.Meta>
          <ActionableCard.InlineActions>
            <MockButton variant="primary">Start Now</MockButton>
            <MockButton>Reschedule</MockButton>
          </ActionableCard.InlineActions>
        </ActionableCard.Body>
      </ActionableCard>

      <ActionableCard appearance="muted">
        <ActionableCard.Leading>
          <MockNotificationIcon type="bell" />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>Completed: Morning routine</ActionableCard.Title>
          <ActionableCard.Meta>
            <span className="text-xs text-fg-neutral-soft">Yesterday at 8:00 AM</span>
          </ActionableCard.Meta>
        </ActionableCard.Body>
      </ActionableCard>
    </div>
}`,...(se=(oe=f.parameters)==null?void 0:oe.docs)==null?void 0:se.source}}};var ce,de,pe;k.parameters={...k.parameters,docs:{...(ce=k.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  name: 'Pool Task Row',
  render: () => <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Review quarterly OKRs with team</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>2/5 steps</Pill>
          <Pill variant="info">Due Friday</Pill>
          <Pill colorDot="#7c3aed">Work</Pill>
          <Pill>30m</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">+ Focus</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(pe=(de=k.parameters)==null?void 0:de.docs)==null?void 0:pe.source}}};var he,be,ge;v.parameters={...v.parameters,docs:{...(he=v.parameters)==null?void 0:he.docs,source:{originalSource:`{
  name: 'Queue Item (Today)',
  render: () => <ActionableCard appearance="highlighted" onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Prepare presentation slides</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>1/3 steps</Pill>
          <Pill variant="info">Due 3 PM</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">▶</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(ge=(be=v.parameters)==null?void 0:be.docs)==null?void 0:ge.source}}};var xe,me,ue;M.parameters={...M.parameters,docs:{...(xe=M.parameters)==null?void 0:xe.docs,source:{originalSource:`{
  name: 'Queue Item (Upcoming)',
  render: () => <ActionableCard appearance="highlighted" onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>Research competitor products</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>0/4 steps</Pill>
          <Pill>Tomorrow</Pill>
          <Pill colorDot="#f59e0b">Strategy</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton>Move to Today</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(ue=(me=M.parameters)==null?void 0:me.docs)==null?void 0:ue.source}}};var Ce,Ae,je;T.parameters={...T.parameters,docs:{...(Ce=T.parameters)==null?void 0:Ce.docs,source:{originalSource:`{
  name: 'Triage Row (Inbox)',
  render: () => <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing dashed />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title>New task needing triage</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill variant="empty">No steps</Pill>
          <Pill colorDot="#f59e0b">Inbox</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockButton variant="primary">Triage</MockButton>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(je=(Ae=T.parameters)==null?void 0:Ae.docs)==null?void 0:je.source}}};var ye,fe,ke;P.parameters={...P.parameters,docs:{...(ye=P.parameters)==null?void 0:ye.docs,source:{originalSource:`{
  name: 'Completed Task',
  render: () => <ActionableCard onClick={() => alert('Open task')}>
      <ActionableCard.Leading>
        <MockProgressRing isComplete />
      </ActionableCard.Leading>
      <ActionableCard.Body>
        <ActionableCard.Title strikethrough>Setup project repository</ActionableCard.Title>
        <ActionableCard.Meta>
          <Pill>4/4 steps</Pill>
          <Pill>Completed 2 hours ago</Pill>
        </ActionableCard.Meta>
      </ActionableCard.Body>
      <ActionableCard.Trailing>
        <MockKebab />
      </ActionableCard.Trailing>
    </ActionableCard>
}`,...(ke=(fe=P.parameters)==null?void 0:fe.docs)==null?void 0:ke.source}}};var ve,Me,Te;B.parameters={...B.parameters,docs:{...(ve=B.parameters)==null?void 0:ve.docs,source:{originalSource:`{
  name: 'Layout Behavior',
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <div className="p-4">
      <p className="text-sm text-fg-neutral-secondary mb-4">
        Meta pills always stack below title. Leading/Trailing align with first row of title.
      </p>
      <ActionableCard onClick={() => alert('Card clicked')}>
        <ActionableCard.Leading>
          <MockProgressRing />
        </ActionableCard.Leading>
        <ActionableCard.Body>
          <ActionableCard.Title>A task with multiple metadata pills - meta always below title</ActionableCard.Title>
          <ActionableCard.Meta>
            <Pill>2/5 steps</Pill>
            <Pill variant="info">Due Friday</Pill>
            <Pill colorDot="#7c3aed">Work Project</Pill>
            <Pill>High Energy</Pill>
            <Pill>45m</Pill>
          </ActionableCard.Meta>
        </ActionableCard.Body>
        <ActionableCard.Trailing>
          <MockButton variant="primary">Focus</MockButton>
          <MockKebab />
        </ActionableCard.Trailing>
      </ActionableCard>
    </div>
}`,...(Te=(Me=B.parameters)==null?void 0:Me.docs)==null?void 0:Te.source}}};const Je=["Default","Highlighted","Muted","AllAppearances","ProgressStates","QueueStateViaColors","CompactVariant","WithInlineActions","PoolTaskRow","QueueItemToday","QueueItemUpcoming","TriageRow","CompletedTask","LayoutBehavior"];export{C as AllAppearances,y as CompactVariant,P as CompletedTask,x as Default,m as Highlighted,B as LayoutBehavior,u as Muted,k as PoolTaskRow,A as ProgressStates,v as QueueItemToday,M as QueueItemUpcoming,j as QueueStateViaColors,T as TriageRow,f as WithInlineActions,Je as __namedExportsOrder,Ge as default};
