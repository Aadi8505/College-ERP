"use strict";(self.webpackChunkcms_frontend=self.webpackChunkcms_frontend||[]).push([[595],{8595:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var r=a(2791),s=a(5218),o=a(5326),i=a(1827),n=a(184);const l={STUDENT:"Student",FACULTY:"Faculty",ADMIN:"Admin"},d=e=>{let{selected:t,onSelect:a}=e;return(0,n.jsx)("div",{className:"flex justify-center gap-4 mb-8",children:Object.values(l).map((e=>(0,n.jsx)("button",{onClick:()=>a(e),className:"px-5 py-2 text-sm font-medium rounded-full transition duration-200 "+(t===e?"bg-blue-600 text-white shadow":"bg-gray-100 text-gray-800 hover:bg-gray-200"),children:e},e)))})},c=()=>{const[e,t]=(0,r.useState)(l.STUDENT),[a,c]=(0,r.useState)("");return(0,n.jsxs)("div",{className:"min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-100 flex items-center justify-center px-4",children:[(0,n.jsxs)("div",{className:"w-full max-w-[40%] px-6 py-12",children:[(0,n.jsxs)("h1",{className:"text-4xl font-bold text-gray-800 text-center mb-6",children:[e," Forget Password"]}),(0,n.jsx)(d,{selected:e,onSelect:t}),(0,n.jsxs)("form",{className:"w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200",onSubmit:async e=>{if(e.preventDefault(),s.ZP.loading("Sending reset mail..."),""===a)return s.ZP.dismiss(),void s.ZP.error("Please enter your email");try{const e={"Content-Type":"application/json"},t=await o.Z.post("/auth/forget-password",{email:a},{headers:e});t.data.success?(s.ZP.dismiss(),s.ZP.success(t.data.message)):(s.ZP.dismiss(),s.ZP.error(t.data.message))}catch(i){var t,r;s.ZP.dismiss(),console.error(i),s.ZP.error((null===(t=i.response)||void 0===t||null===(r=t.data)||void 0===r?void 0:r.message)||"Error sending reset mail")}finally{c("")}},children:[(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsxs)("label",{className:"block text-gray-800 text-sm font-medium mb-2",htmlFor:"email",children:[e," Email"]}),(0,n.jsx)("input",{type:"email",id:"email",onChange:e=>c(e.target.value),value:a,required:!0,className:"w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"})]}),(0,n.jsx)(i.Z,{type:"submit",className:"w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200",children:"Send Reset Link"})]})]}),(0,n.jsx)(s.x7,{position:"bottom-center"})]})}},1827:(e,t,a)=>{a.d(t,{Z:()=>s});a(2791);var r=a(184);const s=e=>{let{children:t,onClick:a,type:s="button",disabled:o=!1,className:i="",variant:n="primary"}=e;return(0,r.jsx)("button",{type:s,onClick:a,disabled:o,className:`\n        px-4 py-2 rounded-md\n        font-medium text-sm\n        transition-all duration-300 ease-in-out\n        shadow-md hover:shadow-lg\n        transform hover:-translate-y-0.5\n        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center\n        ${(()=>{switch(n){case"primary":default:return"bg-blue-500 text-white hover:bg-blue-600";case"secondary":return"bg-gray-500 text-white hover:bg-gray-600";case"danger":return"bg-red-500 text-white hover:bg-red-600"}})()}\n        ${i}\n      `,children:t})}},5218:(e,t,a)=>{a.d(t,{x7:()=>ae,ZP:()=>re,Am:()=>Z});var r=a(2791);let s={data:""},o=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||s,i=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(e,t)=>{let a="",r="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?a=o+" "+i+";":r+="f"==o[1]?d(i,o):o+"{"+d(i,"k"==o[1]?"":t)+"}":"object"==typeof i?r+=d(i,t?t.replace(/([^,])+/g,(e=>o.replace(/(^:.*)|([^,])+/g,(t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)))):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=d.p?d.p(o,i):o+":"+i+";")}return a+(t&&s?t+"{"+s+"}":s)+r},c={},u=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+u(e[a]);return t}return e},p=(e,t,a,r,s)=>{let o=u(e),p=c[o]||(c[o]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(o));if(!c[p]){let t=o!==e?e:(e=>{let t,a,r=[{}];for(;t=i.exec(e.replace(n,""));)t[4]?r.shift():t[3]?(a=t[3].replace(l," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(l," ").trim();return r[0]})(e);c[p]=d(s?{["@keyframes "+p]:t}:t,a?"":"."+p)}let m=a&&c.g?c.g:null;return a&&(c.g=c[p]),((e,t,a,r)=>{r?t.data=t.data.replace(r,e):-1===t.data.indexOf(e)&&(t.data=a?e+t.data:t.data+e)})(c[p],t,r,m),p},m=(e,t,a)=>e.reduce(((e,r,s)=>{let o=t[s];if(o&&o.call){let e=o(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":d(e,""):!1===e?"":e}return e+r+(null==o?"":o)}),"");function f(e){let t=this||{},a=e.call?e(t.p):e;return p(a.unshift?a.raw?m(a,[].slice.call(arguments,1),t.p):a.reduce(((e,a)=>Object.assign(e,a&&a.call?a(t.p):a)),{}):a,o(t.target),t.g,t.o,t.k)}f.bind({g:1});let g,h,b,y=f.bind({k:1});function x(e,t){let a=this||{};return function(){let r=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;a.p=Object.assign({theme:h&&h()},n),a.o=/ *go\d+/.test(l),n.className=f.apply(a,r)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),b&&d[0]&&b(n),g(d,n)}return t?t(s):s}}var v=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,w=(()=>{let e=0;return()=>(++e).toString()})(),j=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),E=new Map,N=e=>{if(E.has(e))return;let t=setTimeout((()=>{E.delete(e),C({type:4,toastId:e})}),1e3);E.set(e,t)},k=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return t.toast.id&&(e=>{let t=E.get(e);t&&clearTimeout(t)})(t.toast.id),{...e,toasts:e.toasts.map((e=>e.id===t.toast.id?{...e,...t.toast}:e))};case 2:let{toast:a}=t;return e.toasts.find((e=>e.id===a.id))?k(e,{type:1,toast:a}):k(e,{type:0,toast:a});case 3:let{toastId:r}=t;return r?N(r):e.toasts.forEach((e=>{N(e.id)})),{...e,toasts:e.toasts.map((e=>e.id===r||void 0===r?{...e,visible:!1}:e))};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter((e=>e.id!==t.toastId))};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map((e=>({...e,pauseDuration:e.pauseDuration+s})))}}},$=[],P={toasts:[],pausedAt:void 0},C=e=>{P=k(P,e),$.forEach((e=>{e(P)}))},O={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},S=e=>(t,a)=>{let r=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"blank",a=arguments.length>2?arguments[2]:void 0;return{createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||w()}}(t,e,a);return C({type:2,toast:r}),r.id},Z=(e,t)=>S("blank")(e,t);Z.error=S("error"),Z.success=S("success"),Z.loading=S("loading"),Z.custom=S("custom"),Z.dismiss=e=>{C({type:3,toastId:e})},Z.remove=e=>C({type:4,toastId:e}),Z.promise=(e,t,a)=>{let r=Z.loading(t.loading,{...a,...null==a?void 0:a.loading});return e.then((e=>(Z.success(v(t.success,e),{id:r,...a,...null==a?void 0:a.success}),e))).catch((e=>{Z.error(v(t.error,e),{id:r,...a,...null==a?void 0:a.error})})),e};var A=(e,t)=>{C({type:1,toast:{id:e,height:t}})},D=()=>{C({type:5,time:Date.now()})},T=e=>{let{toasts:t,pausedAt:a}=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},[t,a]=(0,r.useState)(P);(0,r.useEffect)((()=>($.push(a),()=>{let e=$.indexOf(a);e>-1&&$.splice(e,1)})),[t]);let s=t.toasts.map((t=>{var a,r;return{...e,...e[t.type],...t,duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||O[t.type],style:{...e.style,...null==(r=e[t.type])?void 0:r.style,...t.style}}}));return{...t,toasts:s}}(e);(0,r.useEffect)((()=>{if(a)return;let e=Date.now(),r=t.map((t=>{if(t.duration===1/0)return;let a=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(!(a<0))return setTimeout((()=>Z.dismiss(t.id)),a);t.visible&&Z.dismiss(t.id)}));return()=>{r.forEach((e=>e&&clearTimeout(e)))}}),[t,a]);let s=(0,r.useCallback)((()=>{a&&C({type:6,time:Date.now()})}),[a]),o=(0,r.useCallback)(((e,a)=>{let{reverseOrder:r=!1,gutter:s=8,defaultPosition:o}=a||{},i=t.filter((t=>(t.position||o)===(e.position||o)&&t.height)),n=i.findIndex((t=>t.id===e.id)),l=i.filter(((e,t)=>t<n&&e.visible)).length;return i.filter((e=>e.visible)).slice(...r?[l+1]:[0,l]).reduce(((e,t)=>e+(t.height||0)+s),0)}),[t]);return{toasts:t,handlers:{updateHeight:A,startPause:D,endPause:s,calculateOffset:o}}},z=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,F=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,I=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,M=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${F} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,L=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,H=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${L} 1s linear infinite;
`,U=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,_=y`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,q=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${U} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${_} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,R=x("div")`
  position: absolute;
`,Y=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,B=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=x("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${B} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,J=e=>{let{toast:t}=e,{icon:a,type:s,iconTheme:o}=t;return void 0!==a?"string"==typeof a?r.createElement(G,null,a):a:"blank"===s?null:r.createElement(Y,null,r.createElement(H,{...o}),"loading"!==s&&r.createElement(R,null,"error"===s?r.createElement(M,{...o}):r.createElement(q,{...o})))},K=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,Q=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,V=x("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,W=x("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,X=r.memo((e=>{let{toast:t,position:a,style:s,children:o}=e,i=t.height?((e,t)=>{let a=e.includes("top")?1:-1,[r,s]=j()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[K(a),Q(a)];return{animation:t?`${y(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(t.position||a||"top-center",t.visible):{opacity:0},n=r.createElement(J,{toast:t}),l=r.createElement(W,{...t.ariaProps},v(t.message,t));return r.createElement(V,{className:t.className,style:{...i,...s,...t.style}},"function"==typeof o?o({icon:n,message:l}):r.createElement(r.Fragment,null,n,l))}));!function(e,t,a,r){d.p=t,g=e,h=a,b=r}(r.createElement);var ee=e=>{let{id:t,className:a,style:s,onHeightUpdate:o,children:i}=e,n=r.useCallback((e=>{if(e){let a=()=>{let a=e.getBoundingClientRect().height;o(t,a)};a(),new MutationObserver(a).observe(e,{subtree:!0,childList:!0,characterData:!0})}}),[t,o]);return r.createElement("div",{ref:n,className:a,style:s},i)},te=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ae=e=>{let{reverseOrder:t,position:a="top-center",toastOptions:s,gutter:o,children:i,containerStyle:n,containerClassName:l}=e,{toasts:d,handlers:c}=T(s);return r.createElement("div",{style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map((e=>{let s=e.position||a,n=((e,t)=>{let a=e.includes("top"),r=a?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:j()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...r,...s}})(s,c.calculateOffset(e,{reverseOrder:t,gutter:o,defaultPosition:a}));return r.createElement(ee,{id:e.id,key:e.id,onHeightUpdate:c.updateHeight,className:e.visible?te:"",style:n},"custom"===e.type?v(e.message,e):i?i(e):r.createElement(X,{toast:e,position:s}))})))},re=Z}}]);
//# sourceMappingURL=595.18ae8b76.chunk.js.map