"use strict";
(()=>{
function model(a){
 if(!Array.isArray(a)||a.length>16||a.some(x=>!Number.isInteger(x)||Math.abs(x)>999))throw Error("Use up to 16 integers between −999 and 999.");
 const n=a.length,d=Array(n).fill(1),p=Array(n).fill(-1),events=[{i:-1,j:-1,d:Array(n).fill(null),p:[...p],message:"No elements processed."}];let best=-1;
 for(let i=0;i<n;i++){const snapshot=()=>d.map((v,j)=>j<=i?v:null);events.push({i,j:-1,d:snapshot(),p:[...p],message:"Initialize dp["+i+"] = 1: the element alone."});for(let j=0;j<i;j++){const legal=a[j]<a[i],improve=legal&&d[j]+1>d[i];if(improve){d[i]=d[j]+1;p[i]=j}events.push({i,j,d:snapshot(),p:[...p],message:legal?"Extend length "+d[j]+" + 1; "+(improve?"improve to "+d[i]:"keep "+d[i]):a[j]+" is not strictly smaller than "+a[i]+". Reject."})}if(best<0||d[i]>d[best])best=i}
 const chosen=[];for(let i=best;i>=0;i=p[i])chosen.unshift(i);
 const tails=[],ends=[],parent=Array(n).fill(-1),fast=[{i:-1,tails:[],ends:[],message:"Empty tails: no subsequences yet."}];
 for(let i=0;i<n;i++){let l=0,r=tails.length;while(l<r){const mid=(l+r)>>1;fast.push({i,l,r,mid,tails:[...tails],ends:[...ends],message:"Compare tails["+mid+"] = "+tails[mid]+" with "+a[i]+". "+(tails[mid]<a[i]?"Move left bound right.":"Move right bound left.")});if(tails[mid]<a[i])l=mid+1;else r=mid}
 const extend=l===tails.length;parent[i]=l>0?ends[l-1]:-1;tails[l]=a[i];ends[l]=i;fast.push({i,pos:l,tails:[...tails],ends:[...ends],message:(extend?"Append: length grows.":"Replace: smaller or equal tail improves future options.")+" Position "+l+"."})}
 const fastChosen=[];for(let i=ends.at(-1)??-1;i>=0;i=parent[i])fastChosen.unshift(i);
 return {d,p,best,length:best<0?0:d[best],chosen,events,tails,fast,fastChosen,parent};
}
function parse(raw){const q=raw.trim()?raw.trim().split(/\s*,\s*/):[];if(q.some(x=>! /^-?\d{1,3}$/.test(x)))throw Error("Use comma-separated integers between −999 and 999.");const a=q.map(Number);model(a);return a}
globalThis.PDP24={model,parse};if(typeof document==="undefined")return;
const el=(tag,cls,t)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(t!=null)x.textContent=t;return x},controllers=[];
for(const root of document.querySelectorAll("[data-lis24]")){
 const kind=root.dataset.lis24,inp=root.querySelector("[data-input]"),apply=root.querySelector("[data-apply]"),error=root.querySelector("[data-error]"),grid=root.querySelector("[data-grid]"),note=root.querySelector("[data-note]"),live=root.querySelector("[data-vars]"),result=root.querySelector("[data-result]");let a=parse(inp.value),m=model(a);
 const seq=()=>kind==="dp"?m.events:kind==="fast"?m.fast:[null,...m.chosen.slice().reverse()];
 function draw(rows,active=[],deps=[]){const t=el("table","k21-matrix"),h=el("thead"),r=el("tr");r.append(el("th","","Index"));for(let j=0;j<Math.max(1,...rows.map(x=>x[1].length));j++)r.append(el("th","",j));h.append(r);t.append(h);const b=el("tbody");rows.forEach(([label,v],i)=>{const tr=el("tr");tr.append(el("th","",label));v.forEach((x,j)=>tr.append(el("td",active.includes(j)?"k21-current":deps.includes(j)?"k21-dep":"",x===null?"—":x)));b.append(tr)});t.append(b);grid.replaceChildren(t)}
 function finish(indices){return "LIS length = "+m.length+" · one witness: ["+indices.map(i=>a[i]).join(", ")+"] · indices ["+indices.join(", ")+"]"}
 function render(k){const e=seq()[k];let line=0;result.textContent="";
 if(kind==="dp"){draw([["a",a],["dp",e.d],["parent",e.p.map((v,i)=>e.d[i]===null?"—":v)]],e.i<0?[]:[e.i],e.j<0?[]:[e.j]);note.textContent=e.message;live.textContent="i = "+e.i+" · j = "+e.j;line=e.i<0?0:e.j<0?1:2;if(k===seq().length-1)result.textContent=finish(m.chosen)}
 else if(kind==="fast"){draw([["tails",e.tails],["tail index",e.ends]],e.pos!=null?[e.pos]:[],e.mid!=null?[e.mid]:[]);note.textContent=e.message;live.textContent=e.i<0?"No processed values.":"Index "+e.i+" · x="+a[e.i]+(e.mid!=null?" · search ["+e.l+", "+e.r+") · mid="+e.mid:" · length="+e.tails.length);line=e.i<0?0:e.mid!=null?1:2;if(k===seq().length-1)result.textContent=finish(m.fastChosen)}
 else{const visited=m.chosen.slice().reverse().slice(0,k);draw([["a",a],["dp",m.d],["parent",m.p]],e===null?[]:[e],visited);note.textContent=e===null?(m.length?"Start at an index with maximum dp.":"Empty input: no parents."):"Visit index "+e+" ("+a[e]+"); parent = "+m.p[e]+". Follow the parent, then reverse.";live.textContent="Reverse order: "+visited.map(i=>a[i]).join(" → ");line=e===null?0:1;if(k===seq().length-1)result.textContent=finish(m.chosen)}
 root.querySelectorAll("[data-line]").forEach(x=>x.classList.toggle("current",Number(x.dataset.line)===line))
 }
 const ctrl=window.lessonStepper(root,{length:()=>seq().length,render,delay:600});controllers.push(ctrl);
 function validate(){try{const next=parse(inp.value);error.textContent="";inp.setAttribute("aria-invalid","false");apply.disabled=false;return next}catch(e){error.textContent=e.message+" Last applied instance remains visible.";inp.setAttribute("aria-invalid","true");apply.disabled=true;return null}}
 inp.addEventListener("input",validate);inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply.click()}});apply.onclick=()=>{const v=validate();if(v){a=v;m=model(a);ctrl.reset()}};root.querySelector("[data-end]").onclick=()=>ctrl.end();
}
for(const root of document.querySelectorAll("[data-lis-practice]")){const a=[4,2,3,1,5,3,6],m=model(a),inputs=[...root.querySelectorAll("input[data-i]")],out=root.querySelector("[data-feedback]");const ok=x=>x.value.trim()!==""&&Number(x.value)===m.d[+x.dataset.i];const say=s=>{out.hidden=false;out.textContent=s};root.querySelector("[data-check-grid]").onclick=()=>{inputs.forEach(x=>{x.classList.toggle("tc-ok",ok(x));x.classList.toggle("tc-bad",x.value!==""&&!ok(x));x.setAttribute("aria-invalid",String(x.value!==""&&!ok(x)))});say(inputs.filter(ok).length+" / "+inputs.length+" cells correct.")};root.querySelector("[data-hint-grid]").onclick=()=>{const x=inputs.find(x=>!ok(x));if(!x){say("All correct.");return}const i=+x.dataset.i,js=a.map((v,j)=>j).filter(j=>j<i&&a[j]<a[i]);say("dp["+i+"]: "+(js.length?"1 + max of dp at indices "+js.join(", "):"no smaller predecessor; use 1"));x.focus()};root.querySelector("[data-reset-grid]").onclick=()=>{inputs.forEach(x=>{x.value="";x.classList.remove("tc-ok","tc-bad");x.removeAttribute("aria-invalid")});out.hidden=true}}
document.addEventListener("lecture-section-change",()=>controllers.forEach(c=>c.stop()));document.addEventListener("visibilitychange",()=>{if(document.hidden)controllers.forEach(c=>c.stop())});
})();