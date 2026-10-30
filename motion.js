/* One motion vocabulary for routes, sheets, feedback and content entrances. */
'use strict';
(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),main=document.querySelector('#main'),archive=document.querySelector('#archive');
 const ease='cubic-bezier(.22,1,.36,1)',durations=Object.freeze({press:100,release:220,route:360,sheet:360,close:260,reveal:380});
 const running=new Set(),seen=new WeakSet(),prepared=new WeakSet(),entered=new Set(),pending=new Set();let held=false;
 function animate(el,frames,options={}){if(preference.matches||document.hidden||!el?.animate)return null;const a=el.animate(frames,{duration:durations.reveal,easing:ease,...options});running.add(a);a.finished.catch(()=>{}).finally(()=>running.delete(a));return a}
 window.ArchiveMotion=Object.freeze({ease,durations,animate});
 const selector='.hub-kicker,.hub-heading h1,.hub-heading>p,.hub-cta,.hub-quick,.hub-topline,.hub-directory-heading,.room-card,.person,.search-field,.gallery-controls,.filters,.gallery>button,.chat-stats>article,.chat-method,.archive-activity,.activity-row,.sticker-board,.award-row,.future>div,.heart>p,.heart>blockquote,.heart>span,.wall-toolbar,.wall-note,.wall-footnote,.arcade-intro-copy>.eyebrow,.arcade-intro h2,.arcade-intro-copy>p,.arcade-intro-crew,.arcade-start,.arcade-rules,.arcade-leaderboard,.quote-game,.date-prize';
 function visible(el){if(!el.isConnected||el.closest('[hidden],[inert]'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight-12&&r.right>0&&r.left<innerWidth}
 function titleLines(el){if(!el.matches('h1,h2')||el.dataset.motionLines)return;el.dataset.motionLines='true';const lines=[];let line=document.createElement('span');line.className='motion-title-line';for(const node of [...el.childNodes]){if(node.nodeName==='BR'){lines.push(line);line=document.createElement('span');line.className='motion-title-line'}else line.append(node)}lines.push(line);el.replaceChildren(...lines)}
 function reveal(el,i=0){if(!visible(el))return;seen.add(el);observer.unobserve(el);pending.delete(el);animate(el,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{delay:Math.min(i*35,105)})}
 const observer=new IntersectionObserver(entries=>{
  const incoming=entries.filter(e=>e.isIntersecting&&!seen.has(e.target)&&visible(e.target));
  if(held){incoming.forEach(e=>pending.add(e.target));return}
  incoming.forEach((e,i)=>reveal(e.target,i%4));
 },{threshold:.04,rootMargin:'0px 0px -12px 0px'});
 function register(el){if(prepared.has(el)||el.closest('.arcade-stage'))return;prepared.add(el);titleLines(el);observer.observe(el)}
 function scan(root){if(root.matches?.(selector))register(root);root.querySelectorAll(selector).forEach(register);root.querySelectorAll('h1,h2').forEach(titleLines)}
 function prepare(id){const root=document.querySelector('.archive-page[data-room="'+id+'"]')||document.getElementById(id);if(root)scan(root)}
 function enter(id,options={}){
  const root=document.querySelector('.archive-page[data-room="'+id+'"]')||document.getElementById(id);if(!root||archive.hidden)return;scan(root);
  if(options.route){
   // Surface motion leads; only a first visit gets the small coordinated cover entrance.
   const cover=root.querySelector('.section-cover,.arcade-intro,.hub-welcome');
   if(!entered.has(id)&&!options.backwards&&cover){const heading=cover.querySelector('h1,h2'),description=cover.querySelector('.section-heading>p,.arcade-intro-copy>p,.hub-heading>p');
    if(heading)animate(heading,[{opacity:.3,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:durations.route,delay:35});
    if(description)animate(description,[{opacity:.2,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:280,delay:70});
   }
   root.querySelectorAll(selector).forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0){seen.add(el);observer.unobserve(el);pending.delete(el)}});entered.add(id);return;
  }
  root.querySelectorAll(selector).forEach((el,i)=>{if(!seen.has(el)&&visible(el))reveal(el,i%4)});entered.add(id);pending.clear();
 }
 window.archiveMotion={hold(value){held=value;if(value){running.forEach(a=>a.cancel());pending.clear()}},prepare,enter};
 scan(main);document.documentElement.dataset.motion='on';
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType===1&&!node.closest('.arcade-stage,.motion-title-line,.sheet-chrome'))scan(node)}}).observe(main,{childList:true,subtree:true});
 document.addEventListener('archive:opened',()=>{prepare(document.body.dataset.archiveRoom||'home');requestAnimationFrame(()=>enter(document.body.dataset.archiveRoom||'home'))});
 if(!archive.hidden){prepare(document.body.dataset.archiveRoom||'home');requestAnimationFrame(()=>enter(document.body.dataset.archiveRoom||'home'))}
 preference.addEventListener('change',()=>{if(preference.matches){running.forEach(a=>a.cancel());held=false;pending.clear()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)running.forEach(a=>a.cancel())});
})();
