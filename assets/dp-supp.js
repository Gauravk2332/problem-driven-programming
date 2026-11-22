"use strict";(()=>{
const copy=d=>d.map(r=>r.slice());
function grid(g){
 if(!Array.isArray(g)||!g.length||g.length>6||!g[0].length||g[0].length>8||g.some(r=>r.length!==g[0].length||r.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>99))))throw Error("Grid: 1–6 rows, 1–8 columns; costs 0–99 or #.");
 const R=g.length,C=g[0].length,count=Array.from({length:R},()=>Array(C).fill(0)),cost=Array.from({length:R},()=>Array(C).fill(Infinity)),prev=Array.from({length:R},()=>Array(C).fill(null)),events=[];
 const save=(i,j,note)=>events.push({i,j,note,count:copy(count),cost:copy(cost)});
 save(-1,-1,"Begin with no computed cells.");
 for(let i=0;i<R;i++)for(let j=0;j<C;j++){
 if(g[i][j]===null){save(i,j,"Blocked cell: count 0, minimum cost ∞.");continue}
 if(i===0&&j===0){count[i][j]=1;cost[i][j]=g[i][j];save(i,j,"Open start: one path, cost "+g[i][j]+".");continue}
 const a=i?cost[i-1][j]:Infinity,b=j?cost[i][j-1]:Infinity;
 count[i][j]=(i?count[i-1][j]:0)+(j?count[i][j-1]:0);
 cost[i][j]=Math.min(a,b)+g[i][j];
 if(Number.isFinite(cost[i][j]))prev[i][j]=a<=b?[i-1,j]:[i,j-1];
 save(i,j,"Add counts from above and left = "+count[i][j]+". Minimum predecessor cost + cell "+g[i][j]+" = "+fmt(cost[i][j])+".");
 }
 const path=[];if(Number.isFinite(cost[R-1][C-1])){let p=[R-1,C-1];while(p){path.unshift(p);p=prev[p[0]][p[1]]}}
 return{count,cost,path,ways:count[R-1][C-1],best:cost[R-1][C-1],events,g};
}
function lcs(a,b){
 if(!/^[A-Za-z0-9 ]{0,12}$/.test(a)||!/^[A-Za-z0-9 ]{0,12}$/.test(b))throw Error("Use 0–12 ASCII letters, digits or spaces in each string.");
 const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0)),events=[];
 events.push({i:0,j:0,d:copy(d),note:"Empty prefixes have common subsequence length zero."});
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){const eq=a[i-1]===b[j-1];d[i][j]=eq?1+d[i-1][j-1]:Math.max(d[i-1][j],d[i][j-1]);events.push({i,j,d:copy(d),note:eq?"Match "+a[i-1]+": diagonal + 1 = "+d[i][j]:"Mismatch: maximum of above and left = "+d[i][j]})}
 let i=a.length,j=b.length;const pairs=[],path=[[i,j]];
 while(i&&j){if(a[i-1]===b[j-1]){pairs.unshift([i-1,j-1]);i--;j--}else if(d[i-1][j]>=d[i][j-1])i--;else j--;path.push([i,j])}
 return{a,b,d,events,path,pairs,witness:pairs.map(p=>a[p[0]]).join(""),best:d[a.length][b.length]};
}
function states(a,kind){
 if(!Array.isArray(a)||a.length>16||a.some(x=>!Number.isInteger(x)||x<0||x>99)||!["rob","stock"].includes(kind))throw Error("Use up to 16 integers, 0–99.");
 let x=0,y=-Infinity;const rows=[[x,y]],events=[{i:0,rows:copy(rows),note:"Empty prefix: free/skip = 0; holding/take is impossible."}];
 for(let i=0;i<a.length;i++){const v=a[i],nx=Math.max(x,kind==="rob"?y:y+v),ny=kind==="rob"?x+v:Math.max(y,x-v);rows.push([nx,ny]);events.push({i:i+1,rows:copy(rows),note:"Read "+v+": "+(kind==="rob"?"skip=max(old skip, old take); take=old skip + value.":"cash=max(old cash, old hold + price); hold=max(old hold, old cash − price.")+" New pair ("+fmt(nx)+", "+fmt(ny)+")."});x=nx;y=ny;}
 return{rows,events,best:kind==="rob"?Math.max(x,y):x,a,kind};
}
const fmt=x=>x===Infinity?"∞":x===-Infinity?"−∞":String(x);
function parseGrid(s){return s.trim().split(";").map(r=>r.split(",").map(v=>{v=v.trim();if(v==="#")return null;if(!/^\d{1,2}$/.test(v))throw Error("Use comma-separated costs or #; semicolon between rows.");return +v}))}
function parseList(s){return s.trim()?s.split(",").map(x=>{if(!/^\d{1,2}$/.test(x.trim()))throw Error("Use comma-separated integers 0–99.");return +x}):[]}
globalThis.PDPSupp={grid,lcs,states,parseGrid,parseList};if(typeof document==="undefined")return;
const make=(tag,t,cls)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=String(t);if(cls)e.className=cls;return e};
for(const root of document.querySelectorAll("[data-supp-lab]")){
 const get=k=>root.querySelector("[data-"+k+"]"),kind=root.dataset.suppLab,a=get("a"),b=get("b"),mode=get("mode"),err=get("error"),apply=get("apply"),note=get("note"),result=get("result"),view=get("grid");let m,displayMode=mode?.value;
 function read(){return kind==="grid"?grid(parseGrid(a.value)):kind==="lcs"?lcs(a.value,b.value):states(parseList(a.value),mode.value)}
 m=read();
 function table(headers,labels,rows,classes,display){const t=make("table",undefined,"k21-matrix"),h=make("thead"),tr=make("tr");headers.forEach(v=>{const th=make("th",v);th.scope="col";tr.append(th)});h.append(tr);t.append(h);const body=make("tbody");rows.forEach((r,i)=>{const tr=make("tr"),th=make("th",labels[i]);th.scope="row";tr.append(th);r.forEach((v,j)=>tr.append(make("td",display?display(v,i,j):fmt(v),classes(i,j))));body.append(tr)});t.append(body);view.replaceChildren(t)}
 function render(k){let e=m.events[k],last=k===m.events.length-1;const hi=(i,j)=>i===e.i&&j===e.j?"k21-current":(i===e.i-1&&j===e.j)||(i===e.i&&j===e.j-1)?"k21-dep":"";
 if(kind==="grid"){const isCount=displayMode==="count",rows=isCount?e.count:e.cost;table(["Row",...rows[0].map((_,j)=>j)],rows.map((_,i)=>i),rows,(i,j)=>(m.g[i][j]===null?"supp-blocked ":hi(i,j)+" ")+(last&&!isCount&&m.path.some(p=>p[0]===i&&p[1]===j)?"k21-path":""),(v,i,j)=>m.g[i][j]===null?"#":(e.i<0||i>e.i||(i===e.i&&j>e.j))?"—":fmt(v));result.textContent=last?"Paths = "+m.ways+" · Minimum cost = "+fmt(m.best)+(m.path.length?" · path "+m.path.map(p=>"("+p.join(",")+")").join(" → "):" · No path"):""}
 else if(kind==="lcs"){table(["A / B","∅",...m.b],["∅",...m.a],e.d,(i,j)=>hi(i,j)+(i===e.i-1&&j===e.j-1?" k21-dep":"")+(last&&m.path.some(p=>p[0]===i&&p[1]===j)?" k21-path":""),(v,i,j)=>i&&j&&(i>e.i||(i===e.i&&j>e.j))?"—":String(v));result.textContent=last?"LCS length = "+m.best+" · one LCS: "+(m.witness||"∅"):""}
 else{table(["Prefix length",m.kind==="rob"?"Skip":"Cash",m.kind==="rob"?"Take":"Hold"],e.rows.map((_,i)=>i),e.rows,(i,j)=>i===e.i?"k21-current":i===e.i-1?"k21-dep":"");result.textContent=last?"Optimal value = "+m.best:""}
 note.textContent=e.note;
 }
 const ctrl=window.lessonStepper(root,{length:()=>m.events.length,render,delay:550});
 function validate(){try{const v=read();err.textContent="";apply.disabled=false;return v}catch(e){err.textContent=e.message+" Last applied instance remains visible.";apply.disabled=true;return null}}
 for(const field of [a,b,mode].filter(Boolean)){field.addEventListener("input",()=>{ctrl.stop();validate()});field.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();apply.click()}})}
 apply.onclick=()=>{const v=validate();if(v){m=v;displayMode=mode?.value;ctrl.reset()}};get("end").onclick=()=>ctrl.end();
 document.addEventListener("lecture-section-change",()=>ctrl.stop());document.addEventListener("visibilitychange",()=>{if(document.hidden)ctrl.stop()});
}
for(const root of document.querySelectorAll("[data-supp-practice]")){const inputs=[...root.querySelectorAll("input[data-answer]")],out=root.querySelector("[data-feedback]"),ok=x=>/^\d+$/.test(x.value.trim())&&+x.value===+x.dataset.answer;function say(s){out.hidden=false;out.textContent=s}root.querySelector("[data-check-grid]").onclick=()=>{inputs.forEach(x=>{x.classList.toggle("tc-ok",ok(x));x.classList.toggle("tc-bad",x.value!==""&&!ok(x));x.setAttribute("aria-invalid",String(x.value!==""&&!ok(x)))});say(inputs.filter(ok).length+" / "+inputs.length+" correct.")};root.querySelector("[data-hint-grid]").onclick=()=>{const x=inputs.find(x=>!ok(x));if(x){say(x.dataset.hint);x.focus()}else say("All correct.")};root.querySelector("[data-reset-grid]").onclick=()=>{inputs.forEach(x=>{x.value="";x.classList.remove("tc-ok","tc-bad");x.removeAttribute("aria-invalid")});out.hidden=true}}
})();