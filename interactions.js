'use strict';
(() => {
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:700px)');
 const fallback={press:100,release:220,sheet:360,close:260};
 const timing=name=>window.ArchiveMotion?.durations?.[name]??fallback[name]??220;
 const easing=()=>window.ArchiveMotion?.ease||'cubic-bezier(.22,1,.36,1)';
 const animations=new Set(),feedback=new WeakMap();
 function track(animation){animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation}
 function canAnimate(el){return !preference.matches&&!document.hidden&&!!el?.animate}
 function animate(el,frames,options={}){
  if(!canAnimate(el))return null;
  const previous=feedback.get(el),keyframes=frames.map(frame=>({...frame}));
  // A second action begins at the painted state, even if the previous release
  // has not finished. Reading before cancellation avoids a one-frame reset.
  if(previous){const style=getComputedStyle(el);for(const property of ['opacity','translate','scale','rotate','transform'])if(property in keyframes[0])keyframes[0][property]=style[property];previous.cancel()}
  const animation=track(el.animate(keyframes,{duration:timing('release'),easing:easing(),...options}));
  feedback.set(el,animation);animation.finished.catch(()=>{}).finally(()=>{if(feedback.get(el)===animation)feedback.delete(el)});return animation;
 }
 window.archiveFeedback=animate;
 const controls='a[href],button:not(:disabled),summary';let press=null;
 function pressFeedback(el,target,duration,fill='none'){
  const visible=getComputedStyle(el).scale,previous=feedback.get(el);previous?.cancel();
  const animation=canAnimate(el)?track(el.animate([{scale:visible==='none'?'1':visible},{scale:target}],{duration,easing:easing(),fill})):null;
  if(animation){feedback.set(el,animation);animation.finished.catch(()=>{}).finally(()=>{if(feedback.get(el)===animation)feedback.delete(el)})}
  return animation;
 }
 function release(cancel=false){
  if(!press)return;const {el}=press;press=null;
  if(el.isConnected&&!el.closest('[hidden]'))pressFeedback(el,'1',cancel?140:timing('release'));
  else feedback.get(el)?.cancel();
  el.classList.remove('is-pressing');
 }
 document.addEventListener('pointerdown',event=>{
  if(event.button!==0||!event.isPrimary||preference.matches)return;
  const el=event.target.closest(controls);if(!el||el.closest('.arcade-stage')||el.matches('.sheet-grip,.note-color'))return;
  release(true);el.classList.add('is-pressing');
  press={el,id:event.pointerId,x:event.clientX,y:event.clientY};
  pressFeedback(el,el.matches('.room-card,.person')?'.985':'.965',timing('press'),'forwards');
 },{passive:true});
 document.addEventListener('pointermove',event=>{if(press&&event.pointerId===press.id&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>9)release(true)},{passive:true});
 document.addEventListener('pointerup',()=>release(),{passive:true});document.addEventListener('pointercancel',()=>release(true),{passive:true});
 document.addEventListener('scroll',()=>release(true),{passive:true,capture:true});addEventListener('blur',()=>release(true));
 document.addEventListener('click',event=>{if(event.detail===0){const el=event.target.closest(controls);if(el&&!el.closest('.arcade-stage')&&!el.matches('.note-color'))animate(el,[{scale:'.975'},{scale:'1'}],{duration:timing('release')})}});

 const states=new WeakMap(),dialogs=new Set();let drag=null;
 function state(dialog){
  if(!states.has(dialog))states.set(dialog,{token:0,opener:null,motion:null,figureMotion:null,closing:null,resolveClose:null});
  return states.get(dialog);
 }
 function depth(){document.body.classList.toggle('dialog-open',!!document.querySelector('dialog[open]'))}
 const isSheet=dialog=>compact.matches&&dialog.id!=='lightbox';
 const offscreen=dialog=>Math.max(64,dialog.offsetHeight+24);
 function visual(dialog){const style=getComputedStyle(dialog);return {opacity:style.opacity,translate:style.translate==='none'?'0px 0px':style.translate,scale:style.scale==='none'?'1':style.scale,'--dialog-dim':style.getPropertyValue('--dialog-dim').trim()||'1'}}
 function applyVisual(dialog,value){for(const [property,val]of Object.entries(value)){if(property.startsWith('--'))dialog.style.setProperty(property,val);else dialog.style[property]=val}}
 function clearVisual(dialog){for(const name of ['opacity','translate','scale','--dialog-dim'])dialog.style.removeProperty(name);dialog.classList.remove('is-closing','is-dragging')}
 function stopMotion(dialog,current=visual(dialog)){
  const item=state(dialog);applyVisual(dialog,current);item.motion?.cancel();item.motion=null;
  item.figureMotion?.cancel();item.figureMotion=null;return current;
 }
 function resolveClose(item,closed){const resolve=item.resolveClose;item.resolveClose=null;item.closing=null;resolve?.(closed)}
 function stopDrag(dialog){if(drag?.dialog===dialog){cancelAnimationFrame(drag.frame);drag=null}dialog.classList.remove('is-dragging')}
 function finishClose(dialog,value,token){
  const item=state(dialog);if(token!==undefined&&token!==item.token)return;
  item.token++;stopDrag(dialog);item.motion?.cancel();item.motion=null;item.figureMotion?.cancel();item.figureMotion=null;
  if(dialog.open)dialog.close(value);clearVisual(dialog);delete dialog.dataset.dialogState;depth();
  resolveClose(item,true);
  if(item.opener?.isConnected&&!item.opener.closest('[hidden]')&&item.opener.getClientRects().length)item.opener.focus({preventScroll:true});
 }
 function transition(dialog,current,target,phase,duration,complete){
  const item=state(dialog),token=++item.token;
  stopMotion(dialog,current);dialog.dataset.dialogState=phase;
  if(!canAnimate(dialog)){applyVisual(dialog,target);complete(token);return}
  item.motion=track(dialog.animate([current,target],{duration,easing:easing(),fill:'both'}));
  const animation=item.motion;
  animation.finished.then(()=>{if(item.token===token&&dialog.open){applyVisual(dialog,target);animation.cancel();item.motion=null;complete(token)}}).catch(()=>{});
 }
 function settleOpen(dialog,current=visual(dialog),duration=timing('sheet')){
  const item=state(dialog);dialog.classList.remove('is-closing','is-dragging');
  transition(dialog,current,{opacity:'1',translate:'0px 0px',scale:'1','--dialog-dim':'1'},'opening',duration,token=>{
   if(item.token!==token||!dialog.open)return;clearVisual(dialog);dialog.dataset.dialogState='open';depth();
  });
 }
 const api={
  open(dialog){
   bind(dialog);const item=state(dialog),alreadyOpen=dialog.open;
   if(alreadyOpen&&!item.closing&&!dialog.classList.contains('is-dragging'))return;
   release(true);stopDrag(dialog);
   let current;
   if(alreadyOpen){current=visual(dialog);item.token++;stopMotion(dialog,current);resolveClose(item,false)}
   else{
    item.opener=document.activeElement;dialog.showModal();dialog.scrollTop=0;
    current={opacity:isSheet(dialog)?'1':'0',translate:isSheet(dialog)?'0px '+offscreen(dialog)+'px':dialog.id==='lightbox'?'0px 0px':'0px 12px',scale:isSheet(dialog)||dialog.id==='lightbox'?'1':'.985','--dialog-dim':'0'};
   }
   depth();
   let duration=isSheet(dialog)?timing('sheet'):timing('release');
   if(alreadyOpen&&isSheet(dialog)){const y=parseFloat(current.translate.split(/\s+/)[1])||0;duration=Math.max(100,duration*Math.sqrt(Math.min(1,Math.abs(y)/offscreen(dialog))))}
   settleOpen(dialog,current,duration);
   if(dialog.id==='lightbox'&&!alreadyOpen&&canAnimate(dialog)){const figure=dialog.querySelector('figure');if(figure)item.figureMotion=track(figure.animate([{scale:'.975'},{scale:'1'}],{duration:timing('sheet'),easing:easing()}))}
  },
  close(dialog,value){
   if(!dialog.open)return Promise.resolve(true);const item=state(dialog);if(item.closing)return item.closing;
   stopDrag(dialog);const current=visual(dialog),sheet=isSheet(dialog);
   item.closing=new Promise(resolve=>item.resolveClose=resolve);const promise=item.closing;
   dialog.classList.add('is-closing');
   const target={opacity:sheet?'1':'0',translate:sheet?'0px '+offscreen(dialog)+'px':dialog.id==='lightbox'?'0px 0px':'0px 12px',scale:sheet||dialog.id==='lightbox'?'1':'.985','--dialog-dim':'0'};
   let duration=timing('close');if(sheet){const y=parseFloat(current.translate.split(/\s+/)[1])||0;duration=Math.max(100,duration*Math.sqrt(Math.max(0,Math.min(1,1-y/offscreen(dialog)))))}
   transition(dialog,current,target,'closing',duration,token=>finishClose(dialog,value,token));return promise;
  }
 };
 window.archiveDialogs=api;
 function bind(dialog){
  if(dialogs.has(dialog))return;dialogs.add(dialog);state(dialog);
  if(!dialog.hasAttribute('aria-label')&&!dialog.hasAttribute('aria-labelledby')){
   const title=dialog.querySelector('h2,h3');if(title){title.id||=dialog.id+'-title';dialog.setAttribute('aria-labelledby',title.id)}
   else dialog.setAttribute('aria-label',dialog.id==='dossier'?'תיק אישי':dialog.id==='lightbox'?'צפייה בתמונה':'חלון הארכיון');
  }
  dialog.addEventListener('cancel',event=>{if(event.defaultPrevented)return;event.preventDefault();api.close(dialog)});
  dialog.addEventListener('close',()=>{if(dialog.open)return;const item=state(dialog);item.token++;stopDrag(dialog);item.motion?.cancel();item.motion=null;item.figureMotion?.cancel();item.figureMotion=null;clearVisual(dialog);delete dialog.dataset.dialogState;resolveClose(item,true);depth()});
  if(dialog.id==='lightbox')return;
  const chrome=document.createElement('div');chrome.className='sheet-chrome';
  const grip=document.createElement('button');grip.type='button';grip.className='sheet-grip';grip.setAttribute('aria-label','סגירת החלון');grip.innerHTML='<span aria-hidden="true"></span>';chrome.append(grip);
  const close=dialog.querySelector(':scope > .close,.picker-close');if(close)chrome.append(close);dialog.prepend(chrome);
  const blocked=()=>dialog.querySelector('.note-submit:disabled');let suppressClick=false;
  grip.onclick=()=>{if(suppressClick){suppressClick=false;return}if(!blocked())api.close(dialog)};
  grip.addEventListener('pointerdown',event=>{
   if(!compact.matches||event.button!==0||blocked()||drag)return;suppressClick=false;
   const item=state(dialog),current=visual(dialog);item.token++;stopMotion(dialog,current);resolveClose(item,false);dialog.classList.remove('is-closing');
   try{grip.setPointerCapture(event.pointerId)}catch{}
   const y=parseFloat(current.translate.split(/\s+/)[1])||0;
   drag={dialog,grip,id:event.pointerId,y:event.clientY,base:y,lastY:event.clientY,lastTime:event.timeStamp,velocity:0,distance:y,gesture:0,frame:0};dialog.classList.add('is-dragging');dialog.dataset.dialogState='dragging';
  });
  function paintDrag(item){item.dialog.style.translate='0px '+item.distance+'px';item.dialog.style.setProperty('--dialog-dim',String(Math.max(0,Math.min(1,1-item.distance/offscreen(item.dialog)))))}
  grip.addEventListener('pointermove',event=>{
   if(!drag||drag.id!==event.pointerId)return;const delta=event.timeStamp-drag.lastTime;
   if(delta>0)drag.velocity=(event.clientY-drag.lastY)/delta;drag.lastY=event.clientY;drag.lastTime=event.timeStamp;drag.gesture=event.clientY-drag.y;drag.distance=Math.max(0,drag.base+drag.gesture);
   if(!drag.frame)drag.frame=requestAnimationFrame(()=>{if(!drag)return;paintDrag(drag);drag.frame=0});
  });
  function endDrag(event){
   if(!drag||drag.id!==event.pointerId)return;const item=drag;drag=null;cancelAnimationFrame(item.frame);paintDrag(item);dialog.classList.remove('is-dragging');
   suppressClick=Math.abs(item.gesture)>6||event.type!=='pointerup';const velocity=event.timeStamp-item.lastTime<80?item.velocity:0;
   if(event.type==='pointerup'&&(item.distance>Math.min(120,offscreen(dialog)*.25)||(item.distance>28&&velocity>.6)))api.close(dialog);
   else settleOpen(dialog,visual(dialog),timing('release'));
  }
  grip.addEventListener('pointerup',endDrag);grip.addEventListener('pointercancel',endDrag);grip.addEventListener('lostpointercapture',endDrag);
 }
 document.querySelectorAll('dialog').forEach(bind);
 function cancelAll(){
  release(true);for(const animation of animations)animation.cancel();
  for(const dialog of dialogs){const item=state(dialog);if(!dialog.open)continue;if(item.closing)finishClose(dialog);else{item.token++;stopDrag(dialog);stopMotion(dialog);clearVisual(dialog);dialog.dataset.dialogState='open'}}
 }
 preference.addEventListener('change',()=>{if(preference.matches)cancelAll()});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAll()});
 document.documentElement.classList.add('interaction-ready');
})();
