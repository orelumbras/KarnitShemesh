'use strict';
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),main=document.querySelector('#main'),archive=document.querySelector('#archive');
 let held=false,activeRoom=null;const seen=new WeakSet(),prepared=new WeakSet(),counters=new WeakSet(),running=new Set(),pending=new Set();
 const selected='.hub-kicker,.hub-heading h1,.hub-heading>p,.hub-cta,.hub-topline,.hub-edition,.hub-hero-bottom,.hub-stats>div,.daily-heading,.daily-quote,.hub-directory-heading,.room-card,.section-cover .eyebrow,.section-cover h2,.section-cover .section-heading>p,.person,.search-label,.search,.gallery-controls,.filters,.gallery>button,.chat-stats>article,.chat-method,.archive-activity,.activity-row,.sticker-board,.award-row,.future>div,.heart>p,.heart>blockquote,.heart>span,.wall-toolbar,.wall-status,.wall-note,.wall-footnote,.arcade-intro-copy>.eyebrow,.arcade-intro h2,.arcade-intro-copy>p,.arcade-intro-crew,.arcade-start,.arcade-legend,.quote-game,.date-prize';
 function candidates(root){return [...root.querySelectorAll(selected)].filter(el=>!el.closest('.arcade-stage')&&!el.closest('[hidden]')&&!el.closest('.motion-item'))}
 function visible(el){if(!el.isConnected||el.closest('[hidden]'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight-10&&r.right>0&&r.left<innerWidth}
 function animate(el,frames,options){if(reduce.matches||!el.animate)return null;const a=el.animate(frames,options);running.add(a);a.finished.catch(()=>{}).finally(()=>running.delete(a));return a}
 function titleLines(el){if(!el.matches('h1,h2')||el.dataset.motionLines)return;el.dataset.motionLines='true';const lines=[];let line=document.createElement('span');line.className='motion-title-line';for(const node of [...el.childNodes]){if(node.nodeName==='BR'){lines.push(line);line=document.createElement('span');line.className='motion-title-line'}else line.append(node)}lines.push(line);el.replaceChildren(...lines)}
 function register(el){if(prepared.has(el))return;prepared.add(el);titleLines(el);observer.observe(el)}
 function count(el){
  if(counters.has(el)||reduce.matches)return;const text=el.textContent.trim();if(!/^[0-9,]+$/.test(text))return;
  const value=Number(text.replaceAll(',',''));if(value<10)return;counters.add(el);
  const start=performance.now(),formatter=new Intl.NumberFormat('he-IL');let id,lastPaint=0;
  const cancel=()=>{cancelAnimationFrame(id);el.textContent=text;counterCancels.delete(cancel)};
  const tick=now=>{if(reduce.matches||document.hidden||el.closest('[hidden]')){cancel();return}const p=Math.min(1,(now-start)/620);if(now-lastPaint>=48||p===1){el.textContent=formatter.format(Math.round(value*(1-Math.pow(1-p,3))));lastPaint=now}if(p<1)id=requestAnimationFrame(tick);else cancel()};
  counterCancels.add(cancel);id=requestAnimationFrame(tick);
 }
 const counterCancels=new Set();
 function reveal(el,index=0){pending.delete(el);el.classList.remove('motion-pending');if(!visible(el)||reduce.matches)return;seen.add(el);observer.unobserve(el);if(el.matches('h1,h2')){el.querySelectorAll('.motion-title-line').forEach((line,i)=>animate(line,[{opacity:0,translate:'0 16px',rotate:'0deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],{duration:360,delay:index*25+i*55,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}))}else{animate(el,[{opacity:0,translate:'0 14px',scale:el.matches('.room-card,.person,.wall-note')?'.975':'1'},{opacity:1,translate:'0 0',scale:'1'}],{duration:el.matches('.room-card,.person')?360:400,delay:Math.min(index*25,100),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})}
  if(el.matches('.hub-stats>div,.chat-stats>article,.activity-row'))el.querySelectorAll('strong').forEach(count);
 }
 const observer=new IntersectionObserver(entries=>{const incoming=entries.filter(e=>e.isIntersecting&&!seen.has(e.target));if(held){incoming.forEach(e=>pending.add(e.target));return}incoming.forEach((e,i)=>reveal(e.target,i%6))},{threshold:.06,rootMargin:'0px 0px -16px 0px'});
 const scenes=new IntersectionObserver(entries=>{entries.forEach(e=>e.target.dataset.motionVisible=String(e.isIntersecting&&!document.hidden))},{threshold:.05});
 const sceneSelector='.hub-welcome,.section-cover,.room-card,.primary,.hub-cta';const knownScenes=new WeakSet();
 function scan(root){candidates(root).forEach(register);root.querySelectorAll(sceneSelector).forEach(el=>{if(!knownScenes.has(el)){knownScenes.add(el);scenes.observe(el)}})}
 function prepare(id){activeRoom=id;const root=document.getElementById(id);if(!root)return;scan(root);const items=candidates(root);for(const el of items){if(held&&visible(el)){seen.add(el);observer.unobserve(el)}}}
 function enter(id){const root=document.getElementById(id);if(!root||archive.hidden)return;scan(root);const elements=candidates(root).filter(visible);elements.forEach((el,i)=>{if(!seen.has(el)||pending.has(el))reveal(el,i%6)});for(const el of [...pending]){el.classList.remove('motion-pending');pending.delete(el)}}
 window.archiveMotion={hold(value){held=value;if(value){for(const cancel of counterCancels)cancel();counterCancels.clear();for(const a of running)a.cancel();for(const el of pending)el.classList.remove('motion-pending');pending.clear()}},prepare,enter};
 scan(main);document.documentElement.dataset.motion='on';
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1||node.closest('.arcade-stage,.ink-ripple,.motion-title-line'))continue;if(node.matches(selected))register(node);scan(node)}}).observe(main,{childList:true,subtree:true});
 new MutationObserver(()=>{if(!archive.hidden){const id=document.body.dataset.archiveRoom||'home';prepare(id);requestAnimationFrame(()=>enter(id))}}).observe(archive,{attributes:true,attributeFilter:['hidden']});
 if(!archive.hidden){activeRoom=document.body.dataset.archiveRoom||'home';prepare(activeRoom);requestAnimationFrame(()=>enter(activeRoom))}
 reduce.addEventListener('change',()=>{if(reduce.matches){held=false;for(const a of running)a.cancel();for(const cancel of counterCancels)cancel();counterCancels.clear();pending.forEach(el=>el.classList.remove('motion-pending'));pending.clear()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const cancel of counterCancels)cancel();counterCancels.clear();main.querySelectorAll('[data-motion-visible=true]').forEach(el=>el.dataset.motionVisible='false')}else{scenes.disconnect();knownScenesReset()}});
 function knownScenesReset(){main.querySelectorAll(sceneSelector).forEach(el=>scenes.observe(el))}
})();
