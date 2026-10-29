'use strict';
(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:700px)');
 const ease='cubic-bezier(.2,.8,.2,1)',animations=new Set();
 function animate(el,frames,options={}){
  if(preference.matches||document.hidden||!el.animate)return null;
  const animation=el.animate(frames,{duration:240,easing:ease,...options});animations.add(animation);
  animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation;
 }
 window.archiveFeedback=animate;
 const controls='a[href],button:not(:disabled),summary';let press=null;
 function release(cancel=false){
  if(!press)return;const {el,animation}=press;press=null;
  const scale=getComputedStyle(el).scale;animation?.cancel();el.classList.remove('is-pressing');
  if(el.isConnected&&!el.closest('[hidden]'))animate(el,[{scale:scale==='none'?'1':scale},{scale:'1'}],{duration:cancel?140:240});
 }
 document.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary||preference.matches)return;
  const el=e.target.closest(controls);if(!el||el.closest('.arcade-stage')||el.matches('.sheet-grip'))return;
  release(true);el.classList.add('is-pressing');
  press={el,id:e.pointerId,x:e.clientX,y:e.clientY,animation:animate(el,[{scale:'1'},{scale:el.matches('.room-card,.person')?'.985':'.965'}],{duration:110,fill:'forwards'})};
 },{passive:true});
 document.addEventListener('pointermove',e=>{if(press&&e.pointerId===press.id&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>9)release(true)},{passive:true});
 document.addEventListener('pointerup',()=>release(),{passive:true});document.addEventListener('pointercancel',()=>release(true),{passive:true});
 document.addEventListener('scroll',()=>release(true),{passive:true,capture:true});addEventListener('blur',()=>release(true));
 document.addEventListener('click',e=>{if(e.detail===0){const el=e.target.closest(controls);if(el&&!el.closest('.arcade-stage'))animate(el,[{scale:'.975'},{scale:'1'}],{duration:200})}});

 const states=new WeakMap();let drag=null;
 function state(dialog){if(!states.has(dialog))states.set(dialog,{opener:null,animation:null,closing:null,resolve:null});return states.get(dialog)}
 function depth(){document.body.classList.toggle('dialog-open',!!document.querySelector('dialog[open]'))}
 function reset(dialog){dialog.style.removeProperty('translate');dialog.style.removeProperty('--backdrop-opacity');dialog.classList.remove('is-closing','is-dragging')}
 function finishClose(dialog,value){
  if(drag?.dialog===dialog){cancelAnimationFrame(drag.frame);drag=null}
  const item=state(dialog);item.animation?.cancel();item.animation=null;
  if(dialog.open)dialog.close(value);reset(dialog);delete dialog.dataset.dialogState;depth();
  item.resolve?.();item.resolve=null;item.closing=null;
  if(item.opener?.isConnected&&!item.opener.closest('[hidden]'))item.opener.focus({preventScroll:true});
 }
 window.archiveDialogs={
  open(dialog){
   const item=state(dialog);if(item.closing)finishClose(dialog);
   if(dialog.open)return;release(true);item.opener=document.activeElement;dialog.showModal();dialog.scrollTop=0;dialog.dataset.dialogState='opening';depth();
   const sheet=compact.matches&&dialog.id!=='lightbox';
   item.animation=animate(dialog,[{opacity:.3,translate:sheet?'0 38px':'0 14px',scale:sheet?'1':'.985'},{opacity:1,translate:'0 0',scale:'1'}],{duration:sheet?320:260});
   const ready=()=>{if(dialog.open&&!item.closing)dialog.dataset.dialogState='open'};if(item.animation)item.animation.finished.catch(()=>{}).then(ready);else ready();
  },
  close(dialog,value){
   if(!dialog.open)return Promise.resolve();const item=state(dialog);if(item.closing)return item.closing;
   item.animation?.cancel();dialog.classList.add('is-closing');dialog.dataset.dialogState='closing';
   item.closing=new Promise(resolve=>item.resolve=resolve);
   const start=dialog.style.translate||'0 0',sheet=compact.matches&&dialog.id!=='lightbox';
   item.animation=animate(dialog,[{opacity:1,translate:start,scale:'1'},{opacity:0,translate:sheet?'0 42px':'0 8px',scale:sheet?'1':'.99'}],{duration:180,fill:'forwards'});
   const promise=item.closing;if(item.animation)item.animation.finished.catch(()=>{}).then(()=>{if(item.closing===promise)finishClose(dialog,value)});else finishClose(dialog,value);
   return promise;
  }
 };
 for(const dialog of document.querySelectorAll('dialog')){
  if(!dialog.hasAttribute('aria-label')&&!dialog.hasAttribute('aria-labelledby')){
   const title=dialog.querySelector('h2,h3');if(title){title.id||=dialog.id+'-title';dialog.setAttribute('aria-labelledby',title.id)}
   else dialog.setAttribute('aria-label',dialog.id==='dossier'?'תיק אישי':dialog.id==='lightbox'?'צפייה בתמונה':'חלון הארכיון');
  }
  dialog.addEventListener('cancel',e=>{if(e.defaultPrevented)return;e.preventDefault();window.archiveDialogs.close(dialog)});
  dialog.addEventListener('close',()=>{const item=state(dialog);item.animation?.cancel();reset(dialog);depth()});
  if(dialog.id==='lightbox')continue;
  const chrome=document.createElement('div');chrome.className='sheet-chrome';
  const grip=document.createElement('button');grip.type='button';grip.className='sheet-grip';grip.setAttribute('aria-label','סגירת החלון');grip.innerHTML='<span aria-hidden="true"></span>';chrome.append(grip);
  const close=dialog.querySelector(':scope > .close,.picker-close');if(close)chrome.append(close);dialog.prepend(chrome);
  const blocked=()=>dialog.querySelector('.note-submit:disabled');
  let suppressClick=false;
  grip.onclick=()=>{if(suppressClick){suppressClick=false;return}if(!blocked())window.archiveDialogs.close(dialog)};
  grip.addEventListener('pointerdown',e=>{
   if(!compact.matches||e.button!==0||blocked()||state(dialog).closing)return;suppressClick=false;
   state(dialog).animation?.cancel();grip.setPointerCapture(e.pointerId);
   drag={dialog,grip,id:e.pointerId,y:e.clientY,lastY:e.clientY,lastTime:e.timeStamp,velocity:0,distance:0,frame:0};dialog.classList.add('is-dragging');
  });
  grip.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;const delta=e.timeStamp-drag.lastTime;
   if(delta>0)drag.velocity=(e.clientY-drag.lastY)/delta;drag.lastY=e.clientY;drag.lastTime=e.timeStamp;drag.distance=Math.max(0,e.clientY-drag.y);
   if(!drag.frame)drag.frame=requestAnimationFrame(()=>{if(!drag)return;drag.frame=0;dialog.style.translate='0 '+drag.distance+'px';dialog.style.setProperty('--backdrop-opacity',String(Math.max(.4,1-drag.distance/500)))});
  });
  function endDrag(e){
   if(!drag||drag.id!==e.pointerId)return;const item=drag;drag=null;cancelAnimationFrame(item.frame);dialog.classList.remove('is-dragging');suppressClick=item.distance>6||e.type==='pointercancel';
   const velocity=e.timeStamp-item.lastTime<80?item.velocity:0;
   if(e.type!=='pointercancel'&&(item.distance>100||(item.distance>28&&velocity>.6)))window.archiveDialogs.close(dialog);
   else{const start=dialog.style.translate||'0 0';reset(dialog);animate(dialog,[{translate:start},{translate:'0 0'}],{duration:240})}
  }
  grip.addEventListener('pointerup',endDrag);grip.addEventListener('pointercancel',endDrag);
 }
 function cancelAll(){release(true);if(drag){cancelAnimationFrame(drag.frame);reset(drag.dialog);drag=null}for(const animation of animations)animation.cancel();for(const dialog of document.querySelectorAll('dialog.is-closing'))finishClose(dialog)}
 preference.addEventListener('change',()=>{if(preference.matches)cancelAll()});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAll()});
 document.documentElement.classList.add('interaction-ready');
})();
