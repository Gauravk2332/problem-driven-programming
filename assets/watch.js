(function(){
  "use strict";
  var box=document.getElementById("watch-first");
  if(!box)return;
  var key="pdp-watch-closed:"+(box.getAttribute("data-watch")||"");
  try{if(localStorage.getItem(key)==="1")box.removeAttribute("open")}catch(e){}
  box.addEventListener("toggle",function(){try{if(box.open)localStorage.removeItem(key);else localStorage.setItem(key,"1")}catch(e){}});
  function offline(){box.classList.toggle("is-offline",navigator.onLine===false)}
  offline();window.addEventListener("online",offline);window.addEventListener("offline",offline);
  var img=box.querySelector(".watch-thumb img");
  if(img)img.addEventListener("error",function(){img.style.visibility="hidden"});
  box.addEventListener("click",function(ev){
    var a=ev.target.closest("[data-yt]");
    if(!a||ev.button!==0||ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;
    if(navigator.onLine===false)return;
    ev.preventDefault();
    var f=document.createElement("iframe");
    f.src="https://www.youtube-nocookie.com/embed/"+a.getAttribute("data-yt")+"?autoplay=1&rel=0";
    f.title=a.getAttribute("data-title")||"Lecture video";
    f.allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen","");
    f.referrerPolicy="strict-origin-when-cross-origin";
    a.replaceWith(f);
    f.focus();
  });
})();
