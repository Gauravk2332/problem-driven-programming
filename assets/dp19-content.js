"use strict";
(()=>{const $=id=>document.getElementById(id),input=$("growth-n");if(!input)return;
const fib=n=>{let a=0,b=1;for(let i=0;i<n;i++)[a,b]=[b,a+b];return a};
const format=n=>n.toLocaleString("en-IN");
function show(){const n=Number(input.value),answer=fib(n),calls=2*fib(n+1)-1,states=n+1,naive=(calls-1)/2,dp=n-1,scale=Math.log10(1+naive);$("growth-n-value").textContent=n;$("growth-calls").textContent=format(calls);$("growth-states").textContent=format(states);$("growth-answer").textContent=format(answer);$("growth-naive-adds").textContent=format(naive);$("growth-dp-adds").textContent=format(dp);$("growth-naive-bar").style.width="100%";$("growth-dp-bar").style.width=(100*Math.log10(1+dp)/scale)+"%";$("growth-note").textContent="The standard DP avoids "+format(naive-dp)+" repeated additions for F("+n+"). Both approaches compute "+format(answer)+"."}
input.addEventListener("input",show);show();
})();