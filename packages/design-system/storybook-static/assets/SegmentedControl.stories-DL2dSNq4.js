import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as R}from"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";const J={sm:"px-2 py-1 text-xs",md:"px-3 py-1.5 text-sm",lg:"px-4 py-2 text-base"},K={sm:"p-0.5 gap-0",md:"p-0.5 gap-0",lg:"p-0.5 gap-0"};function f({options:t,value:s,onChange:o,allowDeselect:x=!0,size:r="md",fullWidth:h=!1,className:P=""}){const H=(l,b)=>{b||o(x&&s===l?void 0:l)};return e.jsx("div",{className:`flex overflow-x-auto no-scrollbar ${P}`,children:e.jsx("div",{className:`inline-flex bg-black/[0.06] dark:bg-white/[0.08] rounded-lg ${K[r]} ${h?"w-full":""}`,children:t.map(l=>{const b=s===l.value,g=l.disabled;return e.jsxs("button",{type:"button",onClick:()=>H(l.value,g),disabled:g,className:`
                ${J[r]}
                font-medium rounded-md whitespace-nowrap transition-all
                flex items-center justify-center gap-1.5
                ${h?"flex-1":""}
                ${b?"bg-white dark:bg-[#141417] text-fg-neutral-primary shadow-sm":"text-fg-neutral-spot-readable hover:text-fg-neutral-primary"}
                ${g?"opacity-50 cursor-not-allowed":""}
              `,children:[l.icon&&e.jsx("span",{className:"flex-shrink-0",children:l.icon}),l.label]},l.value)})})})}try{f.displayName="SegmentedControl",f.__docgenInfo={description:`SegmentedControl - iOS-style segmented control for single-select options.

Horizontally scrollable on overflow. Supports optional deselection.`,displayName:"SegmentedControl",props:{options:{defaultValue:null,description:"Available options",name:"options",required:!0,type:{name:"SegmentedControlOption<T>[]"}},value:{defaultValue:null,description:"Currently selected value",name:"value",required:!0,type:{name:"string | undefined"}},onChange:{defaultValue:null,description:"Change handler",name:"onChange",required:!0,type:{name:"(value: T | undefined) => void"}},allowDeselect:{defaultValue:{value:"true"},description:"Allow deselecting by tapping the selected option again",name:"allowDeselect",required:!1,type:{name:"boolean"}},size:{defaultValue:{value:"md"},description:"Size variant",name:"size",required:!1,type:{name:"enum",value:[{value:'"sm"'},{value:'"md"'},{value:'"lg"'}]}},fullWidth:{defaultValue:{value:"false"},description:"Full width mode",name:"fullWidth",required:!1,type:{name:"boolean"}},className:{defaultValue:{value:""},description:"Additional className",name:"className",required:!1,type:{name:"string"}}}}}catch{}const Y={title:"Components/SegmentedControl",component:f,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{size:{control:"select",options:["sm","md","lg"]}}};function a({options:t,defaultValue:s,...o}){const[x,r]=R.useState(s);return e.jsx(f,{options:t,value:x,onChange:r,...o})}const n={render:()=>e.jsx(a,{options:[{value:"all",label:"All"},{value:"active",label:"Active"},{value:"completed",label:"Completed"}],defaultValue:"all"})},d={render:()=>e.jsx(a,{options:[{value:"list",label:"List"},{value:"grid",label:"Grid"}],defaultValue:"list"})},u={render:()=>e.jsx(a,{options:[{value:"day",label:"Day"},{value:"week",label:"Week"},{value:"month",label:"Month"}]})},i={render:()=>e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"Small"}),e.jsx(a,{options:[{value:"a",label:"Option A"},{value:"b",label:"Option B"}],defaultValue:"a",size:"sm"})]}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"Medium (default)"}),e.jsx(a,{options:[{value:"a",label:"Option A"},{value:"b",label:"Option B"}],defaultValue:"a",size:"md"})]}),e.jsxs("div",{className:"flex flex-col gap-1",children:[e.jsx("span",{className:"text-xs text-fg-neutral-secondary",children:"Large"}),e.jsx(a,{options:[{value:"a",label:"Option A"},{value:"b",label:"Option B"}],defaultValue:"a",size:"lg"})]})]})},c={render:()=>e.jsx("div",{className:"w-80",children:e.jsx(a,{options:[{value:"today",label:"Today"},{value:"week",label:"This Week"},{value:"all",label:"All"}],defaultValue:"today",fullWidth:!0})})},m={render:()=>e.jsx(a,{options:[{value:"on",label:"On"},{value:"off",label:"Off"}],defaultValue:"on",allowDeselect:!1})},p={render:()=>e.jsx("div",{className:"w-64 overflow-hidden",children:e.jsx(a,{options:[{value:"mon",label:"Mon"},{value:"tue",label:"Tue"},{value:"wed",label:"Wed"},{value:"thu",label:"Thu"},{value:"fri",label:"Fri"},{value:"sat",label:"Sat"},{value:"sun",label:"Sun"}],defaultValue:"mon"})})},v={render:()=>e.jsxs("div",{className:"flex flex-col gap-4 w-80",children:[e.jsx(a,{options:[{value:"inbox",label:"Inbox (7)"},{value:"pool",label:"Pool (23)"}],defaultValue:"inbox",fullWidth:!0}),e.jsx("div",{className:"text-sm text-fg-neutral-secondary text-center",children:"Filter content appears here..."})]})};var y,S,N;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <SegmentedControlDemo options={[{
    value: 'all',
    label: 'All'
  }, {
    value: 'active',
    label: 'Active'
  }, {
    value: 'completed',
    label: 'Completed'
  }]} defaultValue="all" />
}`,...(N=(S=n.parameters)==null?void 0:S.docs)==null?void 0:N.source}}};var w,j,C;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <SegmentedControlDemo options={[{
    value: 'list',
    label: 'List'
  }, {
    value: 'grid',
    label: 'Grid'
  }]} defaultValue="list" />
}`,...(C=(j=d.parameters)==null?void 0:j.docs)==null?void 0:C.source}}};var V,D,O;u.parameters={...u.parameters,docs:{...(V=u.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <SegmentedControlDemo options={[{
    value: 'day',
    label: 'Day'
  }, {
    value: 'week',
    label: 'Week'
  }, {
    value: 'month',
    label: 'Month'
  }]} />
}`,...(O=(D=u.parameters)==null?void 0:D.docs)==null?void 0:O.source}}};var A,T,k;i.parameters={...i.parameters,docs:{...(A=i.parameters)==null?void 0:A.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Small</span>
        <SegmentedControlDemo options={[{
        value: 'a',
        label: 'Option A'
      }, {
        value: 'b',
        label: 'Option B'
      }]} defaultValue="a" size="sm" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Medium (default)</span>
        <SegmentedControlDemo options={[{
        value: 'a',
        label: 'Option A'
      }, {
        value: 'b',
        label: 'Option B'
      }]} defaultValue="a" size="md" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-fg-neutral-secondary">Large</span>
        <SegmentedControlDemo options={[{
        value: 'a',
        label: 'Option A'
      }, {
        value: 'b',
        label: 'Option B'
      }]} defaultValue="a" size="lg" />
      </div>
    </div>
}`,...(k=(T=i.parameters)==null?void 0:T.docs)==null?void 0:k.source}}};var z,W,_;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div className="w-80">
      <SegmentedControlDemo options={[{
      value: 'today',
      label: 'Today'
    }, {
      value: 'week',
      label: 'This Week'
    }, {
      value: 'all',
      label: 'All'
    }]} defaultValue="today" fullWidth />
    </div>
}`,...(_=(W=c.parameters)==null?void 0:W.docs)==null?void 0:_.source}}};var F,M,q;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  render: () => <SegmentedControlDemo options={[{
    value: 'on',
    label: 'On'
  }, {
    value: 'off',
    label: 'Off'
  }]} defaultValue="on" allowDeselect={false} />
}`,...(q=(M=m.parameters)==null?void 0:M.docs)==null?void 0:q.source}}};var $,B,L;p.parameters={...p.parameters,docs:{...($=p.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div className="w-64 overflow-hidden">
      <SegmentedControlDemo options={[{
      value: 'mon',
      label: 'Mon'
    }, {
      value: 'tue',
      label: 'Tue'
    }, {
      value: 'wed',
      label: 'Wed'
    }, {
      value: 'thu',
      label: 'Thu'
    }, {
      value: 'fri',
      label: 'Fri'
    }, {
      value: 'sat',
      label: 'Sat'
    }, {
      value: 'sun',
      label: 'Sun'
    }]} defaultValue="mon" />
    </div>
}`,...(L=(B=p.parameters)==null?void 0:B.docs)==null?void 0:L.source}}};var E,I,G;v.parameters={...v.parameters,docs:{...(E=v.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 w-80">
      <SegmentedControlDemo options={[{
      value: 'inbox',
      label: 'Inbox (7)'
    }, {
      value: 'pool',
      label: 'Pool (23)'
    }]} defaultValue="inbox" fullWidth />
      <div className="text-sm text-fg-neutral-secondary text-center">
        Filter content appears here...
      </div>
    </div>
}`,...(G=(I=v.parameters)==null?void 0:I.docs)==null?void 0:G.source}}};const Z=["Default","TwoOptions","NoDefault","Sizes","FullWidth","NoDeselect","ManyOptions","FilterTabs"];export{n as Default,v as FilterTabs,c as FullWidth,p as ManyOptions,u as NoDefault,m as NoDeselect,i as Sizes,d as TwoOptions,Z as __namedExportsOrder,Y as default};
