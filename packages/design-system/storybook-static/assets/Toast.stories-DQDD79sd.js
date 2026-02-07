import{j as e}from"./jsx-runtime-DF2Pcvd1.js";import{r as v}from"./index-B2-qRKKC.js";import"./_commonjsHelpers-Cpj98o6Y.js";function n({toast:s,onDismiss:t}){v.useEffect(()=>{const r=s.duration??5e3,y=setTimeout(()=>{t(s.id)},r);return()=>clearTimeout(y)},[s.id,s.duration,t]);const o={info:"bg-bg-neutral-inverse text-fg-neutral-inverse-primary",success:"bg-bg-positive-high text-white",warning:"bg-bg-attention-high text-white",error:"bg-bg-alert-high text-white"}[s.type];return e.jsxs("div",{className:`${o} rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md animate-slide-up`,role:"alert",children:[s.type==="success"&&e.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 13l4 4L19 7"})}),s.type==="error"&&e.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})}),s.type==="warning"&&e.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})}),s.type==="info"&&e.jsx("svg",{className:"w-5 h-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),e.jsx("span",{className:"flex-1 text-sm font-medium",children:s.message}),s.action&&e.jsx("button",{onClick:()=>{s.action.onClick(),t(s.id)},className:"px-2.5 py-1 text-sm font-medium opacity-90 hover:opacity-100 bg-white/20 hover:bg-white/30 rounded transition-colors",children:s.action.label}),e.jsx("button",{onClick:()=>t(s.id),className:"p-1 opacity-70 hover:opacity-100 rounded transition-colors","aria-label":"Dismiss",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]})}function f({toasts:s,onDismiss:t,className:o=""}){return s.length===0?null:e.jsx("div",{className:`flex flex-col gap-2 px-4 ${o}`,children:s.map(r=>e.jsx(n,{toast:r,onDismiss:t},r.id))})}try{n.displayName="ToastItem",n.__docgenInfo={description:"Individual toast notification item.",displayName:"ToastItem",props:{toast:{defaultValue:null,description:"",name:"toast",required:!0,type:{name:"ToastData"}},onDismiss:{defaultValue:null,description:"",name:"onDismiss",required:!0,type:{name:"(id: string) => void"}}}}}catch{}try{f.displayName="ToastContainer",f.__docgenInfo={description:"Container for displaying multiple toast notifications.",displayName:"ToastContainer",props:{toasts:{defaultValue:null,description:"",name:"toasts",required:!0,type:{name:"ToastData[]"}},onDismiss:{defaultValue:null,description:"",name:"onDismiss",required:!0,type:{name:"(id: string) => void"}},className:{defaultValue:{value:""},description:"",name:"className",required:!1,type:{name:"string"}}}}}catch{}const J={title:"Components/Toast",component:n,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{toast:{control:"object"}}},l={args:{toast:{id:"1",message:"Your changes have been saved.",type:"info"},onDismiss:()=>{}}},d={args:{toast:{id:"2",message:"Task completed successfully!",type:"success"},onDismiss:()=>{}}},m={args:{toast:{id:"3",message:"You have unsaved changes.",type:"warning"},onDismiss:()=>{}}},u={args:{toast:{id:"4",message:"Failed to save. Please try again.",type:"error"},onDismiss:()=>{}}},p={args:{toast:{id:"5",message:"Task moved to archive.",type:"info",action:{label:"Undo",onClick:()=>console.log("Undo clicked")}},onDismiss:()=>{}}},g={render:()=>e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx(n,{toast:{id:"1",message:"Information message",type:"info"},onDismiss:()=>{}}),e.jsx(n,{toast:{id:"2",message:"Success! Your task is complete.",type:"success"},onDismiss:()=>{}}),e.jsx(n,{toast:{id:"3",message:"Warning: This action cannot be undone.",type:"warning"},onDismiss:()=>{}}),e.jsx(n,{toast:{id:"4",message:"Error: Something went wrong.",type:"error"},onDismiss:()=>{}})]})},x={render:()=>{const s=[{id:"1",message:"First notification",type:"info"},{id:"2",message:"Task completed!",type:"success"},{id:"3",message:"Warning message",type:"warning"}];return e.jsx(f,{toasts:s,onDismiss:t=>console.log("Dismiss:",t)})}},h={render:function(){const[t,o]=v.useState([]),[r,y]=v.useState(0),i=c=>{const b={info:"This is an info message.",success:"Action completed successfully!",warning:"Please review your changes.",error:"An error occurred."};o(a=>[...a,{id:String(r),message:b[c],type:c}]),y(a=>a+1)},O=c=>{o(b=>b.filter(a=>a.id!==c))};return e.jsxs("div",{className:"flex flex-col gap-6 items-center",children:[e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>i("info"),className:"px-3 py-1.5 text-sm rounded bg-bg-neutral-subtle hover:bg-bg-neutral-low",children:"Info"}),e.jsx("button",{onClick:()=>i("success"),className:"px-3 py-1.5 text-sm rounded bg-bg-positive-subtle text-fg-positive-primary hover:bg-bg-positive-low",children:"Success"}),e.jsx("button",{onClick:()=>i("warning"),className:"px-3 py-1.5 text-sm rounded bg-bg-attention-subtle text-fg-attention-primary hover:bg-bg-attention-low",children:"Warning"}),e.jsx("button",{onClick:()=>i("error"),className:"px-3 py-1.5 text-sm rounded bg-bg-alert-subtle text-fg-alert-primary hover:bg-bg-alert-low",children:"Error"})]}),e.jsx(f,{toasts:t,onDismiss:O})]})}};var k,w,T;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    toast: {
      id: '1',
      message: 'Your changes have been saved.',
      type: 'info'
    },
    onDismiss: () => {}
  }
}`,...(T=(w=l.parameters)==null?void 0:w.docs)==null?void 0:T.source}}};var j,D,C;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    toast: {
      id: '2',
      message: 'Task completed successfully!',
      type: 'success'
    },
    onDismiss: () => {}
  }
}`,...(C=(D=d.parameters)==null?void 0:D.docs)==null?void 0:C.source}}};var N,S,I;m.parameters={...m.parameters,docs:{...(N=m.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    toast: {
      id: '3',
      message: 'You have unsaved changes.',
      type: 'warning'
    },
    onDismiss: () => {}
  }
}`,...(I=(S=m.parameters)==null?void 0:S.docs)==null?void 0:I.source}}};var _,L,W;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    toast: {
      id: '4',
      message: 'Failed to save. Please try again.',
      type: 'error'
    },
    onDismiss: () => {}
  }
}`,...(W=(L=u.parameters)==null?void 0:L.docs)==null?void 0:W.source}}};var E,A,M;p.parameters={...p.parameters,docs:{...(E=p.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    toast: {
      id: '5',
      message: 'Task moved to archive.',
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo clicked')
      }
    },
    onDismiss: () => {}
  }
}`,...(M=(A=p.parameters)==null?void 0:A.docs)==null?void 0:M.source}}};var V,Y,q;g.parameters={...g.parameters,docs:{...(V=g.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      <ToastItem toast={{
      id: '1',
      message: 'Information message',
      type: 'info'
    }} onDismiss={() => {}} />
      <ToastItem toast={{
      id: '2',
      message: 'Success! Your task is complete.',
      type: 'success'
    }} onDismiss={() => {}} />
      <ToastItem toast={{
      id: '3',
      message: 'Warning: This action cannot be undone.',
      type: 'warning'
    }} onDismiss={() => {}} />
      <ToastItem toast={{
      id: '4',
      message: 'Error: Something went wrong.',
      type: 'error'
    }} onDismiss={() => {}} />
    </div>
}`,...(q=(Y=g.parameters)==null?void 0:Y.docs)==null?void 0:q.source}}};var B,F,P;x.parameters={...x.parameters,docs:{...(B=x.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => {
    const toasts: ToastData[] = [{
      id: '1',
      message: 'First notification',
      type: 'info'
    }, {
      id: '2',
      message: 'Task completed!',
      type: 'success'
    }, {
      id: '3',
      message: 'Warning message',
      type: 'warning'
    }];
    return <ToastContainer toasts={toasts} onDismiss={id => console.log('Dismiss:', id)} />;
  }
}`,...(P=(F=x.parameters)==null?void 0:F.docs)==null?void 0:P.source}}};var U,z,$;h.parameters={...h.parameters,docs:{...(U=h.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: function InteractiveDemo() {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [counter, setCounter] = useState(0);
    const addToast = (type: ToastData['type']) => {
      const messages = {
        info: 'This is an info message.',
        success: 'Action completed successfully!',
        warning: 'Please review your changes.',
        error: 'An error occurred.'
      };
      setToasts(prev => [...prev, {
        id: String(counter),
        message: messages[type],
        type
      }]);
      setCounter(c => c + 1);
    };
    const dismissToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };
    return <div className="flex flex-col gap-6 items-center">
        <div className="flex gap-2">
          <button onClick={() => addToast('info')} className="px-3 py-1.5 text-sm rounded bg-bg-neutral-subtle hover:bg-bg-neutral-low">
            Info
          </button>
          <button onClick={() => addToast('success')} className="px-3 py-1.5 text-sm rounded bg-bg-positive-subtle text-fg-positive-primary hover:bg-bg-positive-low">
            Success
          </button>
          <button onClick={() => addToast('warning')} className="px-3 py-1.5 text-sm rounded bg-bg-attention-subtle text-fg-attention-primary hover:bg-bg-attention-low">
            Warning
          </button>
          <button onClick={() => addToast('error')} className="px-3 py-1.5 text-sm rounded bg-bg-alert-subtle text-fg-alert-primary hover:bg-bg-alert-low">
            Error
          </button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>;
  }
}`,...($=(z=h.parameters)==null?void 0:z.docs)==null?void 0:$.source}}};const K=["Info","Success","Warning","Error","WithAction","AllVariants","Container","Interactive"];export{g as AllVariants,x as Container,u as Error,l as Info,h as Interactive,d as Success,m as Warning,p as WithAction,K as __namedExportsOrder,J as default};
