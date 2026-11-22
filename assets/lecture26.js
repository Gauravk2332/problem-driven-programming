"use strict";
(()=>{
function chain(p){
 if(p.length<2||p.length>8||p.some(x=>!Number.isInteger(x)||x<1||x>99))throw Error("Enter 2–8 dimensions, each 1–99.");
 const n=p.length-1,d=Array.from({length:n},()=>Array(n).fill(null)),split=Array.from({length:n},()=>Array(n).fill(-1)),events=[];
 for(let i=0;i<n;i++)d[i][i]=0;
 const save=(i,j,k,note)=>events.push({i,j,k,note,rows:d.map(r=>[...r])});
 save(-1,-1,-1,"One matrix needs zero scalar multiplications.");
 for(let len=2;len<=n;len++)for(let i=0;i+len<=n;i++){const j=i+len-1;for(let k=i;k<j;k++){const x=d[i][k]+d[k+1][j]+p[i]*p[k+1]*p[j+1];if(d[i][j]===null||x<d[i][j]){d[i][j]=x;split[i][j]=k}save(i,j,k,"Split at "+(k+1)+": candidate "+x+"; best so far "+d[i][j]+".")}}
 const build=(i,j)=>i===j?"A"+(i+1):"("+build(i,split[i][j])+" × "+build(split[i][j]+1,j)+")";
 return {best:d[0][n-1],d,split,events,witness:build(0,n-1)};
}
function assign(c){
 const n=c.length;if(n<1||n>5||c.some(r=>r.length!==n||r.some(x=>!Number.isInteger(x)||x<0||x>99)))throw Error("Supply a square 1–5 by 1–5 cost matrix with entries 0–99.");
 const size=1<<n,d=Array(size).fill(Infinity),parent=Array(size).fill(-1),events=[],pop=m=>m.toString(2).replaceAll("0","").length;d[0]=0;
 const save=(mask,j,next,note)=>events.push({mask,j,next,note,rows:[...d]});save(0,-1,0,"No tasks assigned: cost 0.");
 for(let mask=0;mask<size;mask++){const i=pop(mask);if(i===n)continue;for(let j=0;j<n;j++)if(!(mask&(1<<j))){const next=mask|(1<<j),v=d[mask]+c[i][j];if(v<d[next]){d[next]=v;parent[next]=j}save(mask,j,next,"Worker "+(i+1)+" → job "+(j+1)+": "+d[mask]+" + "+c[i][j]+" = "+v+"; new best "+d[next]+".")}}
 let mask=size-1,w=[];while(mask){const j=parent[mask];w.unshift(j);mask^=1<<j}return {best:d[size-1],d,events,witness:w};
}
function digit(N,S){
 if(!Number.isInteger(N)||N<0||N>9999||!Number.isInteger(S)||S<0||S>36)throw Error("Bound 0–9999 and target sum 0–36.");
 const digits=String(N).split("").map(Number),events=[];let d=[Array(S+1).fill(0),Array(S+1).fill(0)];d[1][0]=1;
 const save=(pos,note)=>events.push({pos,note,rows:d.map(r=>[...r])});save(0,"Empty prefix: one tight state at sum zero.");
 for(let i=0;i<digits.length;i++){const next=[Array(S+1).fill(0),Array(S+1).fill(0)];for(let t=0;t<=1;t++)for(let s=0;s<=S;s++)for(let x=0;x<=(t?digits[i]:9)&&s+x<=S;x++){const nt=Number(t===1&&x===digits[i]);next[nt][s+x]+=d[t][s]}d=next;save(i+1,"Read bound digit "+digits[i]+": distribute prefix counts to allowed digits. Tight survives only on equality.")}
 return {best:d[0][S]+d[1][S],d,events};
}
function parse(kind,raw,target){const num=s=>{if(!/^\d{1,4}$/.test(s.trim()))throw Error("Use nonnegative whole numbers only.");return Number(s)};if(kind==="chain")return chain(raw.split(",").map(num));if(kind==="assign")return assign(raw.split(";").map(r=>r.split(",").map(num)));return digit(num(raw),num(target))}
globalThis.PDP26={chain,assign,digit,parse};if(typeof document==="undefined")return;
const el=(tag,cls,t)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(t!=null)e.textContent=t;return e},fmt=x=>x===null?"—":x===Infinity?"∞":String(x),controllers=[];
for(const root of document.querySelectorAll("[data-adv26]")){
 const kind=root.dataset.adv26,inp=root.querySelector("[data-input]"),target=root.querySelector("[data-target]"),apply=root.querySelector("[data-apply]"),error=root.querySelector("[data-error]"),grid=root.querySelector("[data-grid]"),note=root.querySelector("[data-note]"),live=root.querySelector("[data-vars]"),result=root.querySelector("[data-result]");let m=parse(kind,inp.value,target?target.value:"0");
 function draw(headers,rows){const t=el("table","k21-matrix"),h=el("thead"),r=el("tr");headers.forEach(x=>{const th=el("th","",x);th.scope="col";r.append(th)});h.append(r);t.append(h);const b=el("tbody");rows.forEach(([label,vals,active,deps=[]])=>{const tr=el("tr"),th=el("th","",label);th.scope="row";tr.append(th);vals.forEach((v,j)=>tr.append(el("td",j===active?"k21-current":deps.includes(j)?"k21-dep":"",fmt(v))));b.append(tr)});t.append(b);grid.replaceChildren(t)}
 function render(k){const e=m.events[k];result.textContent="";
 if(kind==="chain"){const n=e.rows.length;draw(["i / j",...Array.from({length:n},(_,i)=>i+1)],e.rows.map((r,i)=>[i+1,r,i===e.i?e.j:-1,[...(i===e.i&&e.k>=0?[e.k]:[]),...(i===e.k+1&&e.k>=0?[e.j]:[])]]));live.textContent=e.i<0?"Base intervals":"Interval ["+(e.i+1)+","+(e.j+1)+"] · split after "+(e.k+1)}
 else if(kind==="assign"){const n=Math.log2(e.rows.length),bin=x=>x.toString(2).padStart(n,"0");draw(["Mask","Assigned","Best cost"],e.rows.map((v,i)=>[bin(i),[bin(i).replaceAll("0","").length,v],i===e.next?1:-1,i===e.mask?[1]:[]]));live.textContent=e.j<0?"Start mask 0":"Source "+bin(e.mask)+" · set bit "+e.j+" → "+bin(e.next)}
 else{draw(["Prefix state",...e.rows[0].map((_,i)=>i)],[["Loose",e.rows[0],-1],["Tight",e.rows[1],-1]]);live.textContent="Processed digits = "+e.pos+" · columns are accumulated sums"}
 note.textContent=e.note;root.querySelectorAll("[data-line]").forEach(x=>x.classList.toggle("current",Number(x.dataset.line)===(k===0?0:1)));
 if(k===m.events.length-1)result.textContent=(kind==="chain"?"Minimum scalar multiplications = "+m.best+" · "+m.witness:kind==="assign"?"Minimum cost = "+m.best+" · jobs by worker: "+m.witness.map(x=>x+1).join(", "):"Count = "+m.best);
 }
 const ctrl=window.lessonStepper(root,{length:()=>m.events.length,render,delay:650});controllers.push(ctrl);
 function validate(){try{const v=parse(kind,inp.value,target?target.value:"0");error.textContent="";apply.disabled=false;inp.setAttribute("aria-invalid","false");target?.setAttribute("aria-invalid","false");return v}catch(e){error.textContent=e.message+" Previous instance remains visible.";apply.disabled=true;inp.setAttribute("aria-invalid","true");target?.setAttribute("aria-invalid","true");return null}}
 for(const x of [inp,target].filter(Boolean)){x.addEventListener("input",validate);x.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply.click()}})}apply.onclick=()=>{const v=validate();if(v){m=v;ctrl.reset()}};root.querySelector("[data-end]").onclick=()=>ctrl.end();
}
for(const root of document.querySelectorAll("[data-adv-practice]")){const inputs=[...root.querySelectorAll("input[data-answer]")],out=root.querySelector("[data-feedback]"),ok=x=>/^\d+$/.test(x.value.trim())&&+x.value===+x.dataset.answer;const say=s=>{out.hidden=false;out.textContent=s};root.querySelector("[data-check-grid]").onclick=()=>{inputs.forEach(x=>{x.classList.toggle("tc-ok",ok(x));x.classList.toggle("tc-bad",x.value!==""&&!ok(x));x.setAttribute("aria-invalid",String(x.value!==""&&!ok(x)))});say(inputs.filter(ok).length+" / "+inputs.length+" correct.")};root.querySelector("[data-hint-grid]").onclick=()=>{const x=inputs.find(x=>!ok(x));if(x){say(x.dataset.hint);x.focus()}else say("All correct.")};root.querySelector("[data-reset-grid]").onclick=()=>{inputs.forEach(x=>{x.value="";x.classList.remove("tc-ok","tc-bad");x.removeAttribute("aria-invalid")});out.hidden=true}}
document.addEventListener("lecture-section-change",()=>controllers.forEach(c=>c.stop()));document.addEventListener("visibilitychange",()=>{if(document.hidden)controllers.forEach(c=>c.stop())});
})();