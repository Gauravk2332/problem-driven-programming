"use strict";
(()=>{
const sections=[...document.querySelectorAll(".lesson-section[data-title]")];
const toggle=document.getElementById("ink-toggle"),bar=document.getElementById("ink-toolbar");
if(!sections.length||!toggle||!bar)return;
const $=id=>document.getElementById(id),ns="http://www.w3.org/2000/svg";
const toolButtons=[...bar.querySelectorAll("[data-ink-tool]")],color=$("ink-color"),width=$("ink-width"),undo=$("ink-undo"),clear=$("ink-clear"),status=$("ink-status");
let opened=false,tool="navigate",active=null,currentMode=getMode(),lastSection=sections[0];
const states=new Map();
function getMode(){return document.body.classList.contains("classroom")?"classroom":"reading"}
function make(tag,attrs={}){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function bank(s){return s.banks[currentMode]}
function visibleSection(){if(getMode()==="classroom")return sections.find(s=>s.classList.contains("active"))||sections[0];const top=(document.querySelector(".lesson-top")?.getBoundingClientRect().bottom||0)+16;const within=s=>{const r=s.getBoundingClientRect();return r.bottom>top&&r.top<window.innerHeight};return lastSection&&within(lastSection)?lastSection:sections.find(within)||lastSection}
function refreshButtons(){const section=visibleSection();lastSection=section;const state=states.get(section),b=state?bank(state):null;undo.disabled=!b||!b.history.length;clear.disabled=!b||!b.strokes.length;status.textContent="Section: "+section.dataset.title+" · "+(tool==="navigate"?"Navigate: scroll, select answers and operate animations. Your marks remain visible.":(tool==="eraser"?"Erase: drag over a stroke to remove it.":"Draw on the lesson with your pen, mouse or finger. Select Navigate to scroll or operate animations.")+" Marks stay in this browser tab only.")}
function refreshMode(){finish();currentMode=getMode();for(const s of states.values())render(s);refreshButtons()}
function choose(t){finish();if(t==="highlight"&&tool!=="highlight"){color.value="#f0c419"}else if(t==="pen"&&tool==="highlight"){color.value="#174cbd"}tool=t;for(const b of toolButtons)b.setAttribute("aria-pressed",String(b.dataset.inkTool===t));for(const s of states.values()){s.layer.classList.toggle("ink-active",opened&&t!=="navigate");s.layer.classList.toggle("ink-eraser",t==="eraser")}refreshButtons()}
function pathD(points){if(!points.length)return"";if(points.length===1)return"M"+points[0].x+" "+points[0].y+" l0.01 0";return points.map((p,i)=>(i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1)).join(" ")}
function addPath(s,stroke){const el=make("path",{d:pathD(stroke.points),fill:"none",stroke:stroke.color,"stroke-width":stroke.width,"stroke-linecap":"round","stroke-linejoin":"round",opacity:stroke.opacity});s.layer.append(el);return el}
function render(s){s.layer.replaceChildren();for(const stroke of bank(s).strokes)addPath(s,stroke)}
function point(s,e){const r=s.layer.getBoundingClientRect();return{x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))}}
function snapshot(b){b.history.push(b.strokes.slice());if(b.history.length>100)b.history.shift()}
function dist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function erase(s,p){const b=bank(s);for(let i=b.strokes.length-1;i>=0;i--){const v=b.strokes[i],pts=v.points;let hit=pts.length===1&&dist(p,pts[0],pts[0])<=Math.max(12,v.width/2+5);for(let j=1;!hit&&j<pts.length;j++)hit=dist(p,pts[j-1],pts[j])<=Math.max(12,v.width/2+5);if(hit){if(!active.changed){snapshot(b);active.changed=true}b.strokes.splice(i,1);render(s);return}}}
function finish(e){if(!active||e&&e.pointerId!==active.id)return;const a=active;active=null;if(a.s.layer.hasPointerCapture?.(a.id))try{a.s.layer.releasePointerCapture(a.id)}catch{}refreshButtons()}
function down(s,e){if(!opened||tool==="navigate"||active||e.button!==0||e.isPrimary===false)return;e.preventDefault();lastSection=s.section;const p=point(s,e);active={id:e.pointerId,s,changed:false};try{s.layer.setPointerCapture(e.pointerId)}catch{}if(tool==="eraser"){erase(s,p);return}const b=bank(s);snapshot(b);const stroke={color:color.value,width:Number(width.value)*(tool==="highlight"?4:1),opacity:tool==="highlight"?.32:1,points:[p]};b.strokes.push(stroke);active.stroke=stroke;active.path=addPath(s,stroke)}
function move(s,e){if(!active||active.id!==e.pointerId||active.s!==s)return;e.preventDefault();const samples=e.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[e]){const p=point(s,sample);if(tool==="eraser")erase(s,p);else active.stroke.points.push(p)}if(active.path)active.path.setAttribute("d",pathD(active.stroke.points))}
for(const section of sections){const layer=make("svg",{class:"ink-layer","aria-hidden":"true"});section.classList.add("ink-section");section.append(layer);const s={section,layer,banks:{reading:{strokes:[],history:[]},classroom:{strokes:[],history:[]}}};states.set(section,s);layer.addEventListener("pointerdown",e=>down(s,e));layer.addEventListener("pointermove",e=>move(s,e));for(const name of ["pointerup","pointercancel","lostpointercapture"])layer.addEventListener(name,finish)}
toggle.addEventListener("click",()=>{opened=!opened;toggle.setAttribute("aria-expanded",String(opened));bar.hidden=!opened;document.body.classList.toggle("ink-open",opened);choose(opened?"pen":"navigate")});for(const b of toolButtons)b.addEventListener("click",()=>choose(b.dataset.inkTool));
undo.addEventListener("click",()=>{finish();const s=states.get(visibleSection());if(!s)return;const b=bank(s);if(b.history.length){b.strokes=b.history.pop();render(s)}refreshButtons()});
clear.addEventListener("click",()=>{finish();const s=states.get(visibleSection());if(!s)return;const b=bank(s);if(b.strokes.length&&window.confirm("Clear all annotations on this section?")){snapshot(b);b.strokes=[];render(s)}refreshButtons()});
document.getElementById("mode-toggle")?.addEventListener("click",refreshMode);
document.addEventListener("lecture-section-change",()=>{finish();requestAnimationFrame(refreshButtons)});
window.addEventListener("scroll",()=>{if(opened&&!active)refreshButtons()},{passive:true});
window.addEventListener("resize",()=>{if(opened)refreshButtons()});
document.addEventListener("keydown",e=>{if(opened&&e.key==="Escape"&&tool!=="navigate"){choose("navigate");e.preventDefault()}});
choose("navigate");
})();