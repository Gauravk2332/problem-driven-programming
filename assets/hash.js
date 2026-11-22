"use strict";(()=>{
function model(keys,m,method){
 if(!Number.isInteger(m)||m<2||m>17||!Array.isArray(keys)||keys.length>24||keys.some(k=>!Number.isInteger(k)||Math.abs(k)>999))throw Error("Use table size 2–17 and up to 24 integers from −999 to 999.");
 if(!["chain","linear","quadratic","double"].includes(method))throw Error("Unknown method");
 const mod=(x,n)=>((x%n)+n)%n, gcd=(a,b)=>b?gcd(b,a%b):a;
 if(method==="double"&&Array.from({length:m-2},(_,i)=>i+2).some(i=>m%i===0))throw Error("Double hashing lab requires prime size (2,3,5,7,11,13,17).");
 const cells=Array.from({length:m},()=>method==="chain"?[]:null),events=[],seen=new Set();
 const save=(k,idx,note,probes=[])=>events.push({k,idx,note,probes:[...probes],cells:cells.map(x=>Array.isArray(x)?[...x]:x),count:seen.size});
 save(null,-1,"Start with empty buckets.");
 for(const k of keys){const h=mod(k,m);if(seen.has(k)){save(k,h,"Duplicate key: set remains unchanged.");continue}
 if(method==="chain"){cells[h].push(k);seen.add(k);save(k,h,"h("+k+") = "+h+". Append to bucket "+h+".",[h]);continue}
 const step=1+mod(k,m-1),probes=[];let stored=false;
 for(let i=0;i<m;i++){const idx=mod(h+(method==="linear"?i:method==="quadratic"?i*i:i*step),m);probes.push(idx);
 if(cells[idx]===null){cells[idx]=k;seen.add(k);save(k,idx,"Empty slot "+idx+": insert "+k+".",probes);stored=true;break}
 save(k,idx,"Slot "+idx+" occupied by "+cells[idx]+". Continue probing.",probes)}
 if(!stored)save(k,-1,"Probe limit reached. Key "+k+" not inserted; resize or choose another probe rule.",probes)
 }
 return {cells,events,count:seen.size,keys:[...seen]};
}
function resize(keys,m,newM,method){return {before:model(keys,m,method),after:model(model(keys,m,method).keys,newM,method)}}
globalThis.PDPHash={model,resize};if(typeof document==="undefined")return;
const mk=(tag,cls,t)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(t!=null)e.textContent=t;return e};
for(const root of document.querySelectorAll("[data-hash-lab]")){
 const get=k=>root.querySelector("[data-"+k+"]"),input=get("keys"),size=get("size"),method=get("method"),error=get("error"),apply=get("apply"),result=get("result"),grid=get("grid"),note=get("note"),stats=get("stats");let m;
 function read(){const s=input.value.trim(),keys=s?s.split(",").map(x=>{if(!/^-?\d{1,3}$/.test(x.trim()))throw Error("Enter comma-separated integers.");return Number(x)}):[];return model(keys,Number(size.value),method.value)}
 m=read();
 function render(k){const ev=m.events[k];const table=mk("table","academic-table");const head=mk("thead"),tr=mk("tr");["Index","Stored key(s)"].forEach(x=>{const th=mk("th","",x);th.scope="col";tr.append(th)});head.append(tr);table.append(head);const body=mk("tbody");ev.cells.forEach((v,i)=>{const row=mk("tr",i===ev.idx?"hash-current":"");row.append(mk("th","",i),mk("td","",Array.isArray(v)?v.join(" → ")||"∅":v===null?"∅":String(v)));body.append(row)});table.append(body);grid.replaceChildren(table);note.textContent=ev.note+(ev.probes.length?" Probe sequence: "+ev.probes.join(", ")+".":"");stats.textContent="Stored keys "+ev.count+" / buckets "+ev.cells.length+" · load factor "+(ev.count/ev.cells.length).toFixed(2);result.textContent=k===m.events.length-1?"Final stored keys: "+m.keys.join(", "):""}
 const ctrl=window.lessonStepper(root,{length:()=>m.events.length,render,delay:650});
 function validate(){try{const next=read();error.textContent="";apply.disabled=false;return next}catch(e){error.textContent=e.message+" Last applied table remains visible.";apply.disabled=true;return null}}
 for(const x of [input,size,method])x.addEventListener("input",validate);apply.onclick=()=>{const next=validate();if(next){m=next;ctrl.reset()}};get("end").onclick=()=>ctrl.end();
 document.addEventListener("lecture-section-change",()=>ctrl.stop());document.addEventListener("visibilitychange",()=>{if(document.hidden)ctrl.stop()});
}
})();