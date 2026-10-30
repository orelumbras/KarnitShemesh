'use strict';
(() => {
 const home=document.querySelector('#home'),heading=home?.querySelector('.hub-heading');
 if(!heading)return;
 const quick=document.createElement('nav');quick.className='hub-quick';quick.setAttribute('aria-label','קיצורי דרך');
 for(const [id,label] of [['files','התיקים'],['simulation','אוספים את החבורה'],['memories','הקיר שלנו']]){const a=document.createElement('a');a.href='#'+id;a.textContent=label;quick.append(a)}
 heading.append(quick);
 const labels={files:'התיקים',evidence:'הראיות',quiz:'מי כתב את זה?',simulation:'אוספים את החבורה','chat-lab':'מודיעין קבוצתי',heart:'בינינו',memories:'הקיר שלנו'};
 const resume=document.createElement('a');resume.className='continue-room';resume.hidden=true;
 const caption=document.createElement('span'),name=document.createElement('b'),arrow=document.createElement('span');caption.textContent='ממשיכים מאיפה שעצרתם';arrow.textContent='←';arrow.setAttribute('aria-hidden','true');resume.append(caption,name,arrow);
 home.querySelector('.hub-welcome').after(resume);
 function showResume(id){if(!labels[id])return;resume.href='#'+id;name.textContent=labels[id];resume.hidden=false}
 try{showResume(localStorage.getItem('karnit-last-room'))}catch{}
 // A stable five-destination shell: the same controls stay under the thumb in every room.
 const dock=document.querySelector('.room-dock'),switcher=dock.querySelector('.room-switch');
 const icons={
  home:'<path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  files:'<path d="M4 7h6l2-3h8v16H4zM8 12h8M8 16h6"/>',
  simulation:'<path d="m6 6 2-3h8l2 3 2 7v6h-3v-3H7v3H4v-6zM5 10h14M8 13h.01M16 13h.01"/>',
  memories:'<path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h3"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
 };
 function icon(id){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+icons[id]+'</svg>'}
 dock.classList.add('mobile-shell');dock.setAttribute('aria-label','ניווט ראשי');
 const indicator=document.createElement('span');indicator.className='dock-indicator';indicator.setAttribute('aria-hidden','true');
 const destinations=[['home','בית'],['files','התיקים'],['simulation','המשחק'],['memories','הקיר']];
 const links=destinations.map(([id,label])=>{const link=document.createElement('a');link.href='#'+id;link.className='dock-item'+(id==='home'?' room-dock-back':'');link.dataset.shellRoom=id;link.innerHTML=icon(id)+'<span>'+label+'</span>';return link});
 switcher.classList.add('dock-item');switcher.dataset.shellRoom='more';switcher.innerHTML=icon('more')+'<span>עוד</span>';switcher.setAttribute('aria-label','כל האגפים');
 dock.replaceChildren(indicator,...links,switcher);
 const header=document.querySelector('#archive > .nav'),brand=header.querySelector('.brand');header.classList.add('mobile-header');
 const back=document.createElement('a');back.href='#home';back.className='app-context-back';back.setAttribute('aria-label','חזרה לבחירת האגפים');back.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7M15 12H4"/></svg>';
 const headerCopy=document.createElement('div');headerCopy.className='app-header-copy';brand.before(headerCopy);headerCopy.append(brand);
 const contextTitle=document.createElement('button');contextTitle.type='button';contextTitle.className='app-context-title';contextTitle.tabIndex=-1;headerCopy.append(contextTitle);header.prepend(back);
 contextTitle.onclick=()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 let room='home',active=links[0],paintFrame=0,cover=null,coverTop=0,coverHeight=0,headerHeight=66,lastProgress=-1;
 function paint(){
  paintFrame=0;
  const start=Math.max(0,coverTop+coverHeight*.18-headerHeight),end=Math.max(start+100,coverTop+coverHeight-headerHeight*.55);
  const progress=room==='home'||!cover?0:Math.max(0,Math.min(1,(scrollY-start)/(end-start)));
  if(Math.abs(progress-lastProgress)>.001){
   const value=progress.toFixed(3);header.style.setProperty('--header-progress',value);cover?.style.setProperty('--cover-progress',value);lastProgress=progress;
   contextTitle.tabIndex=progress>.6?0:-1;contextTitle.setAttribute('aria-hidden',String(progress<=.6));
   brand.tabIndex=progress>.45?-1:0;brand.setAttribute('aria-hidden',String(progress>.45));
  }
 }
 function schedule(){if(!paintFrame)paintFrame=requestAnimationFrame(paint)}
 function refresh(){
  const r=active.getBoundingClientRect(),base=dock.getBoundingClientRect();
  if(r.width&&base.width){dock.style.setProperty('--dock-x',(r.left-base.left-dock.clientLeft)+'px');dock.style.setProperty('--dock-width',r.width+'px');dock.classList.add('mobile-shell-ready')}
  const next=document.getElementById(room)?.querySelector('.section-cover,.arcade-intro');
  if(cover&&cover!==next)cover.style.removeProperty('--cover-progress');cover=next;
  if(cover){const rect=cover.getBoundingClientRect();coverTop=rect.top+scrollY;coverHeight=rect.height}else{coverTop=0;coverHeight=0}
  headerHeight=header.offsetHeight;lastProgress=-1;schedule();
 }
 function update(id){
  room=id;header.dataset.room=id;back.tabIndex=id==='home'?-1:0;back.setAttribute('aria-hidden',String(id==='home'));
  contextTitle.textContent=labels[id]||'חדר הבקרה';contextTitle.setAttribute('aria-label',(labels[id]||'חדר הבקרה')+' — חזרה לראש האגף');
  const selected=links.find(link=>link.dataset.shellRoom===id)||switcher;
  for(const item of [...links,switcher]){item.hidden=false;item.classList.toggle('is-current',item===selected);if(item===selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')}
  active=selected;
  if(labels[id]){showResume(id);try{localStorage.setItem('karnit-last-room',id)}catch{}}
  refresh();
 }
 window.archiveShell={refresh};
 update(document.body.dataset.archiveRoom||'home');document.addEventListener('archive:room-change',e=>update(e.detail.room));
 document.addEventListener('archive:opened',refresh);addEventListener('scroll',schedule,{passive:true});addEventListener('resize',refresh,{passive:true});document.fonts?.ready.then(refresh);
 // Keep the bottom dock clear of the software keyboard without guessing a device type.
 function keyboard(){const editable=document.activeElement?.matches('input,textarea,[contenteditable=true]'),wasOpen=document.body.classList.contains('keyboard-open'),isOpen=!!editable&&!!window.visualViewport&&innerHeight-window.visualViewport.height>120;document.body.classList.toggle('keyboard-open',isOpen);if(wasOpen&&!isOpen)requestAnimationFrame(refresh)}
 window.visualViewport?.addEventListener('resize',keyboard);document.addEventListener('focusin',keyboard);document.addEventListener('focusout',()=>requestAnimationFrame(keyboard));
 const picker=document.querySelector('#room-picker');new MutationObserver(()=>{document.body.classList.toggle('sheet-lock',picker.open);switcher.setAttribute('aria-expanded',String(picker.open))}).observe(picker,{attributes:true,attributeFilter:['open']});switcher.setAttribute('aria-expanded','false');
 // A horizontal swipe changes photos; a vertical movement remains available for scrolling.
 const photo=document.querySelector('#full-photo');let touch=null;
 photo.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
 photo.addEventListener('touchend',e=>{if(!touch||e.touches.length){touch=null;return}const point=e.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)document.querySelector(dx>0?'#next-photo':'#prev-photo').click()},{passive:true});
 photo.addEventListener('touchcancel',()=>touch=null,{passive:true});
 const search=document.querySelector('#search'),field=document.createElement('div'),clear=document.createElement('button'),results=document.createElement('div');
 field.className='search-field';search.before(field);field.append(search);clear.type='button';clear.className='search-clear';clear.textContent='×';clear.setAttribute('aria-label','ניקוי החיפוש');clear.hidden=true;field.append(clear);
 results.id='search-results';results.className='search-results';results.setAttribute('role','status');field.append(results);search.setAttribute('aria-describedby',results.id);
 search.addEventListener('input',()=>{clear.hidden=!search.value;const count=[...document.querySelectorAll('.person')].filter(el=>!el.hidden).length;results.textContent=search.value?count+' תיקים תואמים':''});
 clear.onclick=()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus({preventScroll:true})};
 const gallery=document.querySelector('#gallery'),count=document.createElement('p');count.className='gallery-count';count.setAttribute('role','status');gallery.before(count);
 const galleryCount=()=>count.textContent=gallery.children.length+' תמונות באוסף';galleryCount();new MutationObserver(galleryCount).observe(gallery,{childList:true});
 document.querySelector('#gallery-filters').addEventListener('click',e=>{const button=e.target.closest('button');if(button)button.scrollIntoView({block:'nearest',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
 const result=document.querySelector('#quiz-result');new MutationObserver(()=>{if(result.textContent)window.archiveFeedback?.(result,[{opacity:.4,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:220})}).observe(result,{childList:true,subtree:true});
 document.querySelector('#future-next').addEventListener('click',()=>{for(const selector of ['#future-name','#future-text'])window.archiveFeedback?.(document.querySelector(selector),[{opacity:.3,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:240})});
})();
