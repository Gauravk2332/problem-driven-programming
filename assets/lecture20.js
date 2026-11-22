"use strict";
/* Pure, testable model + reusable UI for the minimum-energy jump problem.
   Heights: 1..10 integers in [0,99]. A legal move advances 1 or 2 stones. */
(function(){
function model(h){
 if(!Array.isArray(h)||!h.length||h.length>10||h.some(v=>!Number.isInteger(v)||v<0||v>99))throw Error("Enter 1–10 whole-number heights from 0 to 99.");
 const n=h.length, d=[0], parent=[-1];
 for(let i=1;i<n;i++){const a=d[i-1]+Math.abs(h[i]-h[i-1]),b=i>=2?d[i-2]+Math.abs(h[i]-h[i-2]):Infinity;d[i]=Math.min(a,b);parent[i]=a<=b?i-1:i-2}
 const path=[];for(let i=n-1;i>=0;i=parent[i])path.unshift(i);
 const memo=Array(n).fill(null),stack=[],events=[];let calls=0,hits=0,misses=0;
 function event(phase,i,detail){events.push({phase,i,detail,memo:[...memo],stack:[...stack],calls,hits,misses})}
 function solve(i){calls++;stack.push(i);if(memo[i]!==null){hits++;event("hit",i,"Cached dp["+i+"] = "+memo[i]+"; return without expanding.");stack.pop();return memo[i]}
 misses++;event("miss",i,"First request for dp["+i+"]; "+(i===0?"base case.":"request prerequisites."));
 if(i===0)memo[i]=0;else{const a=solve(i-1)+Math.abs(h[i]-h[i-1]),b=i>=2?solve(i-2)+Math.abs(h[i]-h[i-2]):Infinity;memo[i]=Math.min(a,b)}
 event("store",i,"Store dp["+i+"] = "+memo[i]+" and return.");stack.pop();return memo[i]}
 const result=solve(n-1);event("done",n-1,"Query answered: "+result+". Every computed state was stored once.");
 const tab=d.map((v,i)=>({i,value:v,terms:i===0?[]:[{j:i-1,cost:Math.abs(h[i]-h[i-1]),total:d[i-1]+Math.abs(h[i]-h[i-1])},...(i>=2?[{j:i-2,cost:Math.abs(h[i]-h[i-2]),total:d[i-2]+Math.abs(h[i]-h[i-2])}]:[])]}));
 const roll=[{i:0,before:[null,null],after:[null,0],value:0,terms:[]}];
 for(let i=1;i<n;i++)roll.push({i,before:[i>=2?d[i-2]:null,d[i-1]],after:[d[i-1],d[i]],value:d[i],terms:tab[i].terms});
 return {h:[...h],d,parent,path,events,tab,roll,result,calls,hits,misses};
}
if(typeof globalThis!=="undefined")globalThis.PDP20={model};
if(typeof document==="undefined")return;
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const fmt=v=>v===null||v===undefined?"—":String(v);
const pretty=t=>t.length?t.map(x=>"dp["+x.j+"] + "+x.cost+" = "+x.total).join(" ; "):"Base case: starting at stone 0 costs 0.";
const steps=[];
for(const root of document.querySelectorAll("[data-dp20-lab]")){
 const kind=root.dataset.dp20Lab, input=root.querySelector("[data-heights]"),error=root.querySelector("[data-error]"),board=root.querySelector("[data-cells]"),note=root.querySelector("[data-explain]"),vars=root.querySelector("[data-vars]"),route=root.querySelector("[data-route]");let m=model([10,30,40,20,25,15]);
 function cells(vals,cur,deps=[]){board.replaceChildren();vals.forEach((v,i)=>{const c=el("div","cell"+(i===cur?" current":"")+(deps.includes(i)?" dependency":""));c.append(el("small","","i="+i+" · h="+m.h[i]),el("strong","",fmt(v)));board.append(c)})}
 function line(k){root.querySelectorAll("[data-line]").forEach(e=>e.classList.toggle("current",Number(e.dataset.line)===k))}
 function render(k){route.textContent="";if(kind==="memo"){const e=m.events[k];cells(e.memo,e.i);line({miss:0,hit:1,store:e.i===0?2:3,done:4}[e.phase]);note.textContent=e.detail;vars.textContent="Call stack (bottom → top): "+(e.stack.join(" → ")||"empty")+"\nCalls: "+e.calls+" · cache hits: "+e.hits+" · first visits: "+e.misses; if(e.phase==="done")route.textContent="Minimum energy = "+m.result}
 else if(kind==="tab"){const e=m.tab[k];cells(m.d.map((v,i)=>i<=k?v:null),k,e.terms.map(t=>t.j));line(k===0?0:2);note.textContent=k===0?pretty(e.terms):pretty(e.terms)+" → minimum "+e.value;vars.textContent="i = "+k+"\n"+(m.parent[k]<0?"Start state":"Chosen predecessor: "+m.parent[k])+"\nComputed "+(k+1)+" / "+m.h.length+" states";if(k===m.h.length-1)route.textContent="Minimum energy = "+m.result+"; one optimal route: "+m.path.join(" → ")}
 else {const e=m.roll[k];board.replaceChildren();for(const [l,v] of [["Before · prev2",e.before[0]],["Before · prev1",e.before[1]],["Current",e.value],["After · prev2",e.after[0]],["After · prev1",e.after[1]]]){const c=el("div","cell"+(l==="Current"?" current":""));c.append(el("small","",l),el("strong","",fmt(v)));board.append(c)}line(k===0?0:k===1?1:3);note.textContent=k===0?"Start with dp[0] = 0. No predecessor.":pretty(e.terms)+" → "+e.value;vars.textContent="i = "+k+"\nCompute current before shifting registers.\nRetain only the last two state values.";if(k===m.h.length-1)route.textContent="Minimum energy = "+m.result+" (value only; predecessor history was discarded)."}
 }
 const events=()=>kind==="memo"?m.events:kind==="tab"?m.tab:m.roll;
 const step=window.lessonStepper(root,{length:()=>events().length,render,delay:750});steps.push(step);
 function apply(){try{const chunks=input.value.trim().split(/\s*,\s*|\s+/);if(!chunks.length||chunks.some(x=>!/^\d{1,2}$/.test(x)))throw Error("Enter 1–10 heights (0–99), separated by commas or spaces.");m=model(chunks.map(Number));error.textContent="";step.reset()}catch(e){error.textContent=e.message;}}
 root.querySelector("[data-apply]").onclick=apply;input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply()}});root.querySelector("[data-end]").onclick=()=>step.end();
}
document.addEventListener("lecture-section-change",()=>steps.forEach(s=>s.stop()));document.addEventListener("visibilitychange",()=>{if(document.hidden)steps.forEach(s=>s.stop())});
/* Generic table exercises: answer computed from the same model, not embedded guesses. */
for(const root of document.querySelectorAll("[data-jump-practice]")){
 const h=root.dataset.jumpPractice.split(",").map(Number), m=model(h), inputs=[...root.querySelectorAll("input[data-cell]")], feedback=root.querySelector("[data-table-feedback]");
 const wrong=()=>inputs.find(x=>x.value.trim()===""||Number(x.value)!==m.d[Number(x.dataset.cell)]);
 function say(s,ok){feedback.hidden=false;feedback.textContent=s;feedback.classList.toggle("tc-good",!!ok)}
 root.querySelector("[data-table-check]").onclick=()=>{let count=0;for(const x of inputs){const filled=x.value.trim()!=="",ok=filled&&Number(x.value)===m.d[Number(x.dataset.cell)];x.classList.toggle("tc-ok",ok);x.classList.toggle("tc-bad",filled&&!ok);x.setAttribute("aria-invalid",String(filled&&!ok));if(ok)count++}const w=wrong();say(count+" / "+inputs.length+" cells correct."+(w?" Review dp["+w.dataset.cell+"] first.":" Minimum energy = "+m.result+"."),!w);if(w)w.focus()};
 root.querySelector("[data-table-hint]").onclick=()=>{const w=wrong();if(!w){say("Every cell is correct.",true);return}const i=Number(w.dataset.cell),e=m.tab[i];say(i===0?"Starting energy is zero.":"For dp["+i+"], compare "+e.terms.map(t=>"dp["+t.j+"] + |"+h[i]+" − "+h[t.j]+ "|").join(" and ")+". Use already computed predecessors.");w.focus()};
 root.querySelector("[data-table-reset]").onclick=()=>{for(const x of inputs){x.value="";x.classList.remove("tc-ok","tc-bad");x.removeAttribute("aria-invalid")}feedback.hidden=true};
}
})();
