"use strict";(self.webpackChunkcms_frontend=self.webpackChunkcms_frontend||[]).push([[174],{1174:(e,t,r)=>{r.r(t),r.d(t,{default:()=>d});var a=r(2791),s=r(7689),o=r(5218),i=r(5326),n=r(1827),l=r(184);const d=()=>{const e=(0,s.s0)(),{resetId:t,type:r}=(0,s.UO)(),[d,c]=(0,a.useState)(""),[u,p]=(0,a.useState)(""),[m,f]=(0,a.useState)(!1);(0,a.useEffect)((()=>{t||(o.ZP.error("Invalid or expired reset link."),e("/"))}),[t,e]);return(0,l.jsxs)("div",{className:"min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-100 flex items-center justify-center px-4",children:[(0,l.jsxs)("div",{className:"w-full max-w-2xl lg:w-1/2 px-6 py-12",children:[(0,l.jsx)("h1",{className:"text-4xl font-bold text-gray-800 text-center mb-6",children:"Update Password"}),(0,l.jsxs)("form",{className:"w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200",onSubmit:async a=>{if(a.preventDefault(),d===u)if(r){f(!0),o.ZP.loading("Resetting your password...");try{const r=await i.Z.post(`/auth/update-password/${t}`,{password:d,resetId:t});o.ZP.dismiss(),r.data.success?(o.ZP.success("Password reset successfully."),e("/")):o.ZP.error(r.data.message||"Error resetting password.")}catch(l){var s,n;o.ZP.dismiss(),o.ZP.error((null===(s=l.response)||void 0===s||null===(n=s.data)||void 0===n?void 0:n.message)||"Error resetting password.")}finally{f(!1)}}else o.ZP.error("Invalid Reset Password Link.");else o.ZP.error("Passwords do not match.")},children:[(0,l.jsxs)("div",{className:"mb-6",children:[(0,l.jsx)("label",{className:"block text-gray-800 text-sm font-medium mb-2",htmlFor:"newPassword",children:"New Password"}),(0,l.jsx)("input",{type:"password",id:"newPassword",onChange:e=>c(e.target.value),value:d,required:!0,className:"w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"})]}),(0,l.jsxs)("div",{className:"mb-6",children:[(0,l.jsx)("label",{className:"block text-gray-800 text-sm font-medium mb-2",htmlFor:"confirmPassword",children:"Confirm Password"}),(0,l.jsx)("input",{type:"password",id:"confirmPassword",onChange:e=>p(e.target.value),value:u,required:!0,className:"w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"})]}),(0,l.jsx)(n.Z,{type:"submit",disabled:m,className:"w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200",children:m?"Resetting...":"Reset Password"})]})]}),(0,l.jsx)(o.x7,{position:"bottom-center"})]})}},1827:(e,t,r)=>{r.d(t,{Z:()=>s});r(2791);var a=r(184);const s=e=>{let{children:t,onClick:r,type:s="button",disabled:o=!1,className:i="",variant:n="primary"}=e;return(0,a.jsx)("button",{type:s,onClick:r,disabled:o,className:`\n        px-4 py-2 rounded-md\n        font-medium text-sm\n        transition-all duration-300 ease-in-out\n        shadow-md hover:shadow-lg\n        transform hover:-translate-y-0.5\n        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center\n        ${(()=>{switch(n){case"primary":default:return"bg-blue-500 text-white hover:bg-blue-600";case"secondary":return"bg-gray-500 text-white hover:bg-gray-600";case"danger":return"bg-red-500 text-white hover:bg-red-600"}})()}\n        ${i}\n      `,children:t})}},5218:(e,t,r)=>{r.d(t,{x7:()=>re,ZP:()=>ae,Am:()=>I});var a=r(2791);let s={data:""},o=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||s,i=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(e,t)=>{let r="",a="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+i+";":a+="f"==o[1]?d(i,o):o+"{"+d(i,"k"==o[1]?"":t)+"}":"object"==typeof i?a+=d(i,t?t.replace(/([^,])+/g,(e=>o.replace(/(^:.*)|([^,])+/g,(t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)))):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=d.p?d.p(o,i):o+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+a},c={},u=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+u(e[r]);return t}return e},p=(e,t,r,a,s)=>{let o=u(e),p=c[o]||(c[o]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(o));if(!c[p]){let t=o!==e?e:(e=>{let t,r,a=[{}];for(;t=i.exec(e.replace(n,""));)t[4]?a.shift():t[3]?(r=t[3].replace(l," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(l," ").trim();return a[0]})(e);c[p]=d(s?{["@keyframes "+p]:t}:t,r?"":"."+p)}let m=r&&c.g?c.g:null;return r&&(c.g=c[p]),((e,t,r,a)=>{a?t.data=t.data.replace(a,e):-1===t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e)})(c[p],t,a,m),p},m=(e,t,r)=>e.reduce(((e,a,s)=>{let o=t[s];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":d(e,""):!1===e?"":e}return e+a+(null==o?"":o)}),"");function f(e){let t=this||{},r=e.call?e(t.p):e;return p(r.unshift?r.raw?m(r,[].slice.call(arguments,1),t.p):r.reduce(((e,r)=>Object.assign(e,r&&r.call?r(t.p):r)),{}):r,o(t.target),t.g,t.o,t.k)}f.bind({g:1});let g,h,b,y=f.bind({k:1});function x(e,t){let r=this||{};return function(){let a=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;r.p=Object.assign({theme:h&&h()},n),r.o=/ *go\d+/.test(l),n.className=f.apply(r,a)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),b&&d[0]&&b(n),g(d,n)}return t?t(s):s}}var v=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,w=(()=>{let e=0;return()=>(++e).toString()})(),P=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),j=new Map,k=e=>{if(j.has(e))return;let t=setTimeout((()=>{j.delete(e),C({type:4,toastId:e})}),1e3);j.set(e,t)},E=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return t.toast.id&&(e=>{let t=j.get(e);t&&clearTimeout(t)})(t.toast.id),{...e,toasts:e.toasts.map((e=>e.id===t.toast.id?{...e,...t.toast}:e))};case 2:let{toast:r}=t;return e.toasts.find((e=>e.id===r.id))?E(e,{type:1,toast:r}):E(e,{type:0,toast:r});case 3:let{toastId:a}=t;return a?k(a):e.toasts.forEach((e=>{k(e.id)})),{...e,toasts:e.toasts.map((e=>e.id===a||void 0===a?{...e,visible:!1}:e))};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter((e=>e.id!==t.toastId))};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map((e=>({...e,pauseDuration:e.pauseDuration+s})))}}},N=[],$={toasts:[],pausedAt:void 0},C=e=>{$=E($,e),N.forEach((e=>{e($)}))},O={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Z=e=>(t,r)=>{let a=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"blank",r=arguments.length>2?arguments[2]:void 0;return{createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||w()}}(t,e,r);return C({type:2,toast:a}),a.id},I=(e,t)=>Z("blank")(e,t);I.error=Z("error"),I.success=Z("success"),I.loading=Z("loading"),I.custom=Z("custom"),I.dismiss=e=>{C({type:3,toastId:e})},I.remove=e=>C({type:4,toastId:e}),I.promise=(e,t,r)=>{let a=I.loading(t.loading,{...r,...null==r?void 0:r.loading});return e.then((e=>(I.success(v(t.success,e),{id:a,...r,...null==r?void 0:r.success}),e))).catch((e=>{I.error(v(t.error,e),{id:a,...r,...null==r?void 0:r.error})})),e};var z=(e,t)=>{C({type:1,toast:{id:e,height:t}})},A=()=>{C({type:5,time:Date.now()})},D=e=>{let{toasts:t,pausedAt:r}=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},[t,r]=(0,a.useState)($);(0,a.useEffect)((()=>(N.push(r),()=>{let e=N.indexOf(r);e>-1&&N.splice(e,1)})),[t]);let s=t.toasts.map((t=>{var r,a;return{...e,...e[t.type],...t,duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||O[t.type],style:{...e.style,...null==(a=e[t.type])?void 0:a.style,...t.style}}}));return{...t,toasts:s}}(e);(0,a.useEffect)((()=>{if(r)return;let e=Date.now(),a=t.map((t=>{if(t.duration===1/0)return;let r=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(!(r<0))return setTimeout((()=>I.dismiss(t.id)),r);t.visible&&I.dismiss(t.id)}));return()=>{a.forEach((e=>e&&clearTimeout(e)))}}),[t,r]);let s=(0,a.useCallback)((()=>{r&&C({type:6,time:Date.now()})}),[r]),o=(0,a.useCallback)(((e,r)=>{let{reverseOrder:a=!1,gutter:s=8,defaultPosition:o}=r||{},i=t.filter((t=>(t.position||o)===(e.position||o)&&t.height)),n=i.findIndex((t=>t.id===e.id)),l=i.filter(((e,t)=>t<n&&e.visible)).length;return i.filter((e=>e.visible)).slice(...a?[l+1]:[0,l]).reduce(((e,t)=>e+(t.height||0)+s),0)}),[t]);return{toasts:t,handlers:{updateHeight:z,startPause:A,endPause:s,calculateOffset:o}}},S=y`
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
}`,M=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,T=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${S} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
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
    animation: ${M} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,H=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,L=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${H} 1s linear infinite;
`,R=y`
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
}`,U=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${R} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
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
`,q=x("div")`
  position: absolute;
`,B=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Y=y`
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
  animation: ${Y} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,J=e=>{let{toast:t}=e,{icon:r,type:s,iconTheme:o}=t;return void 0!==r?"string"==typeof r?a.createElement(G,null,r):r:"blank"===s?null:a.createElement(B,null,a.createElement(L,{...o}),"loading"!==s&&a.createElement(q,null,"error"===s?a.createElement(T,{...o}):a.createElement(U,{...o})))},K=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,Q=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,V=x("div")`
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
`,X=a.memo((e=>{let{toast:t,position:r,style:s,children:o}=e,i=t.height?((e,t)=>{let r=e.includes("top")?1:-1,[a,s]=P()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[K(r),Q(r)];return{animation:t?`${y(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(t.position||r||"top-center",t.visible):{opacity:0},n=a.createElement(J,{toast:t}),l=a.createElement(W,{...t.ariaProps},v(t.message,t));return a.createElement(V,{className:t.className,style:{...i,...s,...t.style}},"function"==typeof o?o({icon:n,message:l}):a.createElement(a.Fragment,null,n,l))}));!function(e,t,r,a){d.p=t,g=e,h=r,b=a}(a.createElement);var ee=e=>{let{id:t,className:r,style:s,onHeightUpdate:o,children:i}=e,n=a.useCallback((e=>{if(e){let r=()=>{let r=e.getBoundingClientRect().height;o(t,r)};r(),new MutationObserver(r).observe(e,{subtree:!0,childList:!0,characterData:!0})}}),[t,o]);return a.createElement("div",{ref:n,className:r,style:s},i)},te=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,re=e=>{let{reverseOrder:t,position:r="top-center",toastOptions:s,gutter:o,children:i,containerStyle:n,containerClassName:l}=e,{toasts:d,handlers:c}=D(s);return a.createElement("div",{style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:l,onMouseEnter:c.startPause,onMouseLeave:c.endPause},d.map((e=>{let s=e.position||r,n=((e,t)=>{let r=e.includes("top"),a=r?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:P()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...a,...s}})(s,c.calculateOffset(e,{reverseOrder:t,gutter:o,defaultPosition:r}));return a.createElement(ee,{id:e.id,key:e.id,onHeightUpdate:c.updateHeight,className:e.visible?te:"",style:n},"custom"===e.type?v(e.message,e):i?i(e):a.createElement(X,{toast:e,position:s}))})))},ae=I}}]);
//# sourceMappingURL=174.80ebc148.chunk.js.map